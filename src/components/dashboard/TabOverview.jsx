/**
 * Forge Fitness — Gym Owner Dashboard (Overview)
 * Desktop: unchanged
 * Mobile: full premium redesign — sticky header, swipeable cards, vertical flow
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard, Users, FileText, BarChart2, MessageCircle,
  Zap, BrainCircuit, Settings, QrCode, Search, Plus, Bell,
  ChevronRight, ArrowUpRight, Eye, TrendingUp, Activity,
  CheckCircle2, AlertTriangle, Flame, Clock, ChevronDown,
} from 'lucide-react';

/* ─── TOKENS ─────────────────────────────────────────────── */
const C = {
  bg:       '#000000',
  sidebar:  '#0f0f12',
  card:     '#141416',
  brd:      '#222226',
  t1:       '#ffffff',
  t2:       '#8a8a94',
  t3:       '#444450',
  cyan:     '#00e5c8',
  cyanDim:  'rgba(0,229,200,0.1)',
  cyanBrd:  'rgba(0,229,200,0.25)',
  red:      '#ff4d6d',
  redDim:   'rgba(255,77,109,0.15)',
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,0.15)',
};

const FONT = "'DM Sans', 'Segoe UI', sans-serif";

/* ─── TODAY'S SCHEDULE DATA ─────────────────────────────── */
const SCHEDULE = [
  { time: '06:00', label: 'Early Bird HIIT',         instructor: 'Alex T.',  capacity: 12, booked: 11, color: '#f59e0b' },
  { time: '08:30', label: 'Morning Yoga Flow',        instructor: 'Sara M.',  capacity: 10, booked: 7,  color: '#14b8a6' },
  { time: '10:00', label: 'Strength & Conditioning',  instructor: 'Coach Dan',capacity: 8,  booked: 8,  color: '#ff4d6d' },
  { time: '12:15', label: 'Lunchtime Spin',           instructor: 'Priya K.', capacity: 15, booked: 9,  color: '#6366f1' },
  { time: '17:30', label: 'Peak Hour Open Gym',       instructor: '',         capacity: 40, booked: 31, color: '#00e5c8' },
  { time: '18:45', label: 'Boxing Basics',            instructor: 'Mike O.',  capacity: 12, booked: 12, color: '#ef4444' },
  { time: '19:30', label: 'Evening HIIT',             instructor: 'Alex T.',  capacity: 12, booked: 6,  color: '#f59e0b' },
];

/* ─── AVATAR ─────────────────────────────────────────────── */
function Av({ name, size = 20, style = {} }) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444'];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[idx], border: `1.5px solid ${C.card}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      flexShrink: 0, ...style,
    }}>{(name || '?')[0].toUpperCase()}</div>
  );
}

/* ─── WAVEFORM ───────────────────────────────────────────── */
function WaveForm({ color = C.cyan }) {
  const pts = [26,22,24,18,20,15,17,12,14,10,12,8,10,7,9,5,7,11,8,5,7,4,6,3,5,8,6,3,5,2,4,5];
  const w = 130, h = 32;
  const max = Math.max(...pts);
  const pathD = pts.map((v, i) =>
    `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${h - (v / max) * (h - 4) - 2}`
  ).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', width: '100%' }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${w} ${h} L 0 ${h} Z`} fill="url(#wg)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── MINI AREA ──────────────────────────────────────────── */
function MiniArea({ color = C.cyan }) {
  const data = [{ v: 28 }, { v: 32 }, { v: 30 }, { v: 38 }, { v: 42 }, { v: 50 }, { v: 55 }, { v: 60 }, { v: 70 }];
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="mag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#mag)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── DONUT ──────────────────────────────────────────────── */
function Donut({ pct, size = 58, stroke = 5, color = C.cyan }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: C.t1,
      }}>19%</div>
    </div>
  );
}

