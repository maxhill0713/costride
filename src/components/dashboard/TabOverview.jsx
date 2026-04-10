/**
 * Forge Fitness — Gym Owner Dashboard
 * Pixel-perfect recreation of the reference image.
 * Full layout: Sidebar + TopBar + Overview content.
 *
 * Dependencies: recharts, lucide-react
 */

import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  LayoutDashboard, Users, FileText, BarChart2, MessageCircle,
  Zap, BrainCircuit, Settings, QrCode, Search, Plus,
  ChevronRight, ArrowUpRight, Eye,
} from 'lucide-react';

/* ─── TOKENS ─────────────────────────────────────────────── */
const C = {
  bg:        '#0e0e10',
  sidebar:   '#111114',
  topbar:    '#111114',
  card:      '#161618',
  cardBrd:   '#252528',
  divider:   '#252528',
  t1:        '#ffffff',
  t2:        '#a0a0a8',
  t3:        '#505058',
  cyan:      '#00e5c8',
  cyanDim:   'rgba(0,229,200,0.12)',
  cyanBrd:   'rgba(0,229,200,0.3)',
  red:       '#ff4d6d',
  redDim:    'rgba(255,77,109,0.15)',
  amber:     '#f59e0b',
  amberDim:  'rgba(245,158,11,0.15)',
};

const FONT = "'DM Sans', 'Segoe UI', sans-serif";

/* ─── RETENTION CHART DATA ───────────────────────────────── */
const RETENTION_DATA = [
  { x: 'Nov', v: 0 },
  { x: 'Dec', v: 8 },
  { x: 'Jan', v: 20 },
  { x: 'Feb', v: 35 },
  { x: 'Mar', v: 55 },
  { x: 'Apr', v: 96 },
];

/* ─── AVATAR BUBBLE ──────────────────────────────────────── */
function Av({ name, size = 22, style = {} }) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444'];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  const ini = (name || '?')[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[idx], border: `2px solid #161618`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      flexShrink: 0, ...style,
    }}>{ini}</div>
  );
}

/* ─── WAVEFORM SPARK ─────────────────────────────────────── */
function WaveForm({ color = C.cyan }) {
  const pts = [3,8,5,12,7,14,6,16,10,13,8,18,11,14,9,20,14,17,12,22,16,19,13,24,17,20,15,22,18,19,14,16];
  const w = 130, h = 36;
  const max = Math.max(...pts);
  const pathD = pts.map((v, i) =>
    `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${h - (v / max) * (h - 4) - 2}`
  ).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${w} ${h} L 0 ${h} Z`} fill="url(#wg)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── MINI AREA CHART ────────────────────────────────────── */
function MiniArea({ color = C.cyan }) {
  const data = [{ v: 30 }, { v: 45 }, { v: 38 }, { v: 55 }, { v: 48 }, { v: 62 }, { v: 70 }, { v: 58 }, { v: 80 }];
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="mag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#mag)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── DONUT RING ─────────────────────────────────────────── */
function Donut({ pct, size = 66, stroke = 6, color = C.cyan }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  );
}

/* ─── TREND ARROW ────────────────────────────────────────── */
function TrendArrow({ color = C.cyan }) {
  return (
    <svg width={50} height={36} viewBox="0 0 50 36">
      <polyline points="2,30 14,18 24,22 38,8 48,4"
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
      <polyline points="40,4 48,4 48,12"
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── SIDEBAR ────────────────────────────────────────────── */
const NAV = [
  { icon: LayoutDashboard, label: 'Overview',    active: true },
  { icon: Eye,             label: 'Views' },
  { icon: Users,           label: 'Members' },
  { icon: FileText,        label: 'Content' },
  { icon: BarChart2,       label: 'Analytics' },
  { icon: MessageCircle,   label: 'Community' },
  { icon: Zap,             label: 'Automations' },
  { icon: BrainCircuit,    label: 'AI Coach' },
];


/* ─── HERO HEADER ────────────────────────────────────────── */
function HeroHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.t1, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
          Good morning, Max. Your retention pulse is strong today.
        </h1>
        <p style={{ fontSize: 12.5, color: C.t2, margin: '5px 0 0', display: 'flex', gap: 6, alignItems: 'center' }}>
          42 members active
          <span style={{ color: C.t3 }}>•</span>
          96% weekly retention
          <span style={{ color: C.t3 }}>•</span>
          <span style={{ color: C.cyan }}>+4% from last week</span>
        </p>
      </div>
      <button style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px',
        background: C.cyan, border: 'none', borderRadius: 9,
        fontSize: 13, fontWeight: 700, color: '#000', cursor: 'pointer',
        fontFamily: FONT, boxShadow: `0 0 24px rgba(0,229,200,0.4)`,
        whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 20,
      }}>
        <Plus style={{ width: 15, height: 15 }} /> New Post
      </button>
    </div>
  );
}

/* ─── ALERT BANNER ───────────────────────────────────────── */
function AlertBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderRadius: 9, marginBottom: 16,
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${C.divider}`,
      fontSize: 12.5, color: C.t2,
    }}>
      <span>
        Peak hours begin in 18 minutes &nbsp;•&nbsp;
        5 at-risk members detected &nbsp;•&nbsp;
        AI predicts 3 potential churns &nbsp;•&nbsp;
        4 new community posts today
      </span>
      <span style={{ color: C.cyan, fontWeight: 600, cursor: 'pointer', marginLeft: 12, whiteSpace: 'nowrap' }}>
        View
      </span>
    </div>
  );
}

