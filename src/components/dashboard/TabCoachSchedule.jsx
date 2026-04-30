/**
 * TabCoachSchedule — Redesigned to match Content Hub design language.
 * Right sidebar · notification ticker · tab navigation · session cards
 * styled like workout plan cards. Same C tokens, DM Sans, same polish.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  format, subDays, addDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, differenceInMinutes,
} from 'date-fns';
import {
  QrCode, Calendar, Bell, Clock, Check, ChevronDown,
  UserCheck, Users, AlertCircle, CheckCircle, RefreshCw, Pencil,
  X, DollarSign, MapPin, ChevronLeft, ChevronRight,
  TrendingUp, Zap, BarChart2, AlertTriangle, Activity,
  ArrowRight, MessageCircle, UserX, ArrowUpRight, ArrowDownRight,
  Minus, Send, XCircle, Plus, Search, Lightbulb, Target,
  Megaphone, Filter, Flame,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ─── TOKENS (exact match to ContentPage) ───────────────────── */
const C = {
  bg:     '#000000',
  sidebar:'#0f0f12',
  card:   '#141416',
  card2:  '#1a1a1f',
  brd:    '#222226',
  brd2:   '#2a2a30',
  t1:     '#ffffff',
  t2:     '#8a8a94',
  t3:     '#444450',
  cyan:   '#4d7fff',
  cyanD:  'rgba(77,127,255,0.12)',
  cyanB:  'rgba(77,127,255,0.28)',
  red:    '#ff4d6d',
  redD:   'rgba(255,77,109,0.15)',
  redB:   'rgba(255,77,109,0.3)',
  amber:  '#f59e0b',
  amberD: 'rgba(245,158,11,0.13)',
  amberB: 'rgba(245,158,11,0.28)',
  green:  '#22c55e',
  greenD: 'rgba(34,197,94,0.12)',
  greenB: 'rgba(34,197,94,0.28)',
  blue:   '#3b82f6',
  blueD:  'rgba(59,130,246,0.12)',
  blueB:  'rgba(59,130,246,0.28)',
  violet: '#a78bfa',
  violetD:'rgba(167,139,250,0.12)',
  violetB:'rgba(167,139,250,0.28)',
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";
const GRAD = { background: '#2563eb', border: 'none', color: '#fff' };

/* ─── CSS ────────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('tcs2-css')) {
  const s = document.createElement('style');
  s.id = 'tcs2-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    .tcs2*{box-sizing:border-box}
    .tcs2{font-family:'DM Sans','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
    @keyframes tcs2FadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes tcs2FadeIn{from{opacity:0}to{opacity:1}}
    @keyframes tcs2SlideIn{from{transform:translateX(100%);opacity:0}to{transform:none;opacity:1}}
    @keyframes tcs2SlideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(-110%);opacity:0}}
    @keyframes tcs2SlideInR{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes tcs2Pulse{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
    @keyframes tcs2BarFill{from{width:0}to{width:var(--w)}}
    @keyframes tcs2ModalIn{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}
    .tcs2-fu{animation:tcs2FadeUp .35s cubic-bezier(.16,1,.3,1) both}
    .tcs2-fi{animation:tcs2FadeIn .2s ease both}
    .tcs2-si{animation:tcs2SlideIn .28s cubic-bezier(.16,1,.3,1) both}
    .tcs2-card{transition:border-color .15s,box-shadow .15s}
    .tcs2-card:hover{border-color:rgba(77,127,255,0.28)!important;box-shadow:0 0 8px rgba(77,127,255,.07)}
    .tcs2-btn{font-family:'DM Sans','Segoe UI',sans-serif;cursor:pointer;outline:none;border:none;transition:all .18s cubic-bezier(.16,1,.3,1);display:inline-flex;align-items:center;gap:6px}
    .tcs2-btn:hover{opacity:.88}
    .tcs2-btn:active{transform:scale(.97)}
    .tcs2-row{transition:background .1s;cursor:pointer}
    .tcs2-row:hover{background:#1a1a1e!important}
    .tcs2-input{width:100%;background:rgba(255,255,255,.03);border:1px solid #222226;color:#fff;font-size:13px;font-family:'DM Sans','Segoe UI',sans-serif;outline:none;border-radius:8px;padding:10px 14px;transition:all .18s}
    .tcs2-input:focus{border-color:rgba(77,127,255,.4);background:rgba(77,127,255,.04)}
    .tcs2-input::placeholder{color:#444450}
    .tcs2-scr::-webkit-scrollbar{width:3px}
    .tcs2-scr::-webkit-scrollbar-thumb{background:#222226;border-radius:3px}
    .tcs2-live{animation:tcs2Pulse 2s ease infinite}
    .tcs2-bar{animation:tcs2BarFill .7s cubic-bezier(.16,1,.3,1) both;animation-delay:.15s}
    .tcs2-sidebar{width:244px;flex-shrink:0}
    @media(max-width:900px){.tcs2-sidebar{display:none!important}}
  `;
  document.head.appendChild(s);
}

/* ─── CLASS TYPE REGISTRY ─────────────────────────────────────── */
const CLASS_CFG = {
  hiit:       { color: '#f87171', label: 'HIIT',       emoji: '🔥' },
  yoga:       { color: '#34d399', label: 'Yoga',       emoji: '🧘' },
  spin:       { color: C.blue,   label: 'Spin',       emoji: '🚴' },
  strength:   { color: '#fb923c', label: 'Strength',   emoji: '💪' },
  pilates:    { color: C.violet, label: 'Pilates',    emoji: '🌸' },
  boxing:     { color: C.amber,  label: 'Boxing',     emoji: '🥊' },
  crossfit:   { color: '#f97316', label: 'CrossFit',  emoji: '⚡' },
  cardio:     { color: '#f472b6', label: 'Cardio',    emoji: '❤️' },
  functional: { color: C.violet, label: 'Functional', emoji: '🎯' },
  pt:         { color: C.cyan,   label: 'PT',         emoji: '👤' },
  default:    { color: C.cyan,   label: 'Class',      emoji: '🏋️' },
};

function getTypeCfg(cls) {
  const n = (cls.name || cls.class_type || cls.type || '').toLowerCase();
  if (n.includes('personal') || n.includes('pt') || n.includes('appointment')) return { ...CLASS_CFG.pt, key: 'pt' };
  for (const [k, v] of Object.entries(CLASS_CFG)) {
    if (k !== 'default' && n.includes(k)) return { ...v, key: k };
  }
  return { ...CLASS_CFG.default, key: 'default' };
}

/* ─── HELPERS ────────────────────────────────────────────────── */
const LATE_HRS = 24;
function getLateCancel(cls) {
  if (!Array.isArray(cls.late_cancels)) return [];
  return cls.late_cancels.filter(lc => {
    const ca = lc.cancelled_at ? new Date(lc.cancelled_at) : null;
    const cl = cls.start_time ? new Date(cls.start_time) : null;
    return ca && cl && differenceInMinutes(cl, ca) < LATE_HRS * 60;
  });
}
function fillColor(p) { return p >= 80 ? C.green : p >= 50 ? C.cyan : p >= 30 ? C.amber : C.red; }
function fillLabel(p) { return p >= 90 ? 'At Capacity' : p >= 70 ? 'Strong' : p >= 40 ? 'Moderate' : 'Underbooked'; }
function calcRS(userId, checkIns, now) {
  const uci = checkIns.filter(c => c.user_id === userId);
  const ms = d => now - new Date(d.check_in_date);
  const r30 = uci.filter(c => ms(c) < 30 * 864e5).length;
  const p30 = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;
  const sorted = [...uci].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const daysAgo = sorted[0] ? Math.floor(ms(sorted[0]) / 864e5) : 999;
  let score = 100;
  if (daysAgo >= 999) score -= 60; else if (daysAgo > 21) score -= 45; else if (daysAgo > 14) score -= 30; else if (daysAgo > 7) score -= 15;
  if (r30 === 0) score -= 25; else if (r30 <= 2) score -= 15;
  score = Math.max(0, Math.min(100, score));
  const trend = p30 > 0 ? (r30 > p30 * 1.1 ? 'up' : r30 < p30 * .7 ? 'down' : 'flat') : (r30 >= 2 ? 'up' : 'flat');
  const status = score >= 65 ? 'safe' : score >= 35 ? 'at_risk' : 'high_risk';
  const color = status === 'safe' ? C.green : status === 'at_risk' ? C.amber : C.red;
  return { score, status, trend, color, daysAgo, recent30: r30, prev30: p30 };
}

/* ─── PILL ───────────────────────────────────────────────────── */
function Pill({ children, color, bg, bdr, dot, small }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: small ? 9 : 10, fontWeight: 700, color: color || C.t2, background: bg || `${color || C.t2}0d`, border: `1px solid ${bdr || `${color || C.t2}20`}`, borderRadius: 6, padding: small ? '1px 6px' : '2.5px 8px', letterSpacing: '.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: '16px', fontFamily: FONT }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: color || C.t2, display: 'inline-block', flexShrink: 0 }} />}
      {children}
    </span>
  );
}

