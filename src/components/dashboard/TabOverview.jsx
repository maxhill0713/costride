/**
 * Forge Fitness — Gym Owner Dashboard (Improved)
 * Compact KPI row, graphs/icons on all 4 cards, tighter layout.
 * Dependencies: recharts, lucide-react
 */

import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  LayoutDashboard, Users, FileText, BarChart2, MessageCircle,
  Zap, BrainCircuit, Settings, QrCode, Search, Plus, Bell,
  ChevronRight, ArrowUpRight, Eye,
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

/* ─── RETENTION DATA ─────────────────────────────────────── */
const RETENTION_DATA = [
  { x: 'Nov', v: 0 },
  { x: 'Dec', v: 8 },
  { x: 'Jan', v: 20 },
  { x: 'Feb', v: 35 },
  { x: 'Mar', v: 55 },
  { x: 'Apr', v: 96 },
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
      {/* Logo */}
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

      {/* Nav */}
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

/* ─── MAIN OVERVIEW ──────────────────────────────────────── */
export default function TabOverview({ openModal, setTab } = {}) {
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

          {/* KPI ROW — compact */}
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

            {/* Retention Chart */}
            <div style={{
              background: C.card, border: `1px solid ${C.brd}`,
              borderRadius: 10, padding: '16px 18px', flex: 1, minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>30-Day Retention Trend</span>
                <button style={{
                  padding: '5px 12px', borderRadius: 6,
                  background: C.cyanDim, border: `1px solid ${C.cyanBrd}`,
                  color: C.cyan, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: FONT,
                }}>Ask AI Coach</button>
              </div>
              <div style={{ position: 'relative', height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={RETENTION_DATA} margin={{ top: 16, right: 8, bottom: 0, left: -26 }}>
                    <defs>
                      <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.cyan} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="x" tick={{ fill: C.t3, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.t3, fontSize: 10, fontFamily: FONT }} axisLine={false} tickLine={false} domain={[0, 100]} tickCount={5} />
                    <Tooltip content={<ChartTip />} />
                    <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2}
                      fill="url(#retGrad)" dot={false}
                      activeDot={{ r: 4, fill: C.cyan, strokeWidth: 2, stroke: C.card }} />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Avatar overlays */}
                <div style={{ position: 'absolute', top: '80%', left: '2%' }}>
                  <Av name="A" size={20} />
                </div>
                <div style={{ position: 'absolute', top: '55%', left: '40%', display: 'flex' }}>
                  {['J','K','L'].map((n, i) => <Av key={i} name={n} size={20} style={{ marginLeft: i > 0 ? -6 : 0 }} />)}
                </div>
                <div style={{ position: 'absolute', top: '28%', left: '74%', display: 'flex' }}>
                  {['A','B','C'].map((n, i) => <Av key={i} name={n} size={20} style={{ marginLeft: i > 0 ? -6 : 0 }} />)}
                </div>

                {/* AI Insight bubble */}
                <div style={{
                  position: 'absolute', bottom: '14%', left: '36%',
                  background: '#111c2a', border: '1px solid rgba(0,229,200,0.2)',
                  borderRadius: 8, padding: '8px 11px', maxWidth: 185,
                  fontSize: 11, color: C.t2, lineHeight: 1.45,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                }}>
                  <span style={{ color: C.cyan, fontWeight: 700 }}>AI Insight:</span> Your HIIT challenge cohort is +31% more likely to stay
                </div>
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
                {
                  avs: ['S','M','P'], text: 'Nudge 5 at-risk members',
                  badge: 'Urgent', bColor: '#ff4d6d', bBg: 'rgba(255,77,109,0.15)',
                },
                {
                  avs: ['D','E'], text: 'Launch new challenge\n"30-Day Strength Surge"',
                  badge: 'Run It', bColor: '#f59e0b', bBg: 'rgba(245,158,11,0.15)',
                },
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