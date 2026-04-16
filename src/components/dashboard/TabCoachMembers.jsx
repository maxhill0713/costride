import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Search, X, Phone, Calendar, Dumbbell,
  Minus, AlertTriangle, Star,
  MessageCircle, UserPlus, ChevronRight, ChevronDown,
  Edit3, Send, CheckCircle, Plus, Trash2, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Users,
  Flame, Shield, Upload, Sparkles, MoreHorizontal,
  Lightbulb, Heart, XCircle,
} from 'lucide-react';
import AddClientModal from '../coach/AddClientModal';
import ClientPerformancePanel from './ClientPerformancePanel';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:      '#0b0b0d',
  sidebar: '#0f0f12',
  card:    '#141416',
  card2:   '#18181b',
  brd:     '#222226',
  brd2:    '#2a2a30',
  t1:      '#ffffff',
  t2:      '#8a8a94',
  t3:      '#444450',
  t4:      '#2a2a30',
  cyan:    '#4d7fff',
  cyanD:   'rgba(77,127,255,0.08)',
  cyanB:   'rgba(77,127,255,0.25)',
  red:     '#ff4d6d',
  redD:    'rgba(255,77,109,0.1)',
  redB:    'rgba(255,77,109,0.25)',
  amber:   '#f59e0b',
  amberD:  'rgba(245,158,11,0.1)',
  amberB:  'rgba(245,158,11,0.25)',
  green:   '#22c55e',
  greenD:  'rgba(34,197,94,0.1)',
  greenB:  'rgba(34,197,94,0.25)',
  blue:    '#3b82f6',
  blueD:   'rgba(59,130,246,0.1)',
  blueB:   'rgba(59,130,246,0.25)',
  violet:  '#a78bfa',
};
const FONT = "'DM Sans','Segoe UI',sans-serif";

const AV_COLORS = ['#4d7fff','#22c55e','#f59e0b','#ff4d6d','#a78bfa','#06b6d4','#f97316','#14b8a6'];

/* ─── CSS INJECTION ──────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('tcm-css')) {
  const s = document.createElement('style');
  s.id = 'tcm-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    .tcm-root * { box-sizing: border-box; }
    .tcm-root { font-family: 'DM Sans','Segoe UI',sans-serif; -webkit-font-smoothing: antialiased; }

    @keyframes tcmFadeUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
    @keyframes tcmPulse   { 0%,100% { opacity:.5 } 50% { opacity:1 } }
    @keyframes tcmSlideDown { from { opacity:0; max-height:0; transform:translateY(-6px) } to { opacity:1; max-height:900px; transform:none } }

    .tcm-fu  { animation: tcmFadeUp .4s cubic-bezier(.16,1,.3,1) both; }
    .tcm-sd  { animation: tcmSlideDown .3s cubic-bezier(.16,1,.3,1) both; }
    .tcm-d1  { animation-delay:.04s } .tcm-d2 { animation-delay:.08s }
    .tcm-d3  { animation-delay:.12s } .tcm-d4 { animation-delay:.16s }

    .tcm-row {
      transition: background .13s, border-color .13s;
      cursor: pointer;
    }
    .tcm-row:hover { background: #1a1a1e !important; }
    .tcm-row:hover .tcm-row-actions { opacity: 1 !important; pointer-events: auto !important; }
    .tcm-row-actions { opacity: 0; pointer-events: none; transition: opacity .15s; }

    .tcm-btn {
      font-family: 'DM Sans','Segoe UI',sans-serif;
      cursor: pointer; outline: none; border: none;
      transition: all .18s cubic-bezier(.16,1,.3,1);
      display: inline-flex; align-items: center; gap: 6px;
    }
    .tcm-btn:hover { transform: translateY(-1px); }
    .tcm-btn:active { transform: scale(.97); }

    .tcm-input {
      width: 100%;
      background: rgba(255,255,255,0.03);
      border: 1px solid #222226;
      color: #ffffff;
      font-size: 13px;
      font-family: 'DM Sans','Segoe UI',sans-serif;
      outline: none;
      border-radius: 8px;
      padding: 10px 14px;
      transition: all .18s;
    }
    .tcm-input:focus {
      border-color: rgba(77,127,255,0.4);
      background: rgba(77,127,255,0.04);
    }
    .tcm-input::placeholder { color: #444450; }

    .tcm-select {
      background: rgba(255,255,255,0.03);
      border: 1px solid #222226;
      color: #8a8a94;
      font-size: 12px;
      font-family: 'DM Sans','Segoe UI',sans-serif;
      outline: none;
      border-radius: 8px;
      padding: 7px 11px;
      cursor: pointer;
    }

    .tcm-tab {
      font-family: 'DM Sans','Segoe UI',sans-serif;
      cursor: pointer; outline: none; background: none; border: none;
      position: relative; transition: color .15s;
    }
    .tcm-scr::-webkit-scrollbar { width: 3px; }
    .tcm-scr::-webkit-scrollbar-thumb { background: #222226; border-radius: 3px; }

    .tcm-stat:hover { border-color: #2a2a30 !important; transform: translateY(-1px); transition: all .18s; }

    @media (max-width: 1100px) { .tcm-sidebar { display: none !important; } }
    @media (max-width: 768px)  { .tcm-health-grid { grid-template-columns: 1fr 1fr !important; } }
  `;
  document.head.appendChild(s);
}

/* ─── HELPERS ────────────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 80) return C.green;
  if (s >= 60) return C.t2;
  if (s >= 40) return C.amber;
  return C.red;
}
function scoreTier(s) {
  if (s >= 80) return { label: 'Healthy', color: C.green, bg: C.greenD, bdr: C.greenB };
  if (s >= 60) return { label: 'Stable',  color: C.t2,   bg: 'rgba(138,138,148,0.08)', bdr: 'rgba(138,138,148,0.2)' };
  if (s >= 40) return { label: 'Caution', color: C.amber, bg: C.amberD, bdr: C.amberB };
  return             { label: 'At Risk', color: C.red,   bg: C.redD,   bdr: C.redB };
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
  if (client.lastVisit >= 21) return { label: 'Call them', icon: Phone, color: C.red };
  if (client.lastVisit >= 14) return { label: 'Send message', icon: MessageCircle, color: C.amber };
  if (client.sessionsThisMonth < client.sessionsLastMonth) return { label: 'Book session', icon: Calendar, color: C.cyan };
  if (client.consecutiveMissed >= 2) return { label: 'Check in', icon: Heart, color: C.amber };
  return { label: 'Message', icon: MessageCircle, color: C.cyan };
}
const SEV = {
  Active:  { color: C.red,   dim: C.redD,   bdr: C.redB },
  Monitor: { color: C.amber, dim: C.amberD, bdr: C.amberB },
  Mild:    { color: C.cyan,  dim: C.cyanD,  bdr: C.cyanB },
  Cleared: { color: C.green, dim: C.greenD, bdr: C.greenB },
};

/* ─── AVATAR ─────────────────────────────────────────────────── */
function Avatar({ name = '?', size = 36, src = null, status, ci }) {
  const [imgFail, setImgFail] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const col = AV_COLORS[(ci ?? name.charCodeAt(0)) % AV_COLORS.length];
  const statusColors = { active: C.green, at_risk: C.red, paused: C.amber };
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: col + '1a', color: col,
        fontSize: size * 0.32, fontWeight: 800, letterSpacing: '-.02em',
        border: `1.5px solid ${col}33`, fontFamily: 'monospace',
      }}>
        {src && !imgFail
          ? <img src={src} alt={name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFail(true)} />
          : initials}
      </div>
      {status && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: Math.max(8, size * 0.22), height: Math.max(8, size * 0.22), borderRadius: '50%',
          background: statusColors[status] || C.t3,
          border: `2px solid ${C.bg}`,
        }} />
      )}
    </div>
  );
}