/* ─── AVATAR CLUSTER ─────────────────────────────────────────── */
function AvatarCluster({ members = [], avatarMap = {}, max = 4, size = 22 }) {
  const shown = members.slice(0, max), extra = members.length - max;
  const colors = [C.cyan, C.violet, C.green, C.blue, C.amber];
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => {
        const ini = (m.user_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const col = colors[i % colors.length];
        return (
          <div key={m.user_id || i} title={m.user_name} style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${C.card}`, marginLeft: i === 0 ? 0 : -size * .35, background: `${col}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .3, fontWeight: 700, color: col, zIndex: shown.length - i, position: 'relative', flexShrink: 0 }}>
            {avatarMap[m.user_id] ? <img src={avatarMap[m.user_id]} alt={m.user_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : ini}
          </div>
        );
      })}
      {extra > 0 && <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${C.card}`, marginLeft: -size * .35, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .28, fontWeight: 700, color: C.t3, flexShrink: 0 }}>+{extra}</div>}
    </div>
  );
}

/* ─── FILL RING ──────────────────────────────────────────────── */
function FillRing({ value = 0, size = 48, stroke = 4, color = C.cyan }) {
  const r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)', filter: `drop-shadow(0 0 3px ${color}50)` }} />
    </svg>
  );
}

/* ─── IBtn ───────────────────────────────────────────────────── */
function IBtn({ icon: Ic, label, color, onClick, size = 'sm' }) {
  const p = size === 'xs' ? '4px 9px' : '7px 13px', fs = size === 'xs' ? 10 : 11;
  return (
    <button className="tcs2-btn" onClick={onClick}
      style={{ padding: p, borderRadius: 8, background: `${color}0a`, border: `1px solid ${color}1c`, color, fontSize: fs, fontWeight: 700, whiteSpace: 'nowrap' }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.borderColor = `${color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}0a`; e.currentTarget.style.borderColor = `${color}1c`; }}>
      {Ic && <Ic style={{ width: size === 'xs' ? 10 : 11, height: size === 'xs' ? 10 : 11 }} />}{label}
    </button>
  );
}

/* ─── CONFIRM DIALOG ─────────────────────────────────────────── */
function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Cancel Class', color = C.red }) {
  return (
    <div className="tcs2-fi" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)' }}>
      <div className="tcs2-fu" style={{ background: C.card, border: `1px solid ${color}25`, borderRadius: 16, padding: 28, maxWidth: 360, width: '90%', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}0d`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertCircle style={{ width: 20, height: 20, color }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.t1, textAlign: 'center', margin: '0 0 20px', lineHeight: 1.65, fontFamily: FONT }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="tcs2-btn" onClick={onCancel} style={{ flex: 1, padding: 10, borderRadius: 9, background: 'rgba(255,255,255,.04)', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 700 }}>Go Back</button>
          <button className="tcs2-btn" onClick={onConfirm} style={{ flex: 1, padding: 10, borderRadius: 9, background: `${color}12`, border: `1px solid ${color}28`, color, fontSize: 12, fontWeight: 700 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── NOTIFICATION TICKER ─────────────────────────────────────── */
function ScheduleTicker({ classesCount, checkInCount, avgFill, noShows, isToday }) {
  const msgs = useMemo(() => {
    const out = [];
    if (isToday) out.push(`${classesCount} session${classesCount !== 1 ? 's' : ''} scheduled for today`);
    if (checkInCount > 0) out.push(`${checkInCount} check-in${checkInCount !== 1 ? 's' : ''} recorded so far today`);
    if (avgFill >= 80) out.push(`Strong fill rate at ${avgFill}% — classes performing well`);
    else if (avgFill < 40 && classesCount > 0) out.push(`Fill rate at ${avgFill}% — consider promoting today's sessions`);
    if (noShows > 0) out.push(`${noShows} no-show${noShows !== 1 ? 's' : ''} today — follow up to re-engage`);
    out.push('Pre-class reminders sent 2hr before reduce no-shows by up to 40%');
    out.push('Consistent scheduling retains members 2.8× longer');
    return out.filter(Boolean);
  }, [classesCount, checkInCount, avgFill, noShows, isToday]);

  const idxRef = useRef(0);
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [trans, setTrans] = useState(false);

  useEffect(() => {
    if (msgs.length <= 1) return;
    const id = setInterval(() => {
      const prev = idxRef.current, next = (prev + 1) % msgs.length;
      idxRef.current = next; setPrevIdx(prev); setIdx(next); setTrans(true);
      setTimeout(() => { setPrevIdx(null); setTrans(false); }, 800);
    }, 10000);
    return () => clearInterval(id);
  }, [msgs.length]);

  return (
    <div style={{ width: '100%', height: 37, background: 'rgba(77,127,255,0.11)', borderRadius: 4, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center' }}>
      {trans && prevIdx !== null && (
        <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: '#93c5fd', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 14px', animation: 'tcs2SlideOut 0.8s cubic-bezier(0.4,0,0.2,1) forwards' }}>{msgs[prevIdx]}</span>
      )}
      <span key={idx} style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: '#93c5fd', fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 14px', animation: trans ? 'tcs2SlideInR 0.8s cubic-bezier(0.4,0,0.2,1) forwards' : 'none' }}>{msgs[idx]}</span>
    </div>
  );
}

/* ─── CHART TOOLTIP ──────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111c2a', border: `1px solid ${C.cyanB}`, borderRadius: 7, padding: '5px 10px', fontSize: 11.5, color: C.t1 }}>
      <div style={{ fontSize: 10, color: C.t3, marginBottom: 2 }}>{label}</div>
      <span style={{ color: C.cyan, fontWeight: 700 }}>{payload[0].value} check-ins</span>
    </div>
  );
}

/* ─── ACTIVITY DIAL ──────────────────────────────────────────── */
function ActivityDial({ pct }) {
  const R = 62, cx = 76, cy = 72, c = Math.max(0, Math.min(100, pct));
  const angle = Math.PI - (c / 100) * Math.PI;
  const x = cx + R * Math.cos(angle), y = cy - R * Math.sin(angle);
  const trackD = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  const fillD = c === 0 ? '' : c >= 100 ? trackD : `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  const dc = c < 30 ? C.red : c < 60 ? C.amber : C.green;
  const dl = c < 30 ? 'Low' : c < 60 ? 'Moderate' : c < 85 ? 'Good' : 'Excellent';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <svg width="152" height="90" viewBox="0 0 152 90" style={{ overflow: 'visible' }}>
        <path d={trackD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={dc} strokeWidth="10" strokeLinecap="round" strokeOpacity="0.85" />}
        {c > 0 && <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r="6" fill={dc} />}
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: '#fff', fontFamily: "'DM Sans',sans-serif" }}>{c}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 10, fontWeight: 700, fill: dc, fontFamily: "'DM Sans',sans-serif" }}>{dl}</text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 2 }}>
        <span style={{ fontSize: 9, color: C.t3, fontWeight: 600 }}>0%</span>
        <span style={{ fontSize: 9, color: C.t3, fontWeight: 600 }}>100%</span>
      </div>
    </div>
  );
}

/* ─── RIGHT SIDEBAR ──────────────────────────────────────────── */
function ScheduleSidebar({ classesWithData, checkIns, allMemberships, appointments, totalPresent, totalBooked, avgFill, totalNoShows, totalLateCancels, now, openModal }) {
  const chartData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const count = checkIns.filter(c => isSameDay(new Date(c.check_in_date), d)).length;
    return { label: i === 6 ? 'Today' : format(d, 'EEE'), v: count };
  }), [checkIns, now]);

  const thisWeekCI = checkIns.filter(c => (now - new Date(c.check_in_date)) < 7 * 864e5).length;
  const lastWeekCI = checkIns.filter(c => { const d = now - new Date(c.check_in_date); return d >= 7 * 864e5 && d < 14 * 864e5; }).length;
  const weekDelta = thisWeekCI - lastWeekCI;
  const weekTrend = weekDelta > 2 ? 'up' : weekDelta < -2 ? 'down' : 'flat';
  const fc = fillColor(avgFill);

  const fadingMembers = useMemo(() => allMemberships.map(m => {
    const rs = calcRS(m.user_id, checkIns, now);
    return rs.status !== 'safe' ? { ...m, rs } : null;
  }).filter(Boolean).length, [allMemberships, checkIns, now]);

  const attendancePct = totalBooked > 0 ? Math.min(100, Math.round((totalPresent / totalBooked) * 100)) : 0;

  const stats = [
    { label: 'Sessions',   val: classesWithData.length,  col: C.cyan   },
    { label: 'Checked In', val: totalPresent,             col: C.green  },
    { label: 'No-Shows',   val: totalNoShows,             col: totalNoShows > 0 ? C.red : C.t3 },
    { label: 'PT / 1:1',   val: appointments.length,      col: C.blue   },
  ];

  return (
    <div className="tcs2-sidebar" style={{ background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', fontFamily: FONT, alignSelf: 'flex-start', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Schedule Overview</div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: C.brd, borderBottom: `1px solid ${C.brd}` }}>
        {stats.map((s, i) => (
          <div key={i} style={{ padding: '12px 14px', background: C.sidebar }}>
            <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Fill Rate */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Avg Fill Rate</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: fc }}>{fillLabel(avgFill)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.05)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${avgFill}%`, background: `linear-gradient(90deg,${fc},${fc}88)`, borderRadius: 99, transition: 'width .6s' }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: fc, minWidth: 36, textAlign: 'right' }}>{avgFill}%</span>
        </div>
        {totalLateCancels > 0 && (
          <div style={{ marginTop: 8, fontSize: 10.5, color: C.amber, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle style={{ width: 9, height: 9 }} /> {totalLateCancels} late cancel{totalLateCancels > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* vs Last Week */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>vs Last Week</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {weekTrend === 'up' && <ArrowUpRight style={{ width: 16, height: 16, color: C.green }} />}
          {weekTrend === 'down' && <ArrowDownRight style={{ width: 16, height: 16, color: C.red }} />}
          {weekTrend === 'flat' && <Minus style={{ width: 16, height: 16, color: C.t3 }} />}
          <span style={{ fontSize: 28, fontWeight: 700, color: weekTrend === 'up' ? C.green : weekTrend === 'down' ? C.red : C.t3, lineHeight: 1, letterSpacing: '-0.04em' }}>
            {weekDelta > 0 ? '+' : ''}{weekDelta}
          </span>
          <span style={{ fontSize: 11, color: C.t3 }}>check-ins</span>
        </div>
      </div>

      {/* 7-Day Chart */}
      <div style={{ padding: '14px 4px 12px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 12px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Check-In Trend</span>
          <span style={{ fontSize: 10, color: C.t3 }}>7d</span>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={chartData} margin={{ top: 4, right: 22, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="tcs2CIG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: C.t3, fontSize: 8.5, fontFamily: FONT }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#tcs2CIG)" dot={false} activeDot={{ r: 3, fill: C.cyan, strokeWidth: 2, stroke: C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Dial */}
      <div style={{ padding: '14px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Attendance Rate</span>
          <span style={{ fontSize: 10, color: C.t3 }}>Today</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <ActivityDial pct={attendancePct} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: C.t3 }}>
          {totalPresent} of {totalBooked} bookings attended
        </div>
        {fadingMembers > 0 && (
          <div style={{ marginTop: 12, padding: '9px 12px', borderRadius: 9, background: C.amberD, border: `1px solid ${C.amberB}`, display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle style={{ width: 11, height: 11, color: C.amber, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>{fadingMembers} member{fadingMembers !== 1 ? 's' : ''} at risk of churning</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '0 12px 20px', borderTop: `1px solid ${C.brd}`, paddingTop: 14 }}>
        <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9 }}>Quick Actions</div>
        {[
          { icon: QrCode,   label: 'Scan Check-In',  color: C.green,  fn: () => openModal('qrScanner') },
          { icon: Plus,     label: 'Add Class',       color: C.cyan,   fn: () => openModal('classes')   },
          { icon: Bell,     label: 'Remind Members',  color: C.blue,   fn: () => openModal('post')      },
          { icon: Megaphone,label: 'Promote Session', color: C.violet, fn: () => openModal('post')      },
        ].map(({ icon: Ic, label, color, fn }, i) => (
          <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 9, width: '100%', background: 'rgba(255,255,255,.02)', border: `1px solid ${C.brd}`, textAlign: 'left', cursor: 'pointer', marginBottom: 5, fontFamily: FONT, transition: 'all .13s' }}
            onMouseEnter={e => { e.currentTarget.style.background = `${color}07`; e.currentTarget.style.borderColor = `${color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; e.currentTarget.style.borderColor = C.brd; }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}0d`, border: `1px solid ${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ic style={{ width: 11, height: 11, color }} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: C.t2 }}>{label}</span>
            <ArrowRight style={{ width: 10, height: 10, color: C.t3, marginLeft: 'auto' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── SESSION DETAIL PANEL ───────────────────────────────────── */
function SessionDetailPanel({ cls, allMemberships, checkIns, avatarMap, attendance, onToggle, onMarkAll, onClearAll, onSaveNote, onSaveAnnounce, notes, classAnnounce, selDateStr, now, openModal, onClose, onCancelClass, onReinstateClass }) {
  const [tab, setTab] = useState('roster');
  const [q, setQ] = useState('');
  const c = cls.typeCfg.color;
  const key = `${cls.id}-${selDateStr}`;
  const manualIds = attendance[key] || [];
  const checkedIds = cls.attended.map(ci => ci.user_id);
  const totalPresent = [...new Set([...manualIds, ...checkedIds])].length;
  const noShowList = cls.booked.filter(b => !checkedIds.includes(b.user_id) && !manualIds.includes(b.user_id));
  const roster = allMemberships.filter(m => !q || (m.user_name || '').toLowerCase().includes(q.toLowerCase()));
  const fc = fillColor(cls.fill);
  const TABS = [
    { id: 'roster', label: 'Roster', count: cls.booked.length || cls.attended.length },
    { id: 'checkin', label: 'Check-In', count: totalPresent },
    { id: 'waitlist', label: 'Waitlist', count: cls.waitlist.length },
    { id: 'notes', label: 'Notes', count: null },
  ];
  return (
    <div className="tcs2-si" onClick={e => e.stopPropagation()}
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, zIndex: 9000, background: C.sidebar, borderLeft: `1px solid ${C.brd2}`, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,.6)' }}>
      <div style={{ height: 3, background: cls.isCancelled ? C.red : c, flexShrink: 0 }} />
      {/* Header */}
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${c}12`, border: `1px solid ${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{cls.typeCfg.emoji}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.t1, letterSpacing: '-.03em' }}>{cls.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3, flexWrap: 'wrap' }}>
                {cls.scheduleStr && <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{cls.scheduleStr}</span>}
                {cls.duration_minutes && <span style={{ fontSize: 11, color: C.t3 }}>· {cls.duration_minutes}min</span>}
                {cls.room && <span style={{ fontSize: 11, color: C.t3, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 9, height: 9 }} />{cls.room}</span>}
              </div>
            </div>
          </div>
          <button className="tcs2-btn" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,.04)', border: `1px solid ${C.brd}`, color: C.t3 }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
        {/* Capacity */}
        <div style={{ padding: '12px 14px', borderRadius: 11, background: 'rgba(255,255,255,.025)', border: `1px solid ${C.brd}`, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AvatarCluster members={cls.booked} avatarMap={avatarMap || {}} max={5} size={22} />
              <span style={{ fontSize: 13, fontWeight: 700, color: fc }}>{cls.booked.length || cls.attended.length}<span style={{ color: C.t3, fontWeight: 400 }}> / {cls.capacity}</span></span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: fc }}>{cls.fill}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,.05)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fc},${fc}88)`, borderRadius: 99 }} />
          </div>
        </div>
        {/* Chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            { icon: Check, count: totalPresent, label: 'present', color: C.green, show: true },
            { icon: UserX, count: noShowList.length, label: 'no-show', color: C.red, show: noShowList.length > 0 },
            { icon: Clock, count: cls.waitlist.length, label: 'waiting', color: C.amber, show: cls.waitlist.length > 0 },
            { icon: AlertTriangle, count: cls.lateCancels.length, label: 'late cancel', color: C.amber, show: cls.lateCancels.length > 0 },
          ].filter(x => x.show).map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: s.color, background: `${s.color}0c`, border: `1px solid ${s.color}1c`, borderRadius: 7, padding: '4px 9px' }}>
              <s.icon style={{ width: 9, height: 9 }} /><span style={{ fontWeight: 700 }}>{s.count}</span><span style={{ color: `${s.color}99`, fontWeight: 500, fontSize: 10 }}>{s.label}</span>
            </span>
          ))}
          {cls.isCancelled && <Pill color={C.red} dot small>Cancelled</Pill>}
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 14px', borderBottom: `1px solid ${C.brd}`, flexShrink: 0, gap: 2 }}>
        {TABS.map(t => (
          <button key={t.id} className="tcs2-btn" onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 4px', background: 'none', borderBottom: `2px solid ${tab === t.id ? c : 'transparent'}`, color: tab === t.id ? c : C.t3, fontSize: 11, fontWeight: tab === t.id ? 700 : 500, marginBottom: -1, gap: 4 }}>
            {t.label}
            {t.count !== null && t.count > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: tab === t.id ? c : C.t3, background: tab === t.id ? `${c}15` : 'rgba(255,255,255,.05)', borderRadius: 99, padding: '1px 5px' }}>{t.count}</span>}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="tcs2-scr" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {/* ROSTER */}
        {tab === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {noShowList.length > 0 && (
              <div style={{ padding: '13px 15px', borderRadius: 12, background: C.redD, border: `1px solid ${C.redB}`, borderLeft: `3px solid ${C.red}`, marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.red, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <UserX style={{ width: 11, height: 11 }} /> {noShowList.length} No-Show{noShowList.length !== 1 ? 's' : ''}
                </div>
                {noShowList.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < noShowList.length - 1 ? 8 : 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: `${C.red}15`, border: `1px solid ${C.red}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.red, flexShrink: 0 }}>
                      {(m.user_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, color: C.t1, fontWeight: 600, flex: 1 }}>{m.user_name}</span>
                    <IBtn icon={MessageCircle} label="Msg" color={C.cyan} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                    <IBtn icon={Calendar} label="Rebook" color={C.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                  </div>
                ))}
              </div>
            )}
            {(cls.booked.length > 0 ? cls.booked : cls.regulars || []).map((m, j) => {
              const isIn = checkedIds.includes(m.user_id) || manualIds.includes(m.user_id);
              const isCxl = (cls.late_cancels || []).some(lc => lc.user_id === m.user_id);
              return (
                <div key={m.user_id || j} style={{ padding: '12px 14px', borderRadius: 12, background: isIn ? C.greenD : isCxl ? C.redD : 'rgba(255,255,255,.02)', border: `1px solid ${isIn ? C.greenB : isCxl ? C.redB : C.brd}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 11, background: `${isIn ? C.green : C.cyan}12`, border: `1px solid ${isIn ? C.green : C.cyan}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: isIn ? C.green : C.cyan, flexShrink: 0 }}>
                      {(m.user_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{m.user_name || 'Member'}</div>
                    </div>
                    <Pill color={isIn ? C.green : isCxl ? C.red : C.t2} small>{isIn ? '✓ Present' : isCxl ? 'Cancelled' : 'Booked'}</Pill>
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                    <IBtn icon={MessageCircle} label="Message" color={C.cyan} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                    <IBtn icon={Calendar} label="Rebook" color={C.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                  </div>
                </div>
              );
            })}
            {cls.booked.length === 0 && (!cls.regulars || cls.regulars.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: C.t3, fontSize: 13 }}>
                <Users style={{ width: 22, height: 22, margin: '0 auto 10px', opacity: .3 }} />No bookings yet
              </div>
            )}
          </div>
        )}
        {/* CHECK-IN */}
        {tab === 'checkin' && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.t3 }} />
                <input className="tcs2-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search members…" style={{ paddingLeft: 32, fontSize: 12 }} />
              </div>
              <IBtn icon={CheckCircle} label="All" color={C.green} onClick={() => onMarkAll(key)} size="xs" />
              <IBtn icon={X} label="Clear" color={C.red} onClick={() => onClearAll(key)} size="xs" />
            </div>
            <div style={{ borderRadius: 12, border: `1px solid ${C.brd}`, overflow: 'hidden' }}>
              {roster.map((m, mi) => {
                const isManual = manualIds.includes(m.user_id);
                const isQR = checkedIds.includes(m.user_id);
                const present = isManual || isQR;
                return (
                  <div key={m.user_id || mi} className="tcs2-row" onClick={() => !isQR && onToggle(key, m.user_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderBottom: mi < roster.length - 1 ? `1px solid ${C.brd}` : 'none', cursor: isQR ? 'default' : 'pointer', background: present ? C.greenD : 'transparent' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `1.5px solid ${present ? C.green : 'rgba(255,255,255,.1)'}`, background: present ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {present && <Check style={{ width: 10, height: 10, color: '#fff' }} />}
                    </div>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: present ? C.t1 : C.t2 }}>{m.user_name || 'Member'}</span>
                    {isQR && <Pill color={C.green} small>QR ✓</Pill>}
                    {isManual && !isQR && <Pill color={C.violet} small>Manual</Pill>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* WAITLIST */}
        {tab === 'waitlist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {cls.waitlist.length === 0 ? (
              <div style={{ padding: '12px 14px', borderRadius: 11, background: C.greenD, border: `1px solid ${C.greenB}`, display: 'flex', alignItems: 'center', gap: 7 }}>
                <CheckCircle style={{ width: 12, height: 12, color: C.green }} />
                <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>No one on the waitlist</span>
              </div>
            ) : cls.waitlist.map((w, j) => (
              <div key={w.user_id || j} style={{ padding: '13px 15px', borderRadius: 12, background: 'rgba(255,255,255,.02)', border: `1px solid ${C.brd}`, borderLeft: `3px solid ${C.amber}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: C.amberD, border: `1px solid ${C.amberB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.amber }}>{j + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{w.user_name || 'Member'}</div>
                    {w.wait_since && <div style={{ fontSize: 10, color: C.t3 }}>Since {format(new Date(w.wait_since), 'MMM d, h:mm a')}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <IBtn icon={ArrowUpRight} label="Promote" color={C.green} onClick={() => openModal('promoteWaitlist', w)} size="xs" />
                  <IBtn icon={Bell} label="Notify" color={C.cyan} onClick={() => openModal('post', { memberId: w.user_id })} size="xs" />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* NOTES */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Megaphone style={{ width: 10, height: 10, color: C.cyan }} /> Class Announcement
              </div>
              <textarea className="tcs2-input" value={classAnnounce[key] || ''} onChange={e => onSaveAnnounce(key, e.target.value)} placeholder="Visible to all members before this class…" style={{ minHeight: 70, resize: 'vertical', lineHeight: 1.65 }} />
              <button className="tcs2-btn" onClick={() => openModal('post', { classId: cls.id, announcement: classAnnounce[key] })} style={{ marginTop: 7, padding: '8px 14px', borderRadius: 9, background: C.cyan, color: '#fff', fontSize: 11, fontWeight: 700, gap: 5, boxShadow: `0 2px 8px ${C.cyan}30` }}>
                <Send style={{ width: 10, height: 10 }} /> Push to Members
              </button>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Pencil style={{ width: 10, height: 10, color: C.violet }} /> Coach Notes (Private)
              </div>
              <textarea className="tcs2-input" value={notes[key] || ''} onChange={e => onSaveNote(key, e.target.value)} placeholder="Cues, modifications, energy notes, what worked…" style={{ minHeight: 70, resize: 'vertical', lineHeight: 1.65 }} />
            </div>
          </div>
        )}
      </div>
      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.brd}`, display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        <IBtn icon={QrCode} label="Scan QR" color={C.green} onClick={() => openModal('qrScanner', cls)} />
        <IBtn icon={Bell} label="Remind All" color={C.cyan} onClick={() => openModal('post', { classId: cls.id })} />
        <IBtn icon={Pencil} label="Edit" color={C.t2} onClick={() => openModal('editClass', cls)} />
        {cls.isCancelled
          ? <IBtn icon={RefreshCw} label="Reinstate" color={C.green} onClick={() => { onReinstateClass(cls); onClose(); }} />
          : <IBtn icon={XCircle} label="Cancel Class" color={C.red} onClick={() => openModal('confirmCancel', cls)} />
        }
      </div>
    </div>
  );
}

/* ─── SESSION CARD (Content Hub card style) ──────────────────── */
function SessionCard({ cls, onOpen, isSelected, openModal, avatarMap = {} }) {
  const tc = cls.typeCfg, c = tc.color;
  const booked = cls.booked.length || cls.attended.length;
  const fc = fillColor(cls.fill);
  const noShows = Math.max(0, cls.booked.length - cls.attended.length);
  return (
    <div className="tcs2-card" onClick={onOpen}
      style={{ background: C.card, border: `1px solid ${isSelected ? C.cyanB : cls.isCancelled ? C.redB : C.brd}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', opacity: cls.isCancelled ? .65 : 1, boxShadow: isSelected ? `0 0 0 1px ${C.cyanD}` : 'none' }}>
      {/* Top stripe */}
      <div style={{ height: 3, background: cls.isCancelled ? C.red : c }} />
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: `${c}12`, border: `1px solid ${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              {tc.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: cls.isCancelled ? C.t3 : C.t1, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}15`, border: `1px solid ${c}30`, borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{tc.label}</span>
                {cls.isCancelled && <Pill color={C.red} dot small>Cancelled</Pill>}
                {cls.scheduleStr && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 6, background: `${c}0a`, border: `1px solid ${c}15` }}>
                    <Clock style={{ width: 9, height: 9, color: c }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: c }}>{cls.scheduleStr}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
            <button onClick={e => { e.stopPropagation(); onOpen(); }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.greenD, border: `1px solid ${C.greenB}`, color: C.green, cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.green; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.greenD; e.currentTarget.style.color = C.green; }}>
              <QrCode style={{ width: 11, height: 11 }} />
            </button>
            <button onClick={e => { e.stopPropagation(); openModal('post', { classId: cls.id }); }} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cyan; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.cyanD; e.currentTarget.style.color = C.cyan; }}>
              <Megaphone style={{ width: 11, height: 11 }} />
            </button>
          </div>
        </div>
        {cls.room && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.t3 }}>
            <MapPin style={{ width: 9, height: 9 }} />{cls.room}
            {cls.duration_minutes && <span>· {cls.duration_minutes} min</span>}
          </div>
        )}
      </div>
      {/* Stats grid */}
      {!cls.isCancelled && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: `1px solid ${C.brd}` }}>
          {[
            { label: 'Booked', val: `${booked}/${cls.capacity}`, col: fc },
            { label: 'Fill Rate', val: `${cls.fill}%`, col: fc },
            { label: 'No-Shows', val: noShows, col: noShows > 0 ? C.red : C.t3 },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRight: i < 2 ? `1px solid ${C.brd}` : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9.5, color: C.t3, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {/* Fill bar + avatars */}
      {!cls.isCancelled && (
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <AvatarCluster members={cls.booked} avatarMap={avatarMap} max={5} size={20} />
            <Pill color={fc} dot small>{fillLabel(cls.fill)}</Pill>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,.05)', overflow: 'hidden' }}>
            <div className="tcs2-bar" style={{ height: '100%', borderRadius: 99, '--w': `${cls.fill}%`, width: `${cls.fill}%`, background: `linear-gradient(90deg,${fc},${fc}88)`, boxShadow: `0 0 6px ${fc}40` }} />
          </div>
        </div>
      )}
      {/* Footer */}
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {cls.waitlist.length > 0 && (
            <span style={{ fontSize: 10, color: C.amber, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock style={{ width: 9, height: 9 }} />{cls.waitlist.length} waiting
            </span>
          )}
          {cls.lateCancels.length > 0 && (
            <span style={{ fontSize: 10, color: C.amber, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertTriangle style={{ width: 9, height: 9 }} />{cls.lateCancels.length} late cancel
            </span>
          )}
          {cls.revenue > 0 && (
            <span style={{ fontSize: 10, color: C.green, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <DollarSign style={{ width: 9, height: 9 }} />£{cls.revenue}
            </span>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); onOpen(); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
          View Roster <ArrowRight style={{ width: 10, height: 10 }} />
        </button>
      </div>
    </div>
  );
}

/* ─── WEEK CELL ──────────────────────────────────────────────── */
function WeekCell({ date, isSelected, isToday, classCount, ciCount, onClick }) {
  return (
    <button className="tcs2-btn" onClick={onClick} style={{ flex: 1, padding: '10px 4px 8px', borderRadius: 10, textAlign: 'center', background: isSelected ? C.cyanD : isToday ? 'rgba(77,127,255,.04)' : 'transparent', border: isSelected ? `1px solid ${C.cyanB}` : isToday ? '1px solid rgba(77,127,255,.14)' : `1px solid ${C.brd}`, position: 'relative' }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(77,127,255,.04)' : 'transparent'; }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: isSelected ? C.cyan : C.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{format(date, 'EEE')}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: isSelected ? C.cyan : isToday ? C.t1 : C.t2, lineHeight: 1, marginBottom: 6, letterSpacing: '-.03em' }}>{format(date, 'd')}</div>
      {classCount > 0 && <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 3 }}>
        {Array.from({ length: Math.min(classCount, 3) }, (_, j) => <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? C.cyan : `${C.cyan}50` }} />)}
      </div>}
      {ciCount > 0 && <div style={{ fontSize: 9, fontWeight: 600, color: isSelected ? C.cyan : C.t3, background: isSelected ? C.cyanD : 'rgba(255,255,255,.04)', borderRadius: 4, padding: '1px 4px', display: 'inline-block' }}>{ciCount}</div>}
      {isToday && !isSelected && <div style={{ position: 'absolute', top: 7, right: 8, width: 5, height: 5, borderRadius: '50%', background: C.green, boxShadow: `0 0 5px ${C.green}80` }} />}
    </button>
  );
}

/* ─── MONTH CELL ─────────────────────────────────────────────── */
function MonthCell({ date, isCurrentMonth, isSelected, isToday, classCount, ciCount, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '7px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', background: isSelected ? C.cyanD : isToday ? 'rgba(77,127,255,.05)' : 'transparent', border: isSelected ? `1px solid ${C.cyanB}` : isToday ? '1px solid rgba(77,127,255,.14)' : '1px solid transparent', opacity: isCurrentMonth ? 1 : .2 }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(77,127,255,.05)' : 'transparent'; }}>
      <div style={{ fontSize: 12, fontWeight: isToday || isSelected ? 800 : 500, color: isSelected ? C.cyan : isToday ? C.t1 : C.t2, lineHeight: 1, marginBottom: 3 }}>{format(date, 'd')}</div>
      {classCount > 0 && <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {Array.from({ length: Math.min(classCount, 3) }, (_, j) => <div key={j} style={{ width: 3, height: 3, borderRadius: '50%', background: isSelected ? C.cyan : `${C.cyan}50` }} />)}
      </div>}
    </div>
  );
}

/* ─── INSIGHTS TAB ───────────────────────────────────────────── */
function InsightsTab({ classesWithData, checkIns, now, openModal, allMemberships }) {
  const data30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return { label: format(d, 'MMM d'), v: checkIns.filter(c => isSameDay(new Date(c.check_in_date), d)).length };
  }), [checkIns, now]);

  const under = classesWithData.filter(c => c.fill < 40 && !c.isCancelled);
  const full = classesWithData.filter(c => c.fill >= 90 && !c.isCancelled);
  const waitlisted = classesWithData.filter(c => c.waitlist.length > 0);
  const totalWL = waitlisted.reduce((s, c) => s + c.waitlist.length, 0);

  const fading = useMemo(() => allMemberships.map(m => {
    const rs = calcRS(m.user_id, checkIns, now);
    return rs.status !== 'safe' ? { ...m, rs } : null;
  }).filter(Boolean).sort((a, b) => a.rs.score - b.rs.score).slice(0, 5), [allMemberships, checkIns, now]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 0' }}>
      {/* 30-Day Activity */}
      <div className="tcs2-card" style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, padding: '16px 18px', gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <Activity style={{ width: 13, height: 13, color: C.violet }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>30-Day Check-In Activity</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 52, marginBottom: 7 }}>
          {data30.map((d, i) => {
            const maxV = Math.max(...data30.map(x => x.v), 1);
            const h = d.v === 0 ? 2 : Math.max(4, (d.v / maxV) * 48);
            return <div key={i} title={`${d.label}: ${d.v}`} style={{ flex: 1, height: h, borderRadius: '3px 3px 1px 1px', background: i >= 27 ? C.cyan : `${C.cyan}25`, transition: 'height .4s' }} />;
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 9, color: C.t3 }}>{format(subDays(now, 29), 'MMM d')}</span>
          <span style={{ fontSize: 9, color: C.cyan, fontWeight: 700 }}>Today</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
          {[
            { label: 'Total', value: data30.reduce((s, d) => s + d.v, 0), color: C.cyan },
            { label: 'Peak', value: Math.max(...data30.map(d => d.v)), color: C.violet },
            { label: 'Avg/Day', value: (data30.reduce((s, d) => s + d.v, 0) / 30).toFixed(1), color: C.green },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '9px 4px', borderRadius: 9, background: `${s.color}06`, border: `1px solid ${s.color}12` }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 3 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: C.t3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimisation */}
      <div className="tcs2-card" style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Target style={{ width: 13, height: 13, color: C.cyan }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Optimisation Tips</span>
        </div>
        <div style={{ padding: '8px 12px 12px' }}>
          {[
            under.length > 0 && { icon: AlertTriangle, color: C.red,    text: `${under.length} session${under.length > 1 ? 's' : ''} underbooked — consider promoting` },
            full.length > 0  && { icon: TrendingUp,   color: C.blue,   text: `${full.length} session${full.length > 1 ? 's' : ''} at capacity — add a second slot` },
            totalWL > 0      && { icon: Users,        color: C.violet,  text: `${totalWL} member${totalWL > 1 ? 's' : ''} on waitlists — demand exceeds supply` },
            { icon: Lightbulb, color: C.amber, text: 'Consistent schedules retain 2.8× more members long-term' },
            { icon: Bell,      color: C.cyan,  text: 'Pre-class reminders 2hr before reduce no-shows by 40%' },
          ].filter(Boolean).slice(0, 5).map((s, i) => {
            const Ic = s.icon;
            return (
              <div key={i} className="tcs2-row" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 8px', borderRadius: 9 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `${s.color}0d`, border: `1px solid ${s.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ic style={{ width: 10, height: 10, color: s.color }} />
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: s.color, marginTop: 1, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 11, color: C.t2, lineHeight: 1.6 }}>{s.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fading Members */}
      <div className="tcs2-card" style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Zap style={{ width: 13, height: 13, color: C.amber }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Members to Re-engage</span>
          {fading.length > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: C.red, borderRadius: 99, padding: '1px 6px' }}>{fading.length}</span>}
        </div>
        <div className="tcs2-scr" style={{ padding: '10px 12px 12px', maxHeight: 260, overflowY: 'auto' }}>
          {fading.length === 0 ? (
            <div style={{ padding: '11px 13px', borderRadius: 10, background: C.greenD, border: `1px solid ${C.greenB}`, display: 'flex', alignItems: 'center', gap: 7 }}>
              <CheckCircle style={{ width: 12, height: 12, color: C.green }} />
              <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>All members healthy</span>
            </div>
          ) : fading.map((m, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.015)', border: `1px solid ${C.brd}`, borderLeft: `3px solid ${m.rs.color}`, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{m.user_name || 'Client'}</div>
                  <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{m.rs.daysAgo > 21 ? `No visit in ${m.rs.daysAgo} days` : 'Low engagement'}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.rs.color, lineHeight: 1 }}>{m.rs.score}</div>
                  <div style={{ fontSize: 8, color: C.t3, textTransform: 'uppercase', letterSpacing: '.05em' }}>score</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <IBtn icon={MessageCircle} label="Message" color={C.cyan} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                <IBtn icon={Calendar} label="Book" color={C.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function EmptyState({ openModal }) {
  return (
    <div className="tcs2-fu" style={{ padding: '56px 36px', textAlign: 'center', borderRadius: 14, background: C.card, border: `1px solid ${C.brd}` }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px', background: C.cyanD, border: `1px solid ${C.cyanB}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Calendar style={{ width: 24, height: 24, color: C.cyan }} />
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: '0 0 8px', letterSpacing: '-.04em', fontFamily: FONT }}>Build Your Schedule</h3>
      <p style={{ fontSize: 13, color: C.t3, margin: '0 auto 32px', maxWidth: 420, lineHeight: 1.7, fontFamily: FONT }}>
        Create your first class and start tracking attendance, fill rates, and member engagement — all in one place.
      </p>
      <button className="tcs2-btn" onClick={() => openModal('classes')} style={{ padding: '12px 26px', borderRadius: 11, gap: 7, fontSize: 13, fontWeight: 700, boxShadow: `0 4px 16px ${C.cyan}30`, ...GRAD }}>
        <Plus style={{ width: 13, height: 13 }} /> Create Your First Class
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
const TABS = ['Schedule', 'Attendance', 'Insights'];

export default function TabCoachSchedule({
  myClasses = [], checkIns = [], events = [], allMemberships = [],
  avatarMap = {}, openModal, now,
}) {
  const [activeTab, setActiveTab] = useState('Schedule');
  const [calView, setCalView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(now);
  const [monthDate, setMonthDate] = useState(now);
  const [detailCls, setDetailCls] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [confirmCancel, setConfirmCancel] = useState(null);

  const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) || fb); } catch { return JSON.parse(fb); } };
  const [attendance, setAttendance] = useState(() => load('coachAttendance', '{}'));
  const [notes, setNotes] = useState(() => load('coachNotes', '{}'));
  const [cancelledClasses, setCancelledClasses] = useState(() => load('coachCancelled', '[]'));
  const [classAnnounce, setClassAnnounce] = useState(() => load('coachAnnounce', '{}'));

  const persist = (k, d) => { try { localStorage.setItem(k, JSON.stringify(d)); } catch {} };
  const saveNote = (k, v) => { const u = { ...notes, [k]: v }; setNotes(u); persist('coachNotes', u); };
  const saveAnnounce = (k, v) => { const u = { ...classAnnounce, [k]: v }; setClassAnnounce(u); persist('coachAnnounce', u); };
  const toggleAttendance = (rk, uid) => { const s = attendance[rk] || []; const u = { ...attendance, [rk]: s.includes(uid) ? s.filter(id => id !== uid) : [...s, uid] }; setAttendance(u); persist('coachAttendance', u); };
  const markAllPresent = rk => { const u = { ...attendance, [rk]: allMemberships.map(m => m.user_id) }; setAttendance(u); persist('coachAttendance', u); };
  const clearAttendance = rk => { const u = { ...attendance, [rk]: [] }; setAttendance(u); persist('coachAttendance', u); };
  const cancelClass = (cls, ds) => { const k = `${cls.id}-${ds}`; const u = [...cancelledClasses, k]; setCancelledClasses(u); persist('coachCancelled', u); setConfirmCancel(null); setDetailCls(null); };
  const reinstateClass = cls => { const k = `${cls.id}-${selDateStr}`; const u = cancelledClasses.filter(x => x !== k); setCancelledClasses(u); persist('coachCancelled', u); };

  const selDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = isSameDay(selectedDate, now);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const dayCIs = d => checkIns.filter(c => isSameDay(new Date(c.check_in_date), d));
  const selCIs = dayCIs(selectedDate);
  const weekCICounts = useMemo(() => week.map(d => dayCIs(d).length), [week, checkIns]);

  const navigate = dir => {
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
      const fill = booked.length > 0 ? Math.min(100, Math.round((booked.length / capacity) * 100)) : Math.min(100, Math.round((attended.length / capacity) * 100));
      const freq = {};
      checkIns.forEach(ci => { freq[ci.user_id] = (freq[ci.user_id] || 0) + 1; });
      const regulars = allMemberships.filter(m => (freq[m.user_id] || 0) >= 2);
      return { ...c, attended, capacity, booked, waitlist, regulars, fill, isCancelled, typeCfg, revenue: 0, lateCancels, scheduleStr: _sched };
    });
  }, [groupClasses, selCIs, checkIns, allMemberships, cancelledClasses, selDateStr, typeFilter]);

  const classTypes = useMemo(() => {
    const types = new Set(groupClasses.map(c => {
      const n = (c.name || c.class_type || c.type || '').toLowerCase();
      for (const k of Object.keys(CLASS_CFG)) { if (n.includes(k) && k !== 'default') return k; }
      return null;
    }).filter(Boolean));
    return [...types];
  }, [groupClasses]);

  const totalBooked = classesWithData.reduce((s, c) => s + (c.booked.length || c.attended.length), 0);
  const totalPresent = classesWithData.reduce((s, c) => { const ids = [...new Set([...c.attended.map(ci => ci.user_id), ...(attendance[`${c.id}-${selDateStr}`] || [])])]; return s + ids.length; }, 0);
  const totalNoShows = classesWithData.reduce((s, c) => s + Math.max(0, c.booked.length - c.attended.length), 0);
  const avgFill = classesWithData.length > 0 ? Math.round(classesWithData.reduce((s, c) => s + c.fill, 0) / classesWithData.length) : 0;
  const totalLateCancels = classesWithData.reduce((s, c) => s + c.lateCancels.length, 0);
  const hasClasses = groupClasses.length > 0;

  useEffect(() => {
    if (detailCls) { const updated = classesWithData.find(c => c.id === detailCls.id); if (updated) setDetailCls(updated); }
  }, [classesWithData]);

  return (
    <div className="tcs2" style={{ display: 'flex', flex: 1, minHeight: 0, background: C.bg, color: C.t1, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: 'antialiased' }}>

      {/* Confirm dialog */}
      {confirmCancel && (
        <ConfirmDialog
          message={`Cancel "${confirmCancel.name}" on ${format(selectedDate, 'EEEE, MMM d')}?\nAll booked members must be notified manually.`}
          onConfirm={() => cancelClass(confirmCancel, selDateStr)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {/* Detail panel */}
      {detailCls && (
        <>
          <div className="tcs2-fi" style={{ position: 'fixed', inset: 0, zIndex: 8999, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }} onClick={() => setDetailCls(null)} />
          <SessionDetailPanel
            cls={detailCls} allMemberships={allMemberships} checkIns={checkIns} avatarMap={avatarMap}
            attendance={attendance} onToggle={toggleAttendance} onMarkAll={markAllPresent} onClearAll={clearAttendance}
            onSaveNote={saveNote} onSaveAnnounce={saveAnnounce} notes={notes} classAnnounce={classAnnounce}
            selDateStr={selDateStr} now={now}
            openModal={(type, data) => { if (type === 'confirmCancel') { setConfirmCancel(data); return; } openModal(type, data); }}
            onClose={() => setDetailCls(null)} onCancelClass={cls => setConfirmCancel(cls)} onReinstateClass={reinstateClass}
          />
        </>
      )}

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>

        {/* Header */}
        <div style={{ padding: '4px 16px 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.2, flexShrink: 0 }}>
            Schedule <span style={{ color: C.cyan }}>/ Performance</span>
          </h1>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 'clamp(300px,52%,780px)', pointerEvents: 'none' }}>
            <div style={{ pointerEvents: 'auto' }}>
              <ScheduleTicker classesCount={classesWithData.length} checkInCount={selCIs.length} avgFill={avgFill} noShows={totalNoShows} isToday={isToday} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <button onClick={() => openModal('qrScanner')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, background: C.greenD, border: `1px solid ${C.greenB}`, color: C.green }}>
              <QrCode style={{ width: 12, height: 12 }} /> Check-In
            </button>
            <button onClick={() => openModal('classes')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 18px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, ...GRAD }}>
              <Plus style={{ width: 12, height: 12 }} /> Add Class
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: `1px solid ${C.brd}`, marginTop: 0, padding: '0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', fontSize: 12.5, background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab ? C.cyan : 'transparent'}`, color: activeTab === tab ? C.t1 : C.t2, fontWeight: activeTab === tab ? 700 : 400, cursor: 'pointer', marginBottom: -1, fontFamily: FONT, whiteSpace: 'nowrap', minHeight: 44 }}>
                {tab === 'Schedule' && <Calendar style={{ width: 13, height: 13, flexShrink: 0 }} />}
                {tab === 'Attendance' && <UserCheck style={{ width: 13, height: 13, flexShrink: 0 }} />}
                {tab === 'Insights' && <BarChart2 style={{ width: 13, height: 13, flexShrink: 0 }} />}
                {tab}
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.t3, marginLeft: 'auto', padding: '0 8px' }}>
              <span style={{ color: C.cyan, fontWeight: 700 }}>{classesWithData.length}</span> sessions
              <span>·</span>
              <span style={{ color: C.green, fontWeight: 700 }}>{selCIs.length}</span> check-ins
              <span>·</span>
              <span style={{ color: isToday ? C.green : C.t3, fontWeight: 600 }}>{format(selectedDate, 'EEE, MMM d')}</span>
              {isToday && <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: C.greenD, border: `1px solid ${C.greenB}` }}>
                <span className="tcs2-live" style={{ width: 5, height: 5, borderRadius: '50%', background: C.green, display: 'inline-block' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: C.green, letterSpacing: '.04em' }}>LIVE</span>
              </div>}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '0 16px 32px 4px' }}>
          {!hasClasses ? (
            <div style={{ padding: '24px 0' }}><EmptyState openModal={openModal} /></div>
          ) : (
            <>
              {/* SCHEDULE TAB */}
              {activeTab === 'Schedule' && (
                <>
                  {/* Calendar */}
                  <div className="tcs2-fu tcs2-card" style={{ borderRadius: 14, background: C.card, border: `1px solid ${C.brd}`, padding: '18px 20px', margin: '16px 0 14px', animationDelay: '.04s' }}>
                    {/* Nav */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,.025)', border: `1px solid ${C.brd}`, borderRadius: 10 }}>
                        {[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }].map(v => (
                          <button key={v.id} className="tcs2-btn" onClick={() => setCalView(v.id)} style={{ padding: '5px 14px', borderRadius: 8, fontSize: 11, border: `1px solid ${calView === v.id ? C.cyanB : 'transparent'}`, background: calView === v.id ? C.cyanD : 'transparent', color: calView === v.id ? C.cyan : C.t3, fontWeight: calView === v.id ? 700 : 500 }}>{v.label}</button>
                        ))}
                      </div>
                      <button className="tcs2-btn" onClick={() => navigate(-1)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.03)', border: `1px solid ${C.brd}`, color: C.t3 }}>
                        <ChevronLeft style={{ width: 13, height: 13 }} />
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.t1, flex: 1, letterSpacing: '-.03em' }}>
                        {calView === 'month' ? format(monthDate, 'MMMM yyyy') : calView === 'week' ? `${format(week[0], 'MMM d')} – ${format(week[6], 'MMM d, yyyy')}` : format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                      <button className="tcs2-btn" onClick={() => navigate(1)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.03)', border: `1px solid ${C.brd}`, color: C.t3 }}>
                        <ChevronRight style={{ width: 13, height: 13 }} />
                      </button>
                      <button className="tcs2-btn" onClick={() => { setSelectedDate(now); setMonthDate(now); }} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan }}>Today</button>
                    </div>

                    {/* Week strip */}
                    {(calView === 'week' || calView === 'day') && (
                      <div style={{ display: 'flex', gap: 5 }}>
                        {week.map((d, i) => (
                          <WeekCell key={i} date={d} isSelected={isSameDay(d, selectedDate)} isToday={isSameDay(d, now)}
                            classCount={groupClasses.length} ciCount={weekCICounts[i]}
                            onClick={() => { setSelectedDate(d); setCalView('day'); setDetailCls(null); }} />
                        ))}
                      </div>
                    )}

                    {/* Month grid */}
                    {calView === 'month' && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 5 }}>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.07em', padding: '4px 0' }}>{d}</div>
                          ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                          {monthDays.map((d, i) => (
                            <MonthCell key={i} date={d} isCurrentMonth={isSameMonth(d, monthDate)} isSelected={isSameDay(d, selectedDate)} isToday={isSameDay(d, now)}
                              classCount={groupClasses.length} ciCount={dayCIs(d).length}
                              onClick={() => { setSelectedDate(d); setCalView('day'); setDetailCls(null); }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sessions header + type filters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <div style={{ width: 3, height: 16, borderRadius: 99, background: `linear-gradient(180deg,${C.cyan},${C.violet})` }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: C.t1, letterSpacing: '-.03em' }}>
                        {isToday ? "Today's Sessions" : `${format(selectedDate, 'EEE, MMM d')} Sessions`}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan, background: C.cyanD, border: `1px solid ${C.cyanB}`, borderRadius: 6, padding: '2px 7px' }}>{classesWithData.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {['all', ...classTypes].map(type => {
                        const cfg = type === 'all' ? { color: C.cyan, label: 'All', emoji: '📋' } : CLASS_CFG[type] || CLASS_CFG.default;
                        const active = typeFilter === type;
                        return (
                          <button key={type} className="tcs2-btn" onClick={() => setTypeFilter(type)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 99, fontSize: 11, border: `1px solid ${active ? `${cfg.color}28` : C.brd}`, background: active ? `${cfg.color}0d` : 'transparent', color: active ? cfg.color : C.t3, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 12 }}>{cfg.emoji}</span>{cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Session cards — Content Hub card grid style */}
                  {classesWithData.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', borderRadius: 14, background: C.card, border: `1px solid ${C.brd}`, marginBottom: 16 }}>
                      <Calendar style={{ width: 20, height: 20, color: C.t3, margin: '0 auto 10px', opacity: .4 }} />
                      <p style={{ fontSize: 14, color: C.t2, fontWeight: 700, margin: '0 0 5px' }}>No sessions on this day</p>
                      <p style={{ fontSize: 12, color: C.t3, margin: '0 0 18px' }}>{typeFilter !== 'all' ? 'Try clearing the type filter' : 'Select a different day or add a class'}</p>
                      <button className="tcs2-btn" onClick={() => openModal('classes')} style={{ fontSize: 12, fontWeight: 700, color: C.cyan, background: C.cyanD, border: `1px solid ${C.cyanB}`, borderRadius: 9, padding: '8px 18px', gap: 5 }}>
                        <Plus style={{ width: 11, height: 11 }} /> Add Class
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12, marginBottom: 20 }}>
                      {classesWithData.map((cls, idx) => (
                        <div key={cls.id || idx} className="tcs2-fu" style={{ animationDelay: `${Math.min(idx * .06, .4)}s` }}>
                          <SessionCard cls={cls} onOpen={() => setDetailCls(p => p?.id === cls.id ? null : cls)} isSelected={detailCls?.id === cls.id} openModal={openModal} avatarMap={avatarMap} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PT / Appointments */}
                  {appointments.length > 0 && (
                    <div className="tcs2-fu" style={{ animationDelay: '.3s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                        <div style={{ width: 3, height: 16, borderRadius: 99, background: `linear-gradient(180deg,${C.blue},${C.cyan})` }} />
                        <span style={{ fontSize: 14, fontWeight: 800, color: C.t1, flex: 1, letterSpacing: '-.03em' }}>PT / 1:1 Appointments</span>
                        <button className="tcs2-btn" onClick={() => openModal('bookAppointment')} style={{ fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueD, border: `1px solid ${C.blueB}`, borderRadius: 8, padding: '5px 12px', gap: 4 }}>
                          <Plus style={{ width: 10, height: 10 }} /> Book
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
                        {appointments.map((apt, i) => {
                          const m = allMemberships.find(x => x.user_id === apt.client_id || x.user_id === apt.user_id);
                          const name = apt.client_name || m?.user_name || 'Client';
                          const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                          return (
                            <div key={apt.id || i} style={{ padding: '14px 16px', borderRadius: 12, background: C.card, border: `1px solid ${C.brd}`, borderLeft: `3px solid ${C.blue}`, display: 'flex', alignItems: 'center', gap: 11 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 12, background: C.blueD, border: `1px solid ${C.blueB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: C.blue, flexShrink: 0 }}>{initials}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                                <div style={{ fontSize: 11, color: C.blue, marginTop: 3, fontWeight: 600 }}>{apt.schedule || apt.time || 'TBD'}</div>
                              </div>
                              <IBtn icon={QrCode} label="Check In" color={C.green} onClick={() => openModal('qrScanner')} size="xs" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ATTENDANCE TAB */}
              {activeTab === 'Attendance' && (
                <div style={{ paddingTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 16 }}>
                    Manual attendance tracking for {format(selectedDate, 'EEEE, MMMM d')}
                  </div>
                  {classesWithData.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', borderRadius: 12, background: C.card, border: `1px solid ${C.brd}` }}>
                      <p style={{ color: C.t3, fontSize: 13 }}>No sessions to track attendance for on this day.</p>
                    </div>
                  ) : classesWithData.map((cls, idx) => {
                    const key = `${cls.id}-${selDateStr}`;
                    const manualIds = attendance[key] || [];
                    const checkedIds = cls.attended.map(ci => ci.user_id);
                    const totalPresent = [...new Set([...manualIds, ...checkedIds])].length;
                    const c = cls.typeCfg.color;
                    return (
                      <div key={cls.id || idx} className="tcs2-card" style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c}12`, border: `1px solid ${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{cls.typeCfg.emoji}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.t1 }}>{cls.name}</div>
                            <div style={{ fontSize: 11, color: C.t3 }}>{cls.scheduleStr} {cls.duration_minutes ? `· ${cls.duration_minutes}min` : ''}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: fillColor(cls.fill), lineHeight: 1 }}>{totalPresent}<span style={{ fontSize: 13, color: C.t3, fontWeight: 400 }}>/{cls.capacity}</span></div>
                            <div style={{ fontSize: 9, color: C.t3, textTransform: 'uppercase' }}>present</div>
                          </div>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <IBtn icon={CheckCircle} label="All" color={C.green} onClick={() => markAllPresent(key)} size="xs" />
                            <IBtn icon={X} label="Clear" color={C.red} onClick={() => clearAttendance(key)} size="xs" />
                          </div>
                        </div>
                        <div style={{ borderRadius: 0, overflow: 'hidden' }}>
                          {allMemberships.slice(0, 8).map((m, mi) => {
                            const isManual = manualIds.includes(m.user_id);
                            const isQR = checkedIds.includes(m.user_id);
                            const present = isManual || isQR;
                            return (
                              <div key={m.user_id || mi} className="tcs2-row" onClick={() => !isQR && toggleAttendance(key, m.user_id)}
                                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 16px', borderBottom: mi < Math.min(allMemberships.length, 8) - 1 ? `1px solid ${C.brd}` : 'none', cursor: isQR ? 'default' : 'pointer', background: present ? C.greenD : 'transparent' }}>
                                <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${present ? C.green : 'rgba(255,255,255,.1)'}`, background: present ? C.green : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {present && <Check style={{ width: 9, height: 9, color: '#fff' }} />}
                                </div>
                                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: present ? C.t1 : C.t2 }}>{m.user_name || 'Member'}</span>
                                {isQR && <Pill color={C.green} small>QR ✓</Pill>}
                                {isManual && !isQR && <Pill color={C.violet} small>Manual</Pill>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* INSIGHTS TAB */}
              {activeTab === 'Insights' && (
                <InsightsTab classesWithData={classesWithData} checkIns={checkIns} now={now} openModal={openModal} allMemberships={allMemberships} />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <ScheduleSidebar
        classesWithData={classesWithData}
        checkIns={checkIns}
        allMemberships={allMemberships}
        appointments={appointments}
        totalPresent={totalPresent}
        totalBooked={totalBooked}
        avgFill={avgFill}
        totalNoShows={totalNoShows}
        totalLateCancels={totalLateCancels}
        now={now}
        openModal={openModal}
      />
    </div>
  );
}