/* ─── 4 KPI CARDS ────────────────────────────────────────── */
function KpiRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>

      {/* Today's Check-ins */}
      <div style={{ background: C.card, border: `1px solid ${C.cardBrd}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>Today's Check-ins</span>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight style={{ width: 12, height: 12, color: C.t3 }} />
          </div>
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: C.t1, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 6 }}>34</div>
        <div style={{ fontSize: 12, color: C.cyan, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
          <ArrowUpRight style={{ width: 12, height: 12 }} /> +24% ↑
        </div>
        <WaveForm color={C.cyan} />
      </div>

      {/* Weekly Active Members */}
      <div style={{ background: C.card, border: `1px solid ${C.cardBrd}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>Weekly Active Members</span>
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: C.t1, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 6 }}>42</div>
        <div style={{ fontSize: 12, color: C.cyan, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <ArrowUpRight style={{ width: 12, height: 12 }} /> +7%
        </div>
        <MiniArea color={C.cyan} />
      </div>

      {/* Live in Gym */}
      <div style={{ background: C.card, border: `1px solid ${C.cardBrd}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>Live in Gym</span>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus style={{ width: 12, height: 12, color: C.t3 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.t1, lineHeight: 1, letterSpacing: '-0.03em' }}>
              19<span style={{ fontSize: 18, color: C.t3, fontWeight: 400 }}>%</span>
            </div>
            <div style={{ fontSize: 11.5, color: C.t3, marginTop: 8 }}>Peak 5-7 PM</div>
          </div>
          <div style={{ position: 'relative' }}>
            <Donut pct={19} size={68} stroke={5.5} color={C.cyan} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: C.t1,
              transform: 'rotate(0deg)',
            }}>19%</div>
          </div>
        </div>
      </div>

      {/* Retention Score */}
      <div style={{ background: C.card, border: `1px solid ${C.cardBrd}`, borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>Retention Score</span>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpRight style={{ width: 12, height: 12, color: C.t3 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 42, fontWeight: 700, color: C.cyan, lineHeight: 1, letterSpacing: '-0.03em', textShadow: `0 0 24px rgba(0,229,200,0.5)` }}>
              96%
            </div>
            <div style={{ fontSize: 12, color: C.t3, marginTop: 8 }}>Elite Tier</div>
          </div>
          <TrendArrow color={C.cyan} />
        </div>
      </div>
    </div>
  );
}

/* ─── RETENTION CHART ────────────────────────────────────── */
const ChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e2a38', border: `1px solid ${C.cyanBrd}`,
      borderRadius: 8, padding: '7px 12px', fontSize: 12, color: C.t1,
    }}>
      <span style={{ color: C.cyan, fontWeight: 600 }}>{payload[0].value}%</span>
    </div>
  );
};

function RetentionChart() {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardBrd}`,
      borderRadius: 12, padding: '18px 20px', flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>30-Day Retention Trend</span>
        <button style={{
          padding: '6px 14px', borderRadius: 7, background: C.cyanDim,
          border: `1px solid ${C.cyanBrd}`, color: C.cyan, fontSize: 11.5,
          fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
        }}>Ask AI Coach</button>
      </div>

      <div style={{ position: 'relative', height: 210 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={RETENTION_DATA} margin={{ top: 20, right: 10, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity={0.4} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="x" tick={{ fill: C.t3, fontSize: 10.5, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.t3, fontSize: 10.5, fontFamily: FONT }} axisLine={false} tickLine={false} domain={[0, 100]} tickCount={4} tickFormatter={v => `${v}`} />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2.5}
              fill="url(#retGrad)" dot={false}
              activeDot={{ r: 5, fill: C.cyan, strokeWidth: 2, stroke: C.card }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Floating member avatars at data points */}
        {/* Nov point — bottom left */}
        <div style={{ position: 'absolute', top: '82%', left: '1%' }}>
          <Av name="A" size={22} />
        </div>
        {/* Jan/Feb cluster */}
        <div style={{ position: 'absolute', top: '56%', left: '36%', display: 'flex' }}>
          {['J','K','L'].map((n, i) => <Av key={i} name={n} size={22} style={{ marginLeft: i > 0 ? -7 : 0 }} />)}
        </div>
        {/* Mar cluster */}
        <div style={{ position: 'absolute', top: '34%', left: '59%', display: 'flex' }}>
          {['A','B','C'].map((n, i) => <Av key={i} name={n} size={22} style={{ marginLeft: i > 0 ? -7 : 0 }} />)}
        </div>

        {/* AI Insight bubble */}
        <div style={{
          position: 'absolute', bottom: '18%', left: '40%',
          background: '#182234', border: `1px solid rgba(0,229,200,0.22)`,
          borderRadius: 9, padding: '9px 13px', maxWidth: 200,
          fontSize: 11.5, color: C.t2, lineHeight: 1.45,
          boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
        }}>
          <span style={{ color: C.cyan, fontWeight: 700 }}>AI Insight:</span> Your HIIT challenge cohort is +31% more likely to stay
        </div>
      </div>
    </div>
  );
}

/* ─── TODAY'S PRIORITIES ─────────────────────────────────── */
function TodaysPriorities({ openModal }) {
  const items = [
    { avatars: ['S','M','P','J','A'], text: 'Nudge 5 at-risk members', badge: 'Urgent', bColor: C.red, bBg: C.redDim },
    { avatars: ['D','E'],             text: 'Launch new challenge\n"30-Day Strength Surge"', badge: 'Run It', bColor: C.amber, bBg: C.amberDim },
    { avatars: ['R'],                 text: 'Review April revenue impact', badge: null },
  ];

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.cardBrd}`,
      borderRadius: 12, padding: '18px 18px', width: 268, flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.t1 }}>Today's Priorities</span>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight style={{ width: 12, height: 12, color: C.t3 }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ display: 'flex', flexShrink: 0, marginTop: 2 }}>
              {it.avatars.slice(0, 3).map((n, j) => (
                <Av key={j} name={n} size={22} style={{ marginLeft: j > 0 ? -6 : 0 }} />
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: C.t1, lineHeight: 1.4, whiteSpace: 'pre-line', marginBottom: it.badge ? 7 : 0 }}>
                {it.text}
              </div>
              {it.badge && (
                <span style={{
                  fontSize: 10.5, fontWeight: 700, color: it.bColor,
                  background: it.bBg, border: `1px solid ${it.bColor}40`,
                  borderRadius: 5, padding: '2px 9px',
                }}>{it.badge}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.divider}`, fontSize: 11.5, color: C.t3 }}>
        View Live{' '}
        <span style={{ color: C.cyan }}>|</span>{' '}
        Live{' '}
        <span style={{ color: C.cyan }}>|</span>{' '}
        Live Single Studio{' '}
        <span style={{ color: C.cyan }}>|</span>{' '}
        Floor
      </div>
    </div>
  );
}

/* ─── COMMUNITY HIGHLIGHTS ───────────────────────────────── */
function CommunityHighlights({ openModal }) {
  const cards = [
    { tag: '🆕 New Post',         tagColor: C.cyan,  title: "Coach Alex's Mobility Flow",    sub: '27 joined' },
    { tag: 'Member Spotlight',    tagColor: C.amber, title: "Priya's 12-week transformation", sub: null },
    { tag: 'Event live tomorrow', tagColor: C.red,   title: 'Free Recovery Workshop',         sub: null },
  ];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.cardBrd}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.t1, marginRight: 4 }}>Community Highlights</span>
        <ChevronRight style={{ width: 14, height: 14, color: C.t3 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['Post Photo', 'Create Challenge', 'Schedule Event'].map((label, i) => (
            <button key={i} style={{
              padding: '6px 14px', borderRadius: 7,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.divider}`,
              color: C.t2, fontSize: 12, cursor: 'pointer', fontFamily: FONT, fontWeight: 500,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {cards.map((c, i) => (
          <div key={i}
            style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.divider}`,
              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
              transition: 'border-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.divider}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: c.tagColor }}>{c.tag}</div>
            <div style={{ fontSize: 13, color: C.t1, fontWeight: 500, lineHeight: 1.35 }}>{c.title}</div>
            {c.sub && <div style={{ fontSize: 11.5, color: C.t3 }}>• {c.sub}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <ChevronRight style={{ width: 14, height: 14, color: C.t3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ──────────────────────────────────────────── */
export default function TabOverview({ openModal, setTab } = {}) {
  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: C.bg, fontFamily: FONT, color: C.t1,
    }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <HeroHeader />
          <AlertBanner />
          <KpiRow />

          {/* Chart + Priorities */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
            <RetentionChart />
            <TodaysPriorities openModal={openModal} />
          </div>

          <CommunityHighlights openModal={openModal} />
        </div>
      </div>
    </div>
  );
}