/* ─── PILL ───────────────────────────────────────────────────── */
function Pill({ children, color, bg, bdr, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color: color || C.t2,
      background: bg || 'rgba(138,138,148,0.08)',
      border: `1px solid ${bdr || 'rgba(138,138,148,0.2)'}`,
      borderRadius: 20, padding: '2.5px 8px',
      letterSpacing: '.04em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', lineHeight: '16px',
      fontFamily: FONT, ...style,
    }}>{children}</span>
  );
}

/* ─── LABEL ──────────────────────────────────────────────────── */
function Label({ children, style }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: C.t3,
      textTransform: 'uppercase', letterSpacing: '.07em', ...style,
    }}>{children}</div>
  );
}

/* ─── TREND LINE ─────────────────────────────────────────────── */
function TrendLine({ data = [], color = C.cyan, w = 80, h = 28 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...data), max = Math.max(...data), rng = (max - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    4 + (1 - (v - min) / rng) * (h - 8),
  ]);
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
  const uid = color.replace(/[^a-z0-9]/gi, '');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"
      style={{ display: 'block', overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`tg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#tg-${uid})`} />
      <path d={line} stroke={color} strokeWidth="1.6" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.5" fill={C.card} stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/* ─── HEALTH BAR ─────────────────────────────────────────────── */
function HealthBar({ segments, height = 4 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div style={{ display: 'flex', gap: 2, height, borderRadius: 99, overflow: 'hidden' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{
          flex: seg.value / total,
          background: seg.color,
          borderRadius: 99, minWidth: seg.value > 0 ? 4 : 0,
          opacity: 0.8,
        }} />
      ))}
    </div>
  );
}

/* ─── BUILD CLIENT FROM BOOKINGS ─────────────────────────────── */
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

/* ─── PRESETS ────────────────────────────────────────────────── */
const PRESETS = [
  { id:'checkin',  label:'Check-in',        text: fn=>`Hey ${fn} 👋 Just checking in — how are things going? Would love to see you back this week.` },
  { id:'missed',   label:'Missed sessions', text: fn=>`Hi ${fn}, we noticed you haven't been in for a bit. Just checking everything's okay.` },
  { id:'congrats', label:'Celebrate',       text: fn=>`${fn} — you've been absolutely crushing it lately! Your consistency is seriously impressive 💪` },
  { id:'upgrade',  label:'Upgrade offer',   text: fn=>`Hey ${fn}, given how consistent you've been, I think you'd get a lot from stepping up your plan. Want to chat options?` },
  { id:'welcome',  label:'Welcome back',    text: fn=>`Hi ${fn}, great to have you back! We've got some exciting sessions lined up — let's pick up right where you left off.` },
];