/* ─── TREND ARROW ────────────────────────────────────────── */
function TrendArrow({ color = C.cyan }) {
  return (
    <svg width={52} height={34} viewBox="0 0 52 34" style={{ marginBottom: 4 }}>
      <polyline points="2,28 12,18 22,21 34,10 50,3"
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
      <polyline points="42,3 50,3 50,11"
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────── */
const NAV = [
  { icon: LayoutDashboard, label: 'Overview',   active: true },
  { icon: Eye,             label: 'Views' },
  { icon: Users,           label: 'Members' },
  { icon: FileText,        label: 'Content' },
  { icon: BarChart2,       label: 'Analytics' },
  { icon: MessageCircle,   label: 'Community' },
  { icon: Zap,             label: 'Automations' },
  { icon: BrainCircuit,    label: 'AI Coach' },
];

function Sidebar() {
  return (
    <div style={{
      width: 188, flexShrink: 0, background: C.sidebar,
      borderRight: `1px solid ${C.brd}`,
      display: 'flex', flexDirection: 'column', height: '100vh',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 14px 14px',
        borderBottom: `1px solid ${C.brd}`,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #00e5c8, #00a896)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
        }}>🔥</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>Forge Fitness</div>
          <div style={{ fontSize: 10, color: C.t2, fontWeight: 400 }}>GYM OWNER</div>
        </div>
      </div>
      <div style={{ padding: '10px 8px', flex: 1 }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 8px 8px' }}>Navigation</div>
        {NAV.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 8px', borderRadius: 7, cursor: 'pointer',
            background: item.active ? C.cyanDim : 'transparent',
            borderLeft: item.active ? `2px solid ${C.cyan}` : '2px solid transparent',
            color: item.active ? C.t1 : C.t2,
            fontSize: 12.5, fontWeight: item.active ? 600 : 400,
            marginBottom: 1,
          }}>
            <item.icon style={{ width: 13, height: 13, flexShrink: 0 }} />
            {item.label}
          </div>
        ))}
      </div>
      <div style={{ padding: '8px', borderTop: `1px solid ${C.brd}` }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 8px', borderRadius: 7, cursor: 'pointer',
          color: C.t2, fontSize: 12.5,
        }}>
          <Settings style={{ width: 13, height: 13 }} /> Settings
        </div>
      </div>
    </div>
  );
}

/* ─── TOP BAR ────────────────────────────────────────────── */
function TopBar() {
  return (
    <div style={{
      height: 46, flexShrink: 0, background: C.sidebar,
      borderBottom: `1px solid ${C.brd}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 18px', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.t2 }}>Gym Owner Dashboard</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.brd}`,
          borderRadius: 7, padding: '5px 10px', width: 220,
        }}>
          <Search style={{ width: 12, height: 12, color: C.t3, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t3 }}>Search members, content, or insights…</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.brd}`,
          borderRadius: 7, padding: '5px 10px', fontSize: 11.5, color: C.t2,
        }}>
          <span>📅</span> Friday 10 April 2026
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 7,
        background: C.cyanDim, border: `1px solid ${C.cyanBrd}`,
        color: C.cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}>
        <QrCode style={{ width: 12, height: 12 }} /> + Scan QR
      </div>
    </div>
  );
}

/* ─── CHART TOOLTIP ─────────────────────────────────────── */
const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#111c2a', border: `1px solid rgba(0,229,200,0.2)`,
      borderRadius: 7, padding: '6px 11px', fontSize: 12, color: C.t1,
    }}>
      <span style={{ color: C.cyan, fontWeight: 600 }}>{payload[0].value}%</span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MOBILE COMPONENTS
══════════════════════════════════════════════════════════ */

/* ─── MOBILE STICKY HEADER ───────────────────────────────── */
function MobileStickyHeader() {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${C.brd}`,
      padding: '10px 16px',
    }}>
      {/* Top row: logo + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #00e5c8, #00a896)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>🔥</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>Forge Fitness</div>
            <div style={{ fontSize: 9.5, color: C.t2, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Gym Owner · April 10</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.brd}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell style={{ width: 16, height: 16, color: C.t2 }} />
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 12px', borderRadius: 10,
            background: C.cyan, color: '#000',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            <QrCode style={{ width: 13, height: 13 }} /> QR
          </div>
        </div>
      </div>

      {/* Pulse strip: 3 key numbers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
        gap: 1, background: C.brd, borderRadius: 10, overflow: 'hidden',
      }}>
        {[
          { label: 'Check-ins', value: '34', delta: '+24%', color: C.cyan },
          { label: 'Active', value: '42', delta: '+7%', color: C.cyan },
          { label: 'Retention', value: '96%', delta: 'Elite', color: C.cyan },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#0a0a0c', padding: '8px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 1 }}>{s.label}</div>
            <div style={{ fontSize: 9, color: s.color, fontWeight: 600, marginTop: 1 }}>{s.delta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MOBILE ALERT BANNER ────────────────────────────────── */
function MobileAlertBanner() {
  return (
    <div style={{
      margin: '12px 16px 0',
      padding: '11px 14px',
      background: 'rgba(255,77,109,0.07)',
      border: `1px solid rgba(255,77,109,0.2)`,
      borderRadius: 12,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: 'rgba(255,77,109,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        <AlertTriangle style={{ width: 14, height: 14, color: C.red }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, marginBottom: 3 }}>3 actions need attention</div>
        <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.5 }}>
          Peak hours in 18 min · 5 at-risk members · 3 predicted churns
        </div>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.cyan, paddingTop: 2, flexShrink: 0 }}>View</div>
    </div>
  );
}