/* ─── HEALTH OVERVIEW ────────────────────────────────────────── */
function HealthOverview({ clients }) {
  const healthy  = clients.filter(c => c.retentionScore >= 80).length;
  const stable   = clients.filter(c => c.retentionScore >= 60 && c.retentionScore < 80).length;
  const caution  = clients.filter(c => c.retentionScore >= 40 && c.retentionScore < 60).length;
  const atRisk   = clients.filter(c => c.retentionScore < 40).length;
  const total    = clients.length || 1;
  const avgScore = Math.round(clients.reduce((s,c) => s + c.retentionScore, 0) / total);
  const prevAvg  = Math.round(clients.reduce((s,c) => {
    const h = c.retentionHistory;
    return s + (h && h.length >= 5 ? h[h.length - 5] : c.retentionScore);
  }, 0) / total);
  const trendDelta = avgScore - prevAvg;
  const trendDir = trendDelta > 2 ? 'up' : trendDelta < -2 ? 'down' : 'flat';
  const improving = clients.filter(c => trendOf(c.retentionHistory).dir === 'up').length;
  const declining = clients.filter(c => trendOf(c.retentionHistory).dir === 'down').length;
  const sc = scoreColor(avgScore);

  const statCards = [
    { label: 'Active',  val: clients.filter(c => c.status === 'active').length, col: C.cyan,  pct: '+8%',  up: true  },
    { label: 'At Risk', val: atRisk,                                             col: C.red,   pct: '-2%',  up: false },
    { label: 'New',     val: clients.filter(c => c.isNew).length,               col: C.blue,  pct: '+24%', up: true  },
    { label: 'Avg/mo',  val: `$${Math.round(clients.reduce((s,c)=>s+c.monthlySpend,0)/total)}`, col: C.t1, pct: '+5%', up: true },
  ];

  return (
    <div className="tcm-fu tcm-d1" style={{ marginBottom: 20 }}>
      <div className="tcm-health-grid" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 10 }}>
        {/* Portfolio Health */}
        <div className="tcm-stat" style={{
          padding: '18px 20px', borderRadius: 12,
          background: C.card, border: `1px solid ${C.brd}`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20, width: 120, height: 120,
            background: `radial-gradient(circle, ${sc}12, transparent 70%)`,
          }} />
          <Label style={{ marginBottom: 12 }}>Portfolio Health</Label>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 44, fontWeight: 700, color: sc, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {avgScore || '—'}
            </div>
            {trendDir !== 'flat' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
                {trendDir === 'up'
                  ? <ArrowUpRight style={{ width: 13, height: 13, color: C.green }} />
                  : <ArrowDownRight style={{ width: 13, height: 13, color: C.red }} />}
                <span style={{ fontSize: 13, fontWeight: 700, color: trendDir === 'up' ? C.green : C.red }}>
                  {trendDelta > 0 ? '+' : ''}{trendDelta}
                </span>
              </div>
            )}
          </div>
          <HealthBar segments={[
            { value: healthy, color: C.green },
            { value: stable,  color: C.t3    },
            { value: caution, color: C.amber  },
            { value: atRisk,  color: C.red    },
          ]} />
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            {[
              { col: C.green, label: 'Healthy', v: healthy },
              { col: C.t3,    label: 'Stable',  v: stable  },
              { col: C.amber, label: 'Caution', v: caution },
              { col: C.red,   label: 'Risk',    v: atRisk  },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.col }} />
                <span style={{ fontSize: 10, color: C.t3 }}>{s.v} {s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        {statCards.map((s, i) => (
          <div key={i} className="tcm-stat" style={{
            padding: '18px 20px', borderRadius: 12,
            background: C.card, border: `1px solid ${C.brd}`,
          }}>
            <Label style={{ marginBottom: 12 }}>{s.label}</Label>
            <div style={{ fontSize: 38, fontWeight: 700, color: s.col, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 8 }}>
              {s.val}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: s.up ? C.cyan : C.red }}>
              {s.up ? <ArrowUpRight style={{ width: 11, height: 11 }} /> : <ArrowDownRight style={{ width: 11, height: 11 }} />}
              {s.pct} vs last month
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PRIORITY CLIENTS ───────────────────────────────────────── */
function PriorityClients({ clients, onSelect }) {
  const priority = clients
    .filter(c => c.status === 'at_risk' || (c.status === 'paused' && c.lastVisit > 14))
    .sort((a, b) => a.retentionScore - b.retentionScore)
    .slice(0, 4);
  if (priority.length === 0) return null;

  return (
    <div className="tcm-fu tcm-d2" style={{ marginBottom: 20 }}>
      <div style={{
        borderRadius: 12, background: C.card,
        border: `1px solid ${C.redB}`,
        borderLeft: `3px solid ${C.red}`,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '12px 18px', borderBottom: `1px solid ${C.brd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.redD,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.red,
              animation: 'tcmPulse 2s ease infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Priority Outreach</span>
            <Pill color={C.red} bg={C.redD} bdr={C.redB}>{priority.length} client{priority.length > 1 ? 's' : ''}</Pill>
          </div>
          <span style={{ fontSize: 10, color: C.t3 }}>Sorted by urgency</span>
        </div>
        {priority.map((client, i) => {
          const reasons = riskReason(client);
          const action  = suggestedAction(client);
          const ActionIcon = action.icon;
          const sc = scoreColor(client.retentionScore);
          return (
            <div key={client.id} className="tcm-row" onClick={() => onSelect(client)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 18px', fontFamily: FONT,
                borderBottom: i < priority.length - 1 ? `1px solid ${C.brd}` : 'none',
              }}>
              <Avatar name={client.name} size={36} status={client.status}
                ci={client.name.charCodeAt(0)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 2 }}>{client.name}</div>
                <div style={{ fontSize: 11, color: C.red }}>{reasons[0] || 'Low engagement'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <TrendLine data={client.retentionHistory} color={sc} w={50} h={20} />
                <span style={{ fontSize: 20, fontWeight: 700, color: sc, minWidth: 32, textAlign: 'right' }}>
                  {client.retentionScore}
                </span>
              </div>
              <button className="tcm-btn" onClick={e => e.stopPropagation()} style={{
                padding: '7px 14px', borderRadius: 7,
                background: action.color === C.red ? C.redD : action.color === C.amber ? C.amberD : C.cyanD,
                border: `1px solid ${action.color === C.red ? C.redB : action.color === C.amber ? C.amberB : C.cyanB}`,
                color: action.color, fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>
                <ActionIcon style={{ width: 11, height: 11 }} />
                {action.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── INSIGHTS PANEL ─────────────────────────────────────────── */
function InsightsPanel({ clients }) {
  const atRiskCount = clients.filter(c => c.status === 'at_risk').length;
  const avgSessions = clients.length > 0
    ? (clients.reduce((s,c) => s + c.sessionsThisMonth, 0) / clients.length).toFixed(1) : 0;
  const highStreaks = clients.filter(c => c.streak >= 14).length;
  const newClients  = clients.filter(c => c.isNew).length;

  const insights = [
    atRiskCount > 0 && { icon: AlertTriangle, color: C.red,   text: `${atRiskCount} client${atRiskCount > 1 ? 's' : ''} at risk of churning this week` },
    avgSessions > 0  && { icon: Sparkles,     color: C.cyan,  text: `Average ${avgSessions} sessions/month across your roster` },
    highStreaks > 0  && { icon: Flame,         color: C.amber, text: `${highStreaks} client${highStreaks > 1 ? 's' : ''} on a 14+ day streak` },
    newClients > 0   && { icon: UserPlus,      color: C.blue,  text: `${newClients} new client${newClients > 1 ? 's' : ''} joined this month` },
    { icon: Lightbulb, color: C.green, text: 'Clients attending 2×/week retain 3× longer than 1×/week' },
  ].filter(Boolean).slice(0, 4);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Insights</span>
        <Sparkles style={{ width: 12, height: 12, color: C.cyan }} />
      </div>
      <div style={{ padding: '8px' }}>
        {insights.map((ins, i) => {
          const Ic = ins.icon;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '9px 10px', borderRadius: 8, cursor: 'default',
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: ins.color + '15', border: `1px solid ${ins.color}25`,
              }}>
                <Ic style={{ width: 11, height: 11, color: ins.color }} />
              </div>
              <span style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.55 }}>{ins.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── RETENTION BREAKDOWN ────────────────────────────────────── */
function RetentionBreakdown({ clients }) {
  const tiers = [
    { label: 'Healthy', range: '80–100', count: clients.filter(c => c.retentionScore >= 80).length, color: C.green },
    { label: 'Stable',  range: '60–79',  count: clients.filter(c => c.retentionScore >= 60 && c.retentionScore < 80).length, color: C.t2 },
    { label: 'Caution', range: '40–59',  count: clients.filter(c => c.retentionScore >= 40 && c.retentionScore < 60).length, color: C.amber },
    { label: 'At Risk', range: '< 40',   count: clients.filter(c => c.retentionScore < 40).length,  color: C.red },
  ];
  const total = clients.length || 1;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 14 }}>Retention Breakdown</div>
      {tiers.map(tier => {
        const pct = Math.round((tier.count / total) * 100);
        return (
          <div key={tier.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: tier.color }} />
                <span style={{ fontSize: 11.5, color: C.t2, fontWeight: 500 }}>{tier.label}</span>
                <span style={{ fontSize: 9, color: C.t3, fontFamily: 'monospace' }}>{tier.range}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: tier.color }}>{tier.count}</span>
                <span style={{ fontSize: 10, color: C.t3 }}>{pct}%</span>
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: C.brd, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99, background: tier.color,
                width: `${pct}%`, opacity: 0.75,
                transition: 'width .5s cubic-bezier(.16,1,.3,1)',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── TOP PERFORMERS ─────────────────────────────────────────── */
function TopPerformers({ clients, onSelect }) {
  const top = [...clients].sort((a,b) => b.retentionScore - a.retentionScore).slice(0, 3);
  if (top.length === 0) return null;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <Star style={{ width: 12, height: 12, color: C.amber }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Top Performers</span>
      </div>
      {top.map((c, i) => (
        <div key={c.id} onClick={() => onSelect(c)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 8px', borderRadius: 8, cursor: 'pointer',
          transition: 'background .13s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#1a1a1e'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <span style={{ fontSize: 10, color: C.t3, width: 14, fontFamily: 'monospace' }}>{i+1}.</span>
          <Avatar name={c.name} size={28} ci={c.name.charCodeAt(0)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
            <div style={{ fontSize: 10, color: C.t3 }}>{c.sessionsThisMonth} sessions/mo</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor(c.retentionScore) }}>
            {c.retentionScore}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── DROP PANEL TABS ────────────────────────────────────────── */
const DROP_TABS = ['Overview','Performance','Notes','Injuries','Schedule','Actions'];

function DropPanel({ client, onClose }) {
  const [tab,       setTab]       = useState('Overview');
  const [noteVal,   setNoteVal]   = useState(client.notes);
  const [noteSaved, setNoteSaved] = useState(false);
  const [custom,    setCustom]    = useState('');
  const [preset,    setPreset]    = useState(null);
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [injuries,  setInjuries]  = useState(client.injuries || []);
  const [addInj,    setAddInj]    = useState(false);
  const [injForm,   setInjForm]   = useState({ area:'', severity:'Monitor', note:'' });

  const fn       = client.name.split(' ')[0];
  const isRisk   = client.status === 'at_risk';
  const sc       = scoreColor(client.retentionScore);
  const tier     = scoreTier(client.retentionScore);
  const trend    = trendOf(client.retentionHistory);
  const delta    = client.sessionsThisMonth - client.sessionsLastMonth;
  const reasons  = riskReason(client);
  const activeInj   = injuries.filter(i => i.severity !== 'Cleared');
  const hasActiveInj = injuries.some(i => i.severity === 'Active');
  const message  = preset ? (PRESETS.find(p => p.id === preset)?.text(fn) || '') : custom;

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
    <div className="tcm-sd" onClick={e => e.stopPropagation()} style={{
      borderTop: `1px solid ${isRisk ? C.redB : C.brd}`,
      background: C.card2,
    }}>
      {/* Drop header */}
      <div style={{
        padding: '12px 18px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: `1px solid ${C.brd}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={client.name} size={28} status={client.status} ci={client.name.charCodeAt(0)} />
          <div>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{client.name}</span>
            <span style={{ fontSize: 10, color: C.t3, marginLeft: 8 }}>Since {client.joinDate}</span>
          </div>
          <Pill color={tier.color} bg={tier.bg} bdr={tier.bdr}>{tier.label}</Pill>
        </div>
        <button className="tcm-btn" onClick={onClose} style={{
          width: 26, height: 26, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: `1px solid ${C.brd}`, color: C.t3,
        }}>
          <X style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.brd}`, padding: '0 8px',
        background: 'rgba(255,255,255,0.01)' }}>
        {DROP_TABS.map(t => {
          const isAct = tab === t;
          const badge = t === 'Injuries' ? activeInj.length : 0;
          return (
            <button key={t} className="tcm-tab" onClick={() => setTab(t)} style={{
              padding: '10px 14px', fontSize: 11.5,
              borderBottom: `2px solid ${isAct ? C.cyan : 'transparent'}`,
              color: isAct ? C.cyan : C.t3, fontWeight: isAct ? 700 : 400,
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {t}
              {badge > 0 && (
                <Pill color={hasActiveInj ? C.red : C.amber} style={{ fontSize: 8, padding: '0 5px' }}>{badge}</Pill>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px 20px', fontFamily: FONT }}>

        {/* OVERVIEW */}
        {tab === 'Overview' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '14px 16px', borderRadius: 10, marginBottom: 14,
              background: sc + '0a', border: `1px solid ${sc}18`,
            }}>
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <div style={{ fontSize: 42, fontWeight: 700, color: sc, lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {client.retentionScore}
                </div>
                <div style={{ fontSize: 9, color: sc, fontWeight: 700, marginTop: 5,
                  textTransform: 'uppercase', letterSpacing: '.06em' }}>{tier.label}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  {trend.dir === 'up'   && <ArrowUpRight style={{ width: 12, height: 12, color: C.green }} />}
                  {trend.dir === 'down' && <ArrowDownRight style={{ width: 12, height: 12, color: C.red }} />}
                  {trend.dir === 'flat' && <Minus style={{ width: 12, height: 12, color: C.t3 }} />}
                  <span style={{ fontSize: 11, fontWeight: 700,
                    color: trend.dir === 'up' ? C.green : trend.dir === 'down' ? C.red : C.t3 }}>
                    {trend.dir === 'up'   ? `+${trend.delta} pts — Improving`
                      : trend.dir === 'down' ? `${trend.delta} pts — Declining`
                      : 'Holding steady'}
                  </span>
                </div>
                <TrendLine data={client.retentionHistory} color={sc} w={200} h={30} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { l: 'Sessions / mo', v: client.sessionsThisMonth, c: delta > 0 ? C.green : delta < 0 ? C.red : C.t1 },
                { l: 'Monthly spend', v: `£${client.monthlySpend}`, c: C.t1 },
                { l: 'Streak',        v: client.streak > 0 ? `${client.streak}d` : '—', c: client.streak >= 14 ? C.green : C.t1 },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '11px 12px', borderRadius: 8, textAlign: 'center',
                  background: C.card, border: `1px solid ${C.brd}`,
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</div>
                  <Label style={{ marginTop: 6 }}>{s.l}</Label>
                </div>
              ))}
            </div>

            {isRisk && (
              <div style={{
                padding: '13px 14px', borderRadius: 10, marginBottom: 8,
                background: C.redD, border: `1px solid ${C.redB}`,
                borderLeft: `3px solid ${C.red}`,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <AlertTriangle style={{ width: 13, height: 13, color: C.red, flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 3 }}>High churn risk</div>
                  <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.55 }}>
                    {reasons.join(' · ')}. A personal call beats any automated message.
                  </div>
                </div>
                <button className="tcm-btn" onClick={() => setTab('Actions')} style={{
                  padding: '5px 12px', borderRadius: 6,
                  background: C.redD, border: `1px solid ${C.redB}`,
                  color: C.red, fontSize: 10.5, fontWeight: 600, flexShrink: 0,
                }}>
                  Take action <ChevronRight style={{ width: 9, height: 9 }} />
                </button>
              </div>
            )}
            {client.streak >= 21 && (
              <div style={{
                padding: '11px 14px', borderRadius: 10,
                background: C.greenD, border: `1px solid ${C.greenB}`,
                borderLeft: `3px solid ${C.green}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Flame style={{ width: 12, height: 12, color: C.amber, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: C.t2 }}>
                  <strong style={{ color: C.green }}>{client.streak}-day streak!</strong> Recognition drives retention.
                </span>
              </div>
            )}
            {!isRisk && client.streak < 21 && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: C.card, border: `1px solid ${C.brd}`,
                borderLeft: `3px solid ${C.green}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle style={{ width: 11, height: 11, color: C.green, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.t3 }}>On track — no action needed right now.</span>
              </div>
            )}
          </div>
        )}

        {/* PERFORMANCE */}
        {tab === 'Performance' && <ClientPerformancePanel clientId={client.id} clientName={client.name} />}

        {/* NOTES */}
        {tab === 'Notes' && (
          <div>
            <Label style={{ marginBottom: 10 }}>Coach Notes — Private</Label>
            <textarea className="tcm-input" rows={5} value={noteVal}
              onChange={e => setNoteVal(e.target.value)}
              placeholder={`Add coaching notes for ${fn}…`}
              style={{ resize: 'vertical', lineHeight: 1.6 }} />
            <button className="tcm-btn" onClick={saveNote} style={{
              marginTop: 10, padding: '8px 16px', borderRadius: 8,
              background: noteSaved ? C.greenD : C.cyanD,
              border: `1px solid ${noteSaved ? C.greenB : C.cyanB}`,
              color: noteSaved ? C.green : C.cyan, fontSize: 12, fontWeight: 600,
            }}>
              {noteSaved ? <><CheckCircle style={{ width: 11 }} /> Saved</> : <><Edit3 style={{ width: 11 }} /> Save Notes</>}
            </button>
            <div style={{ marginTop: 18 }}>
              <Label style={{ marginBottom: 10 }}>Quick Reference</Label>
              {[
                { l: 'Member since', v: client.joinDate },
                { l: 'Sessions / mo', v: client.sessionsThisMonth },
                { l: 'Last visit', v: client.lastVisit >= 999 ? 'Never' : client.lastVisit === 0 ? 'Today' : `${client.lastVisit}d ago` },
                { l: 'Streak', v: client.streak > 0 ? `${client.streak}d` : '—' },
              ].map((r, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.brd}` : 'none',
                }}>
                  <span style={{ fontSize: 11.5, color: C.t3 }}>{r.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, fontFamily: 'monospace' }}>{r.v}</span>
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
                  <div style={{ fontSize: 11, color: hasActiveInj ? C.red : C.amber, fontWeight: 600, marginTop: 4 }}>
                    {activeInj.length} active restriction{activeInj.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <button className="tcm-btn" onClick={() => setAddInj(v => !v)} style={{
                padding: '6px 12px', borderRadius: 7,
                background: C.cyanD, border: `1px solid ${C.cyanB}`,
                color: C.cyan, fontSize: 11, fontWeight: 600,
              }}>
                <Plus style={{ width: 10 }} /> Log
              </button>
            </div>

            {addInj && (
              <div style={{
                padding: 14, borderRadius: 10, marginBottom: 14,
                background: C.card, border: `1px solid ${C.brd}`,
                borderLeft: `3px solid ${C.cyan}`,
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input className="tcm-input" value={injForm.area}
                    onChange={e => setInjForm(f => ({ ...f, area: e.target.value }))}
                    placeholder="Body area (e.g. Left Knee)"
                    style={{ flex: 1 }} />
                  <select className="tcm-select" value={injForm.severity}
                    onChange={e => setInjForm(f => ({ ...f, severity: e.target.value }))}>
                    {['Active','Monitor','Mild','Cleared'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <textarea className="tcm-input" rows={2} value={injForm.note}
                  onChange={e => setInjForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Describe the limitation…" style={{ marginBottom: 10, lineHeight: 1.5 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="tcm-btn" onClick={addInjury} style={{
                    flex: 1, padding: '8px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    background: C.cyan, color: '#fff',
                  }}>Save</button>
                  <button className="tcm-btn" onClick={() => setAddInj(false)} style={{
                    padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                    background: C.card, border: `1px solid ${C.brd}`, color: C.t3,
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {injuries.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', borderRadius: 10,
                background: C.card, border: `1px solid ${C.brd}` }}>
                <Shield style={{ width: 18, height: 18, color: C.t3, margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: C.t2, fontWeight: 600, margin: '0 0 4px' }}>No injuries logged</p>
                <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>{fn} has no active restrictions on file.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {injuries.map(inj => {
                  const s = SEV[inj.severity] || SEV.Mild;
                  return (
                    <div key={inj.id} style={{
                      padding: '12px 14px', borderRadius: 10,
                      background: C.card, border: `1px solid ${C.brd}`,
                      borderLeft: `3px solid ${s.color}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.t1, flex: 1 }}>{inj.area}</span>
                        <Pill color={s.color} bg={s.dim} bdr={s.bdr}>{inj.severity}</Pill>
                        <button className="tcm-btn" onClick={() => setInjuries(p => p.filter(i => i.id !== inj.id))}
                          style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', background: 'transparent', color: C.t3 }}
                          onMouseEnter={e => e.currentTarget.style.color = C.red}
                          onMouseLeave={e => e.currentTarget.style.color = C.t3}>
                          <Trash2 style={{ width: 10 }} />
                        </button>
                      </div>
                      {inj.note && <p style={{ fontSize: 11.5, color: C.t2, margin: '0 0 4px', lineHeight: 1.55 }}>{inj.note}</p>}
                      <span style={{ fontSize: 10, color: C.t3 }}>Logged {inj.logged}</span>
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
                borderRadius: 10, marginBottom: 14,
                background: C.cyanD, border: `1px solid ${C.cyanB}`,
              }}>
                <Calendar style={{ width: 14, height: 14, color: C.cyan, flexShrink: 0 }} />
                <div>
                  <Label style={{ marginBottom: 3 }}>Next session</Label>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>{client.nextSession}</div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 14,
                background: C.card, border: `1px solid ${C.brd}`,
                borderLeft: `3px solid ${C.t4}`,
              }}>
                <p style={{ fontSize: 12, color: C.t2, margin: 0, fontWeight: 600 }}>No upcoming sessions booked.</p>
              </div>
            )}
            {client.upcomingClasses?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {client.upcomingClasses.map((cls, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 8,
                    background: C.card, border: `1px solid ${C.brd}`,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.cyan }} />
                    <span style={{ flex: 1, fontSize: 12, color: C.t1 }}>{cls}</span>
                    <Label>Booked</Label>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { l: 'This Month', v: client.sessionsThisMonth, c: C.t1 },
                { l: 'Last Month', v: client.sessionsLastMonth, c: C.t2 },
                { l: 'Change',     v: `${delta >= 0 ? '+' : ''}${delta}`, c: delta >= 0 ? C.green : C.red },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '11px 12px', borderRadius: 8, textAlign: 'center',
                  background: C.card, border: `1px solid ${C.brd}`,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</div>
                  <Label style={{ marginTop: 5 }}>{s.l}</Label>
                </div>
              ))}
            </div>
            <button className="tcm-btn" style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: C.cyanD, border: `1px solid ${C.cyanB}`,
              color: C.cyan, fontSize: 12, fontWeight: 600,
              justifyContent: 'center', gap: 6,
            }}>
              <Calendar style={{ width: 12 }} /> Book into a Class
            </button>
          </div>
        )}

        {/* ACTIONS */}
        {tab === 'Actions' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                { icon: Phone,    label: 'Call',    color: C.green },
                { icon: Calendar, label: 'Book',    color: C.cyan  },
                { icon: Dumbbell, label: 'Workout', color: C.amber },
              ].map(({ icon: Ic, label, color }, i) => (
                <button key={i} className="tcm-btn" style={{
                  flex: '1 1 auto', justifyContent: 'center', padding: '10px 14px', borderRadius: 8,
                  background: color + '10', border: `1px solid ${color}25`,
                  color, fontSize: 12, fontWeight: 600,
                }}>
                  <Ic style={{ width: 12 }} /> {label}
                </button>
              ))}
            </div>

            <Label style={{ marginBottom: 10 }}>Send Message to {fn}</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {PRESETS.map(p => (
                <button key={p.id} className="tcm-btn" onClick={() => setPreset(v => v === p.id ? null : p.id)} style={{
                  padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                  background: preset === p.id ? C.cyanD : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${preset === p.id ? C.cyanB : C.brd}`,
                  color: preset === p.id ? C.cyan : C.t3,
                }}>{p.label}</button>
              ))}
            </div>

            {preset ? (
              <div style={{
                marginBottom: 14, padding: '12px 14px', borderRadius: 10,
                background: C.card, border: `1px solid ${C.brd}`,
                borderLeft: `3px solid ${C.cyan}`,
                fontSize: 12.5, color: C.t2, lineHeight: 1.6,
              }}>{message}</div>
            ) : (
              <textarea className="tcm-input" rows={3} value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder={`Write a message to ${fn}…`}
                style={{ marginBottom: 14, lineHeight: 1.5 }} />
            )}

            <button className="tcm-btn" onClick={handleSend}
              disabled={!message.trim() || sending || sent} style={{
                width: '100%', padding: '10px', borderRadius: 8,
                justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                background: sent ? C.greenD : !message.trim() ? 'rgba(255,255,255,0.03)' : C.cyan,
                border: `1px solid ${sent ? C.greenB : !message.trim() ? C.brd : C.cyanB}`,
                color: sent ? C.green : !message.trim() ? C.t3 : '#fff',
              }}>
              {sent ? <><CheckCircle style={{ width: 12 }} /> Sent</>
                : sending ? 'Sending…'
                : <><Send style={{ width: 12 }} /> Send to {fn}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── CLIENT ROW ─────────────────────────────────────────────── */
function ClientRow({ client, isOpen, onToggle, idx }) {
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
  const lastVisitColor = client.lastVisit === 0 ? C.cyan
    : client.lastVisit > 14 ? C.red : client.lastVisit > 7 ? C.amber : C.t2;

  return (
    <div className={`tcm-fu`} style={{
      borderRadius: 10, overflow: 'hidden',
      background: isOpen ? '#1a1a1e' : C.card,
      border: `1px solid ${isOpen ? C.cyanB : isRisk && !isOpen ? C.redB : C.brd}`,
      borderLeft: `2px solid ${isOpen ? C.cyan : isRisk ? C.red : 'transparent'}`,
      animationDelay: `${Math.min(idx * 0.04, 0.3)}s`,
      transition: 'border-color .15s, background .15s',
    }}>
      <div className="tcm-row" onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
        background: 'transparent',
      }}>
        {/* Avatar + name */}
        <Avatar name={client.name} src={client.avatar} size={38} status={client.status}
          ci={client.name.charCodeAt(0)} />
        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: isOpen ? C.cyan : C.t1, letterSpacing: '-.01em' }}>
              {client.name}
            </span>
            {client.isNew    && <Pill color={C.blue}  bg={C.blueD}  bdr={C.blueB}>New</Pill>}
            {isRisk          && <Pill color={C.red}   bg={C.redD}   bdr={C.redB}>At Risk</Pill>}
            {isPaused && !isRisk && <Pill color={C.t3}>Paused</Pill>}
            {client.streak >= 14 && (
              <span style={{ fontSize: 10, color: C.amber, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Flame style={{ width: 10, height: 10 }} /> {client.streak}d
              </span>
            )}
            {activeInj > 0 && (
              <span style={{ fontSize: 10, fontWeight: 600,
                color: hasActive ? C.red : C.amber, display: 'flex', alignItems: 'center', gap: 2 }}>
                <ShieldAlert style={{ width: 10, height: 10 }} /> {activeInj}
              </span>
            )}
          </div>
          {isRisk && reasons.length > 0
            ? <div style={{ fontSize: 11, color: C.red, fontWeight: 500 }}>{reasons[0]}</div>
            : <div style={{ fontSize: 11, color: C.t3 }}>{client.goal}</div>}
        </div>

        {/* Last visit */}
        <div style={{ flex: '0 0 80px', textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: lastVisitColor }}>{lastVisitLabel}</div>
          <Label style={{ marginTop: 3 }}>Last visit</Label>
        </div>

        {/* Sessions */}
        <div style={{ flex: '0 0 60px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>{client.sessionsThisMonth}</span>
            {delta !== 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: delta > 0 ? C.green : C.red }}>
                {delta > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
          <Label style={{ marginTop: 3 }}>Sessions</Label>
        </div>

        {/* Trend + Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 130px', justifyContent: 'flex-end' }}>
          <TrendLine data={client.retentionHistory} color={sc} w={60} h={24} />
          <div style={{ textAlign: 'right', minWidth: 36 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: sc, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {client.retentionScore}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
              {trend.dir === 'up'   && <ArrowUpRight style={{ width: 8, height: 8, color: C.green }} />}
              {trend.dir === 'down' && <ArrowDownRight style={{ width: 8, height: 8, color: C.red }} />}
              <Label style={{ fontSize: 8 }}>{trend.dir}</Label>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="tcm-row-actions" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {[
            { icon: MessageCircle, color: C.cyan  },
            { icon: Calendar,      color: C.green  },
            { icon: Dumbbell,      color: C.amber  },
          ].map(({ icon: Ic, color }, i) => (
            <button key={i} className="tcm-btn" onClick={e => e.stopPropagation()} style={{
              width: 30, height: 30, borderRadius: 7, justifyContent: 'center',
              background: color + '12', border: `1px solid ${color}20`, color,
            }}>
              <Ic style={{ width: 12, height: 12 }} />
            </button>
          ))}
        </div>

        <ChevronDown style={{
          width: 13, height: 13, flexShrink: 0,
          color: isOpen ? C.cyan : C.t3,
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform .25s cubic-bezier(.16,1,.3,1), color .15s',
        }} />
      </div>

      {isOpen && <DropPanel client={client} onClose={onToggle} />}
    </div>
  );
}

/* ─── PENDING ROW ────────────────────────────────────────────── */
function PendingClientRow({ invite, onCancel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{
      borderRadius: 10, background: C.card,
      border: `1px solid ${C.cyanB}`,
      borderLeft: `2px solid ${C.cyan}`,
      opacity: 0.7,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: C.cyanD, border: `1.5px solid ${C.cyanB}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: C.cyan, fontFamily: 'monospace',
        }}>{ini(invite.member_name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.t1, marginBottom: 2 }}>{invite.member_name}</div>
          <div style={{ fontSize: 11, color: C.t3 }}>Invite sent · awaiting response</div>
        </div>
        <Pill color={C.cyan} bg={C.cyanD} bdr={C.cyanB}>Pending</Pill>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button className="tcm-btn" onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }} style={{
            width: 28, height: 28, borderRadius: 7, justifyContent: 'center',
            background: 'transparent', border: `1px solid ${C.brd}`, color: C.t3,
          }}>
            <MoreHorizontal style={{ width: 12 }} />
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 5px)', zIndex: 100,
                background: C.card2, border: `1px solid ${C.brd2}`,
                borderRadius: 10, overflow: 'hidden', minWidth: 140,
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              }}>
                <button className="tcm-btn" onClick={() => { setMenuOpen(false); onCancel(invite); }} style={{
                  width: '100%', justifyContent: 'flex-start', gap: 8,
                  padding: '10px 14px', background: 'transparent',
                  color: C.red, fontSize: 12, fontWeight: 600,
                }}>
                  <XCircle style={{ width: 12 }} /> Cancel Invite
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ onAddClient }) {
  const steps = [
    { icon: UserPlus, label: 'Add your first client', desc: 'Invite clients to connect with your coaching profile', onClick: onAddClient, color: C.cyan },
    { icon: Upload,   label: 'Import client list',    desc: 'Bulk import from a spreadsheet or CSV file',         color: C.blue  },
    { icon: Calendar, label: 'Create first session',  desc: 'Set up a class or 1:1 session to get started',      color: C.green },
  ];
  return (
    <div className="tcm-fu" style={{
      padding: '56px 36px', textAlign: 'center', borderRadius: 14,
      background: C.card, border: `1px solid ${C.brd}`,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
        background: C.cyanD, border: `1px solid ${C.cyanB}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Users style={{ width: 24, height: 24, color: C.cyan }} />
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: '0 0 8px', letterSpacing: '-.03em', fontFamily: FONT }}>
        Build Your Client Intelligence
      </h3>
      <p style={{ fontSize: 13, color: C.t3, margin: '0 0 32px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65, fontFamily: FONT }}>
        Clients appear here automatically when members book your classes, or you can add them directly.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 580, margin: '0 auto' }}>
        {steps.map((step, i) => {
          const Ic = step.icon;
          return (
            <div key={i} className="tcm-fu" onClick={step.onClick} style={{
              flex: '1 1 160px', maxWidth: 190, padding: '20px 16px', borderRadius: 12,
              textAlign: 'center', cursor: 'pointer',
              background: C.card2, border: `1px solid ${C.brd}`,
              animationDelay: `${i * 0.08}s`,
              transition: 'all .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = step.color + '40'; e.currentTarget.style.background = step.color + '08'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.background = C.card2; e.currentTarget.style.transform = 'none'; }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, margin: '0 auto 12px',
                background: step.color + '12', border: `1px solid ${step.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ic style={{ width: 15, height: 15, color: step.color }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 5, fontFamily: FONT }}>{step.label}</div>
              <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.55, fontFamily: FONT }}>{step.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── MAIN EXPORT ────────────────────────────────────────────── */
export default function TabCoachMembers({
  openModal = () => {},
  coach = null,
  bookings = [],
  checkIns = [],
  avatarMap = {},
  now = new Date(),
}) {
  const [filter,        setFilter]       = useState('all');
  const [search,        setSearch]       = useState('');
  const [sortBy,        setSortBy]       = useState('risk');
  const [openId,        setOpenId]       = useState(null);
  const [showAddModal,  setShowAddModal] = useState(false);

  const coachId      = coach?.id || coach?.user_id;
  const queryClient  = useQueryClient();

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
    return Object.entries(byClient).map(([userId, { name, bookings: cb }]) => ({
      ...buildClientFromBookings(userId, name, cb, checkIns, now),
      avatar: avatarMap?.[userId] || null,
    }));
  }, [bookings, acceptedInvites, checkIns, avatarMap, now]);

  const acceptedMemberIds = allClients.map(c => c.id);
  const pendingMemberIds  = pendingInvites.map(i => i.member_id);
  const atRiskCount    = allClients.filter(c => c.status === 'at_risk').length;
  const newCount       = allClients.filter(c => c.isNew).length;
  const inactiveCount  = allClients.filter(c => c.lastVisit >= 14 || c.lastVisit >= 999).length;
  const highValueCount = allClients.filter(c => c.retentionScore >= 80).length;

  const FILTERS = [
    { id: 'all',        label: 'All Clients', count: allClients.length + pendingInvites.length },
    { id: 'at_risk',    label: 'At Risk',     count: atRiskCount,     urgent: true },
    { id: 'high_value', label: 'High Value',  count: highValueCount },
    { id: 'inactive',   label: 'Inactive',    count: inactiveCount },
    { id: 'new',        label: 'New',         count: newCount },
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
  const hasClients  = allClients.length > 0 || pendingInvites.length > 0;

  function openClient(c) {
    setOpenId(c.id);
    setTimeout(() => {
      document.getElementById(`cr-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 40);
  }

  return (
    <div className="tcm-root" style={{
      background: C.bg, minHeight: '100vh', color: C.t1, fontFamily: FONT,
    }}>
      <AddClientModal
        open={showAddModal} onClose={() => setShowAddModal(false)}
        coach={coach} existingClientIds={acceptedMemberIds} pendingClientIds={pendingMemberIds}
      />

      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 28px 80px' }}>

        {/* ── PAGE HEADER ── */}
        <div className="tcm-fu" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 22, paddingBottom: 20, borderBottom: `1px solid ${C.brd}`,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', marginBottom: 4 }}>
              Members <span style={{ color: C.t3, fontWeight: 300 }}>/</span>{' '}
              <span style={{ color: C.cyan }}>CRM</span>
            </div>
            <div style={{ fontSize: 11, color: C.t3 }}>
              {allClients.length} client{allClients.length !== 1 ? 's' : ''} · AI-powered retention
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {atRiskCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
                borderRadius: 7, background: C.redD, border: `1px solid ${C.redB}`,
                fontSize: 11.5, color: C.red, fontWeight: 600,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.red, animation: 'tcmPulse 2s ease infinite' }} />
                {atRiskCount} At Risk
              </div>
            )}
            <button className="tcm-btn" onClick={() => setShowAddModal(true)} style={{
              padding: '8px 18px', borderRadius: 8,
              background: C.cyan, color: '#fff',
              fontSize: 12, fontWeight: 700,
            }}>
              <UserPlus style={{ width: 13, height: 13 }} /> Add Client
            </button>
          </div>
        </div>

        {!hasClients ? (
          <EmptyState onAddClient={() => setShowAddModal(true)} />
        ) : (
          <>
            <HealthOverview clients={allClients} />
            <PriorityClients clients={allClients} onSelect={openClient} />

            {/* ── CONTROLS ── */}
            <div className="tcm-fu tcm-d3" style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0, flexWrap: 'wrap',
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 13, height: 13, color: C.t3, pointerEvents: 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, goal, or class…"
                  className="tcm-input" style={{ paddingLeft: 36, paddingRight: 34 }} />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: C.t3, display: 'flex', padding: 0,
                  }}>
                    <X style={{ width: 13 }} />
                  </button>
                )}
              </div>
              {/* Sort */}
              <div style={{
                display: 'flex', gap: 2, padding: '3px',
                background: C.card, border: `1px solid ${C.brd}`, borderRadius: 9,
              }}>
                {[
                  { id: 'risk', label: 'Priority' },
                  { id: 'score', label: 'Score' },
                  { id: 'lastVisit', label: 'Last Seen' },
                  { id: 'name', label: 'Name' },
                ].map(s => (
                  <button key={s.id} className="tcm-btn" onClick={() => setSortBy(s.id)} style={{
                    padding: '6px 12px', borderRadius: 7, fontSize: 11.5,
                    fontWeight: sortBy === s.id ? 700 : 400,
                    background: sortBy === s.id ? C.cyanD : 'transparent',
                    border: `1px solid ${sortBy === s.id ? C.cyanB : 'transparent'}`,
                    color: sortBy === s.id ? C.cyan : C.t3, whiteSpace: 'nowrap',
                  }}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* ── FILTER TABS ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              borderBottom: `1px solid ${C.brd}`, marginBottom: 16, marginTop: 0,
            }}>
              {FILTERS.map(f => {
                const isAct = filter === f.id;
                const isUrg = f.urgent && f.count > 0;
                const accent = isAct ? (isUrg ? C.red : C.cyan) : C.t3;
                return (
                  <button key={f.id} className="tcm-tab" onClick={() => setFilter(f.id)} style={{
                    padding: '10px 12px', fontSize: 12,
                    borderBottom: `2px solid ${isAct ? accent : 'transparent'}`,
                    color: accent, fontWeight: isAct ? 700 : 400,
                    marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
                    whiteSpace: 'nowrap',
                  }}>
                    {isUrg && <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.red }} />}
                    {f.label}
                    {f.count > 0 && (
                      <span style={{
                        fontSize: 9.5, fontWeight: 700,
                        background: isAct ? (isUrg ? C.redD : C.cyanD) : 'rgba(255,255,255,0.04)',
                        color: isAct ? accent : C.t3,
                        padding: '1px 7px', borderRadius: 99,
                        border: `1px solid ${isAct ? (isUrg ? C.redB : C.cyanB) : 'transparent'}`,
                      }}>{f.count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── MAIN GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 268px', gap: 16 }}>
              {/* Client list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Column headers */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '0 18px 7px',
                }}>
                  <div style={{ width: 38 }} />
                  <Label style={{ flex: '1 1 160px' }}>Client</Label>
                  <Label style={{ flex: '0 0 80px', textAlign: 'center' }}>Last Visit</Label>
                  <Label style={{ flex: '0 0 60px', textAlign: 'center' }}>Sessions</Label>
                  <Label style={{ flex: '0 0 130px', textAlign: 'right' }}>Engagement</Label>
                  <div style={{ width: 104 }} />
                  <div style={{ width: 13 }} />
                </div>

                {showPending && pendingInvites.map(invite => (
                  <PendingClientRow key={invite.id} invite={invite} onCancel={cancelInviteMutation.mutate} />
                ))}

                {visible.length === 0 && (!showPending || pendingInvites.length === 0) ? (
                  <div style={{
                    padding: 48, textAlign: 'center', borderRadius: 12,
                    background: C.card, border: `1px solid ${C.brd}`,
                  }}>
                    <Search style={{ width: 22, height: 22, color: C.t3, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, color: C.t2, fontWeight: 600, margin: '0 0 4px', fontFamily: FONT }}>
                      {allClients.length === 0 ? 'No clients yet' : 'No clients match this filter'}
                    </p>
                    <p style={{ fontSize: 11.5, color: C.t3, margin: 0, fontFamily: FONT }}>
                      {allClients.length === 0
                        ? 'Clients appear here when members book your classes'
                        : 'Try adjusting your search or filter'}
                    </p>
                  </div>
                ) : visible.map((c, i) => (
                  <div key={c.id} id={`cr-${c.id}`}>
                    <ClientRow
                      client={c} idx={i}
                      isOpen={openId === c.id}
                      onToggle={() => setOpenId(p => p === c.id ? null : c.id)}
                    />
                  </div>
                ))}

                {visible.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 11, color: C.t3, fontFamily: FONT }}>
                    {visible.length} client{visible.length !== 1 ? 's' : ''}
                    {showPending && pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ''}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="tcm-sidebar" style={{
                display: 'flex', flexDirection: 'column',
                position: 'sticky', top: 16, alignSelf: 'start',
              }}>
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