/* ─── MOBILE SECTION HEADER ──────────────────────────────── */
function MSectionHeader({ title, action, actionLabel = 'See all' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-0.01em' }}>{title}</div>
      {action && (
        <div
          style={{ fontSize: 11.5, color: C.cyan, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
          onClick={action}
        >
          {actionLabel} <ChevronRight style={{ width: 12, height: 12 }} />
        </div>
      )}
    </div>
  );
}

/* ─── MOBILE KPI CARDS (swipeable row) ──────────────────── */
function MobileKpiStrip() {
  const scrollRef = useRef(null);

  const kpis = [
    {
      label: "Today's Check-ins",
      value: '34',
      delta: '+24%',
      sub: 'vs yesterday',
      color: C.cyan,
      icon: Activity,
      chart: <WaveForm color={C.cyan} />,
    },
    {
      label: 'Weekly Active',
      value: '42',
      delta: '+7%',
      sub: 'members',
      color: C.cyan,
      icon: Users,
      chart: <MiniArea color={C.cyan} />,
    },
    {
      label: 'Live in Gym',
      value: '19%',
      delta: 'Peak 5–7 PM',
      sub: 'capacity',
      color: '#6366f1',
      icon: Flame,
      chart: <Donut pct={19} size={44} stroke={4} color="#6366f1" />,
    },
    {
      label: 'Retention Score',
      value: '96%',
      delta: 'Elite Tier',
      sub: '+4% week',
      color: C.cyan,
      icon: TrendingUp,
      chart: <TrendArrow color={C.cyan} />,
    },
  ];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}
      ref={scrollRef}
    >
      <div style={{
        display: 'flex', gap: 10,
        padding: '0 16px',
        width: 'max-content',
      }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            width: 160, flexShrink: 0,
            background: C.card,
            border: `1px solid ${C.brd}`,
            borderRadius: 16, padding: '14px 14px 10px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Subtle glow */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 70, height: 70, borderRadius: '50%',
              background: k.color, opacity: 0.06, filter: 'blur(20px)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, lineHeight: 1.3 }}>{k.label}</div>
              <div style={{
                width: 24, height: 24, borderRadius: 7,
                background: `${k.color}15`, border: `1px solid ${k.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <k.icon style={{ width: 11, height: 11, color: k.color }} />
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 3 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 10.5, color: k.color, fontWeight: 600, marginBottom: 8 }}>
              {k.delta}
            </div>
            <div style={{ height: 34 }}>{k.chart}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MOBILE PRIORITIES ──────────────────────────────────── */
function MobilePriorities() {
  const items = [
    {
      avs: ['S','M','P'], text: 'Nudge 5 at-risk members',
      badge: 'Urgent', bColor: C.red, bBg: C.redDim,
      icon: AlertTriangle,
    },
    {
      avs: ['D','E'], text: 'Launch "30-Day Strength Surge"',
      badge: 'Run It', bColor: C.amber, bBg: C.amberDim,
      icon: Flame,
    },
    {
      avs: ['R'], text: 'Review April revenue impact',
      badge: null,
      icon: BarChart2,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 14px', borderRadius: 13,
          background: C.card, border: `1px solid ${C.brd}`,
          cursor: 'pointer',
        }}>
          {/* Avatar cluster */}
          <div style={{ display: 'flex', flexShrink: 0 }}>
            {it.avs.map((n, j) => (
              <Av key={j} name={n} size={28} style={{ marginLeft: j > 0 ? -8 : 0, border: `2px solid ${C.card}` }} />
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: C.t1, fontWeight: 500, lineHeight: 1.35 }}>{it.text}</div>
            {it.badge && (
              <span style={{
                display: 'inline-block', marginTop: 5,
                fontSize: 10.5, fontWeight: 700, color: it.bColor,
                background: it.bBg, border: `1px solid ${it.bColor}50`,
                borderRadius: 5, padding: '2px 9px',
              }}>{it.badge}</span>
            )}
          </div>
          <ChevronRight style={{ width: 14, height: 14, color: C.t3, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

/* ─── MOBILE SCHEDULE ────────────────────────────────────── */
function MobileSchedule() {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? SCHEDULE : SCHEDULE.slice(0, 4);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {shown.map((s, i) => {
          const pct = Math.round((s.booked / s.capacity) * 100);
          const full = s.booked >= s.capacity;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 13,
              background: C.card, border: `1px solid ${C.brd}`,
            }}>
              {/* Color indicator */}
              <div style={{ width: 3, height: 38, borderRadius: 4, background: s.color, flexShrink: 0 }} />
              {/* Time */}
              <div style={{
                fontSize: 12, fontWeight: 700, color: C.t3,
                width: 38, flexShrink: 0, fontVariantNumeric: 'tabular-nums',
              }}>{s.time}</div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                {s.instructor && (
                  <div style={{ fontSize: 11, color: C.t2, marginTop: 2 }}>{s.instructor}</div>
                )}
              </div>
              {/* Booking */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 48, height: 3, background: C.brd, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: full ? C.red : s.color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: full ? C.red : C.t2, minWidth: 28 }}>
                    {s.booked}/{s.capacity}
                  </span>
                </div>
                {full && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: C.red,
                    background: C.redDim, border: `1px solid ${C.red}40`,
                    borderRadius: 4, padding: '1px 6px',
                  }}>FULL</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', marginTop: 8, padding: '11px',
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.brd}`,
          borderRadius: 12, color: C.t2, fontSize: 12.5, fontWeight: 500,
          cursor: 'pointer', fontFamily: FONT,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}
      >
        {expanded ? 'Show less' : `Show ${SCHEDULE.length - 4} more classes`}
        <ChevronDown style={{
          width: 13, height: 13,
          transform: expanded ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }} />
      </button>
    </div>
  );
}

/* ─── MOBILE COMMUNITY ───────────────────────────────────── */
function MobileCommunity() {
  const cards = [
    { tag: '🆕 New Post',         tagColor: C.cyan,  title: "Coach Alex's Mobility Flow",     sub: '27 joined · 4 new reactions' },
    { tag: 'Member Spotlight',    tagColor: C.amber, title: "Priya's 12-week transformation",  sub: 'Tap to celebrate 🎉' },
    { tag: 'Event live tomorrow', tagColor: C.red,   title: 'Free Recovery Workshop',          sub: 'Register before it fills' },
  ];

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: 10, padding: '0 16px', width: 'max-content' }}>
        {cards.map((c, i) => (
          <div key={i} style={{
            width: 200, flexShrink: 0,
            padding: '14px', borderRadius: 14,
            background: C.card, border: `1px solid ${C.brd}`,
            cursor: 'pointer',
          }}
            onTouchStart={e => e.currentTarget.style.borderColor = C.cyanBrd}
            onTouchEnd={e => e.currentTarget.style.borderColor = C.brd}
          >
            <div style={{
              display: 'inline-block',
              fontSize: 10, fontWeight: 700, color: c.tagColor,
              background: `${c.tagColor}18`, border: `1px solid ${c.tagColor}35`,
              borderRadius: 5, padding: '2px 8px', marginBottom: 8,
            }}>{c.tag}</div>
            <div style={{ fontSize: 13, color: C.t1, fontWeight: 600, lineHeight: 1.35, marginBottom: 6 }}>{c.title}</div>
            {c.sub && <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.4 }}>{c.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MOBILE BOTTOM FAB ──────────────────────────────────── */
function MobileFab() {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      zIndex: 100,
      display: 'flex', gap: 10,
    }}>
      <button style={{
        height: 48, padding: '0 18px',
        borderRadius: 24,
        background: C.cyan, border: 'none',
        color: '#000', fontSize: 13, fontWeight: 700,
        fontFamily: FONT, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 7,
        boxShadow: `0 4px 24px rgba(0,229,200,0.4)`,
      }}>
        <Plus style={{ width: 16, height: 16 }} /> New Post
      </button>
    </div>
  );
}

/* ─── MOBILE BOTTOM NAV ──────────────────────────────────── */
function MobileBottomNav() {
  const tabs = [
    { icon: LayoutDashboard, label: 'Home', active: true },
    { icon: Users, label: 'Members' },
    { icon: BarChart2, label: 'Analytics' },
    { icon: MessageCircle, label: 'Community' },
    { icon: BrainCircuit, label: 'AI Coach' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 50,
      background: 'rgba(15,15,18,0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${C.brd}`,
      padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      display: 'grid', gridTemplateColumns: 'repeat(5,1fr)',
    }}>
      {tabs.map((t, i) => (
        <div key={i} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '5px 0', cursor: 'pointer',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: t.active ? C.cyanDim : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <t.icon style={{ width: 17, height: 17, color: t.active ? C.cyan : C.t3 }} />
          </div>
          <div style={{ fontSize: 9.5, color: t.active ? C.cyan : C.t3, fontWeight: t.active ? 600 : 400 }}>
            {t.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── MOBILE OVERVIEW ────────────────────────────────────── */
function MobileOverview() {
  return (
    <div style={{
      fontFamily: FONT,
      background: C.bg,
      minHeight: '100vh',
      paddingBottom: 100,
    }}>
      <MobileStickyHeader />
      <MobileAlertBanner />

      {/* Hero greeting */}
      <div style={{ padding: '16px 16px 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1.25 }}>
          Good morning, Max. 👋
        </div>
        <div style={{ fontSize: 13, color: C.t2, marginTop: 4 }}>
          Your retention pulse is strong today.{' '}
          <span style={{ color: C.cyan }}>+4% from last week</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ padding: '14px 0 0' }}>
        <div style={{ padding: '0 16px 10px' }}>
          <MSectionHeader title="Key Metrics" />
        </div>
        <MobileKpiStrip />
      </div>

      {/* Priorities */}
      <div style={{ padding: '20px 16px 0' }}>
        <MSectionHeader title="Today's Priorities" action={() => {}} />
        <MobilePriorities />
      </div>

      {/* Schedule */}
      <div style={{ padding: '20px 16px 0' }}>
        <MSectionHeader
          title="Today's Schedule"
          action={() => {}}
          actionLabel="+ Add Class"
        />
        <MobileSchedule />
      </div>

      {/* Community */}
      <div style={{ padding: '20px 0 0' }}>
        <div style={{ padding: '0 16px 10px' }}>
          <MSectionHeader title="Community Highlights" action={() => {}} />
        </div>
        <MobileCommunity />
      </div>

      <MobileFab />
      <MobileBottomNav />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DESKTOP OVERVIEW — unchanged
══════════════════════════════════════════════════════════ */
function DesktopOverview() {
  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 11, padding: '16px 20px', background: '#000', minHeight: '100%' }}>

      {/* HERO */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 700, color: C.t1, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Good morning, Max. Your retention pulse is strong today.
          </h1>
          <div style={{ fontSize: 12, color: C.t2, marginTop: 4, display: 'flex', gap: 5, alignItems: 'center' }}>
            42 members active
            <span style={{ color: C.t3 }}>•</span>
            96% weekly retention
            <span style={{ color: C.t3 }}>•</span>
            <span style={{ color: C.cyan }}>+4% from last week</span>
          </div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', background: C.cyan, border: 'none',
          borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: '#000',
          cursor: 'pointer', fontFamily: FONT,
          boxShadow: '0 0 20px rgba(0,229,200,0.35)', flexShrink: 0,
        }}>
          <Plus style={{ width: 13, height: 13 }} /> New Post
        </button>
      </div>

      {/* ALERT */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 14px', background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${C.brd}`, borderRadius: 8,
        fontSize: 12, color: C.t2,
      }}>
        <span>Peak hours begin in 18 minutes &nbsp;•&nbsp; 5 at-risk members detected &nbsp;•&nbsp; AI predicts 3 potential churns &nbsp;•&nbsp; 4 new community posts today</span>
        <span style={{ color: C.cyan, fontWeight: 600, cursor: 'pointer', marginLeft: 10, flexShrink: 0 }}>View</span>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>

        {/* Check-ins */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: C.t2, fontWeight: 500 }}>Today's Check-ins</span>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight style={{ width: 10, height: 10, color: C.t3 }} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1.1 }}>34</div>
          <div style={{ fontSize: 11, color: C.cyan, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
            <ArrowUpRight style={{ width: 10, height: 10 }} /> +24% ↑
          </div>
          <WaveForm color={C.cyan} />
        </div>

        {/* Weekly Active */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 2 }}>Weekly Active Members</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1.1 }}>42</div>
          <div style={{ fontSize: 11, color: C.cyan, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
            <ArrowUpRight style={{ width: 10, height: 10 }} /> +7%
          </div>
          <MiniArea color={C.cyan} />
        </div>

        {/* Live in Gym */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: C.t2, fontWeight: 500 }}>Live in Gym</span>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus style={{ width: 10, height: 10, color: C.t3 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>
                19<span style={{ fontSize: 15, color: C.t3, fontWeight: 400 }}>%</span>
              </div>
              <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>Peak 5–7 PM</div>
            </div>
            <Donut pct={19} size={58} stroke={5} color={C.cyan} />
          </div>
        </div>

        {/* Retention Score */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 11, color: C.t2, fontWeight: 500 }}>Retention Score</span>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight style={{ width: 10, height: 10, color: C.t3 }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 }}>
            <div>
              <div style={{
                fontSize: 32, fontWeight: 700, color: C.cyan,
                letterSpacing: '-0.03em', lineHeight: 1,
                textShadow: '0 0 20px rgba(0,229,200,0.4)',
              }}>96%</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>Elite Tier</div>
            </div>
            <TrendArrow color={C.cyan} />
          </div>
        </div>

      </div>

      {/* CHART + PRIORITIES */}
      <div style={{ display: 'flex', gap: 11 }}>

        {/* Today's Schedule */}
        <div style={{
          background: C.card, border: `1px solid ${C.brd}`,
          borderRadius: 10, padding: '16px 18px', flex: 1, minWidth: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Today's Schedule</span>
            <button style={{
              padding: '5px 12px', borderRadius: 6,
              background: C.cyanDim, border: `1px solid ${C.cyanBrd}`,
              color: C.cyan, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONT,
            }}>+ Add Class</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SCHEDULE.map((s, i) => {
              const pct = Math.round((s.booked / s.capacity) * 100);
              const full = s.booked >= s.capacity;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 11px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${C.brd}`,
                  borderLeft: `3px solid ${s.color}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, width: 36, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{s.time}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                    {s.instructor && <div style={{ fontSize: 10.5, color: C.t2, marginTop: 1 }}>{s.instructor}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                    <div style={{ width: 60 }}>
                      <div style={{ height: 3, background: C.brd, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: full ? C.red : s.color, borderRadius: 2 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: full ? C.red : C.t2, minWidth: 32, textAlign: 'right' }}>
                      {s.booked}/{s.capacity}
                    </span>
                    {full && <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: C.redDim, border: `1px solid ${C.red}40`, borderRadius: 4, padding: '1px 5px' }}>FULL</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priorities */}
        <div style={{
          background: C.card, border: `1px solid ${C.brd}`,
          borderRadius: 10, padding: '16px', width: 248, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Today's Priorities</span>
            <ChevronRight style={{ width: 12, height: 12, color: C.t3 }} />
          </div>

          {[
            { avs: ['S','M','P'], text: 'Nudge 5 at-risk members', badge: 'Urgent', bColor: '#ff4d6d', bBg: 'rgba(255,77,109,0.15)' },
            { avs: ['D','E'], text: 'Launch new challenge\n"30-Day Strength Surge"', badge: 'Run It', bColor: '#f59e0b', bBg: 'rgba(245,158,11,0.15)' },
            { avs: ['R'], text: 'Review April revenue impact', badge: null },
          ].map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', flexShrink: 0, marginTop: 2 }}>
                {it.avs.map((n, j) => <Av key={j} name={n} size={20} style={{ marginLeft: j > 0 ? -6 : 0 }} />)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.t1, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{it.text}</div>
                {it.badge && (
                  <span style={{
                    display: 'inline-block', marginTop: 4,
                    fontSize: 10, fontWeight: 700, color: it.bColor,
                    background: it.bBg, border: `1px solid ${it.bColor}50`,
                    borderRadius: 4, padding: '2px 8px',
                  }}>{it.badge}</span>
                )}
              </div>
            </div>
          ))}

          <div style={{ paddingTop: 10, borderTop: `1px solid ${C.brd}`, fontSize: 11, color: C.t3 }}>
            View Live <span style={{ color: C.cyan }}>|</span> Live <span style={{ color: C.cyan }}>|</span> Live Single Studio <span style={{ color: C.cyan }}>|</span> Floor
          </div>
        </div>
      </div>

      {/* COMMUNITY */}
      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Community Highlights</span>
            <ChevronRight style={{ width: 12, height: 12, color: C.t3 }} />
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {['Post Photo', 'Create Challenge', 'Schedule Event'].map((lbl, i) => (
              <button key={i} style={{
                padding: '5px 11px', borderRadius: 6,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.brd}`,
                color: C.t2, fontSize: 11.5, cursor: 'pointer',
                fontFamily: FONT, fontWeight: 500,
              }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { tag: '🆕 New Post',         tagColor: C.cyan,  title: "Coach Alex's Mobility Flow",    sub: '27 joined' },
            { tag: 'Member Spotlight',    tagColor: C.amber, title: "Priya's 12-week transformation" },
            { tag: 'Event live tomorrow', tagColor: C.red,   title: 'Free Recovery Workshop' },
          ].map((c, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.brd}`,
              cursor: 'pointer',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}
            >
              <div style={{ fontSize: 10.5, fontWeight: 600, color: c.tagColor, marginBottom: 4 }}>{c.tag}</div>
              <div style={{ fontSize: 12.5, color: C.t1, fontWeight: 500, lineHeight: 1.3 }}>{c.title}</div>
              {c.sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>• {c.sub}</div>}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT — responsive switch at 768px
══════════════════════════════════════════════════════════ */
export default function TabOverview({ openModal, setTab } = {}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile ? <MobileOverview /> : <DesktopOverview />;
}
