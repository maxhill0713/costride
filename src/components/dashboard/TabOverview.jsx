import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  AlertTriangle, ArrowRight, Activity, TrendingUp, TrendingDown,
  RotateCcw, BarChart2, Star, MessageSquare, Phone, PlayCircle,
  Check, MoreHorizontal, Eye, Dumbbell, Users, DollarSign,
  Zap, Target, ChevronUp, ChevronDown, Send,
  LayoutDashboard, FileText, Settings, Gift, Flame,
  ExternalLink, LogOut, QrCode, Search,
} from 'lucide-react';

/* ─── Content Hub design tokens — exact match ────────────────── */
const C = {
  bg:      "#0b0e17",
  surface: "#111520",
  card:    "#161b28",
  card2:   "#1a2030",
  border:  "rgba(255,255,255,0.06)",
  border2: "rgba(255,255,255,0.10)",
  text:    "#e8ecf4",
  muted:   "#7c879e",
  dim:     "#3e4a60",
  dimmer:  "#252d3d",
  blue:    "#3b82f6",  blueDim:    "rgba(59,130,246,0.13)",   blueBorder:   "rgba(59,130,246,0.22)",
  red:     "#f87171",  redDim:     "rgba(239,68,68,0.10)",    redBorder:    "rgba(239,68,68,0.25)",
  redSolid:"#ef4444",
  amber:   "#fbbf24",  amberDim:   "rgba(245,158,11,0.10)",   amberBorder:  "rgba(245,158,11,0.25)",
  green:   "#34d399",  greenDim:   "rgba(16,185,129,0.10)",   greenBorder:  "rgba(16,185,129,0.25)",
  purple:  "#818cf8",  purpleDim:  "rgba(99,102,241,0.13)",   purpleBorder: "rgba(99,102,241,0.25)",
  orange:  "#fb923c",  orangeDim:  "rgba(249,115,22,0.10)",   orangeBorder: "rgba(249,115,22,0.25)",
};

const card = (ex={}) => ({
  background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, ...ex,
});

const mono = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

/* ── Sidebar ─────────────────────────────────────────────────── */
const NAV = [
  { Icon: LayoutDashboard, label: "Overview", active: true },
  { Icon: Users,           label: "Members"   },
  { Icon: FileText,        label: "Content"   },
  { Icon: BarChart2,       label: "Analytics" },
  { Icon: Zap,             label: "Automations" },
  { Icon: Settings,        label: "Settings"  },
  { Icon: Gift,            label: "Loyalty Programs" },
];
const LINKS = [
  { Icon: ExternalLink, label: "View Gym Page" },
  { Icon: Eye,          label: "Member View"   },
  { Icon: LogOut,       label: "Log Out", red: true },
];

function Sidebar() {
  return (
    <div style={{
      width: 210, minHeight: "100vh", flexShrink: 0,
      background: C.surface, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "16px 14px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Flame size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text, lineHeight: 1.25 }}>Foundry Gym</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>Gym Owner</div>
        </div>
      </div>
      <div style={{ padding: "13px 12px 8px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.dimmer, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Navigation</div>
        {NAV.map(item => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 8, marginBottom: 1, cursor: "pointer",
            background: item.active ? C.blueDim : "transparent",
            border: item.active ? `1px solid ${C.blueBorder}` : "1px solid transparent",
          }}>
            <item.Icon size={13} color={item.active ? C.blue : C.muted} strokeWidth={1.8} />
            <span style={{ fontSize: 12.5, fontWeight: item.active ? 700 : 400, color: item.active ? C.blue : C.muted }}>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: "10px 12px 18px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.dimmer, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Links</div>
        {LINKS.map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", borderRadius: 8, cursor: "pointer", marginBottom: 1 }}>
            <l.Icon size={12} color={l.red ? C.red : C.muted} strokeWidth={1.8} />
            <span style={{ fontSize: 12, color: l.red ? C.red : C.muted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── TopBar ──────────────────────────────────────────────────── */
function TopBar() {
  return (
    <div style={{
      height: 48, background: C.surface, borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", padding: "0 18px", gap: 10, flexShrink: 0,
    }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Thurs 9 Apr</span>
      <div style={{ position: "relative", flex: "0 0 220px" }}>
        <Search size={11} color={C.dim} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input placeholder="Search members..." style={{ width: "100%", boxSizing: "border-box", padding: "5px 9px 5px 27px", borderRadius: 7, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, outline: "none" }} />
      </div>
      <div style={{ flex: 1 }} />
      <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 7, background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        <QrCode size={11} /> Scan QR <ChevronDown size={9} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px", borderRadius: 7, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.blueDim, color: C.blue, fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>M</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Max</span>
        <ChevronDown size={9} color={C.dim} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: C.redDim, border: `1px solid ${C.redBorder}`, cursor: "pointer" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.redSolid }} />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.red }}>3 At Risk</span>
      </div>
    </div>
  );
}

/* ── Primitives ──────────────────────────────────────────────── */
function Avatar({ name = '?', size = 28 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},35%,10%)`, border: `1.5px solid hsl(${hue},35%,20%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 800, color: `hsl(${hue},55%,62%)`, ...mono,
    }}>{initials}</div>
  );
}

function AvatarStack({ names = [], size = 22 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {names.slice(0, 6).map((n, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -6, zIndex: 10 - i }}>
          <Avatar name={n} size={size} />
        </div>
      ))}
      {names.length > 6 && (
        <div style={{ width: size, height: size, borderRadius: '50%', background: C.card2, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: C.muted, marginLeft: -6, ...mono }}>
          +{names.length - 6}
        </div>
      )}
    </div>
  );
}

function Badge({ label, color = 'blue', dot, small }) {
  const m = {
    blue:   [C.blue,   C.blueDim,   C.blueBorder],
    red:    [C.red,    C.redDim,    C.redBorder],
    amber:  [C.amber,  C.amberDim,  C.amberBorder],
    green:  [C.green,  C.greenDim,  C.greenBorder],
    orange: [C.orange, C.orangeDim, C.orangeBorder],
    purple: [C.purple, C.purpleDim, C.purpleBorder],
  };
  const [fg, bg, bd] = m[color] || m.blue;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: small ? '2px 6px' : '2px 8px', borderRadius: 20,
      background: bg, border: `1px solid ${bd}`,
      fontSize: small ? 9.5 : 10.5, fontWeight: 700, color: fg,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: fg, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function ProgressBar({ value, color, height = 3 }) {
  return (
    <div style={{ height, background: C.dimmer, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

function Sparkline({ data = [], color = C.blue, height = 32, width = 80 }) {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 1 - ((v - min) / range) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastPt = pts.split(' ').pop().split(',');
  const ptsArr = pts.split(' ');
  const area = `M1,${height - 1} ${ptsArr.map(p => `L${p}`).join(' ')} L${width - 1},${height - 1} Z`;
  const gradId = `sp_${color.replace(/[^a-z0-9]/gi, '')}${Math.round(Math.random()*9999)}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 1 — Member Retention Status & Forecast
═══════════════════════════════════════════════════════════════ */
function RetentionStatusCard() {
  const tiers = [
    {
      id: 'slip-a', label: 'Slipping', range: '7–10 days', count: 12, total: 87,
      color: C.amber, dim: C.amberDim, border: C.amberBorder,
      mrrAtRisk: 420, recoveryRate: 88,
      members: ['Alex B','Sam C','Chris D','Jordan E','Taylor F','Riley G','Casey H','Pat L'],
      action: 'Bulk Message Nudge', Icon: MessageSquare,
    },
    {
      id: 'slip-b', label: 'Slipping', range: '11–13 days', count: 3, total: 87,
      color: C.orange, dim: C.orangeDim, border: C.orangeBorder,
      mrrAtRisk: 165, recoveryRate: 74,
      members: ['Morgan K','Drew L','Quinn M'],
      action: 'Bulk Message Nudge', Icon: MessageSquare,
    },
    {
      id: 'ghost', label: 'Ghosting', range: '14–20 days', count: 3, total: 87,
      color: C.red, dim: C.redDim, border: C.redBorder,
      mrrAtRisk: 210, recoveryRate: 61,
      members: ['Jamie N','Avery O','Blake P'],
      action: 'Schedule Individual Call', Icon: Phone,
    },
    {
      id: 'churn', label: 'Churn Risk', range: '21+ days', count: 1, total: 87,
      color: '#f43f5e', dim: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.25)',
      mrrAtRisk: 95, recoveryRate: 38,
      members: ['Skyler Q'],
      action: 'Run Automated Rule', Icon: PlayCircle,
    },
  ];

  const totalAtRisk = tiers.reduce((s, t) => s + t.count, 0);
  const totalMRR    = tiers.reduce((s, t) => s + t.mrrAtRisk, 0);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.redBorder}`, borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
      {/* Top summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.redDim, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={12} color={C.red} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
              Member Retention Status &amp; Forecast
            </div>
            <div style={{ fontSize: 10.5, color: C.muted, marginTop: 1 }}>
              Inactive threshold · 14+ days · Updated just now
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { label: 'Members flagged', value: totalAtRisk, color: C.red },
            { label: 'MRR at risk',     value: `$${totalMRR}/mo`, color: C.amber },
            { label: 'Avg recovery',    value: '73%', color: C.green },
          ].map((k, i) => (
            <div key={i} style={{ padding: '6px 12px', borderRadius: 7, background: C.card2, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 86 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: k.color, ...mono }}>{k.value}</span>
              <span style={{ fontSize: 9, color: C.muted, marginTop: 1, whiteSpace: 'nowrap' }}>{k.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        {['STAGE','MRR EXPOSURE','MEMBERS','RECOVERY EST.'].map((h, i) => (
          <div key={i} style={{ padding: '7px 16px', borderRight: i < 3 ? `1px solid ${C.border}` : 'none', fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{h}</div>
        ))}
      </div>

      {/* Tier columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
        {tiers.map((t, i) => (
          <div key={t.id} style={{ borderRight: i < 3 ? `1px solid ${C.border}` : 'none', borderLeft: `2px solid ${t.color}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(180deg,${t.dim} 0%,transparent 60%)` }} />
            <div style={{ position: 'relative', padding: '14px 16px' }}>

              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{t.label}</span>
                  <Badge label={`${t.count} members`} color={t.id === 'churn' ? 'red' : t.id === 'ghost' ? 'red' : 'amber'} small />
                </div>
                <span style={{ fontSize: 10, color: C.muted }}>{t.range}</span>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.dim, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>MRR Exposure</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: t.color, ...mono, letterSpacing: '-0.02em' }}>
                  ${t.mrrAtRisk}<span style={{ fontSize: 10, fontWeight: 500, color: C.muted }}>/mo</span>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: C.dim }}>Share of roster</span>
                  <span style={{ fontSize: 9, color: t.color, fontWeight: 700, ...mono }}>{((t.count / t.total) * 100).toFixed(0)}%</span>
                </div>
                <ProgressBar value={(t.count / t.total) * 100} color={t.color} height={3} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <AvatarStack names={t.members} size={22} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, color: C.dim, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Est. Recovery Rate</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={t.recoveryRate} color={C.green} height={3} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.green, ...mono }}>{t.recoveryRate}%</span>
                </div>
              </div>

              <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 11, background: C.surface, border: `1px solid ${C.border2}`, color: C.muted, whiteSpace: 'nowrap' }}>
                <t.Icon size={10} color={C.muted} />{t.action}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderTop: `1px solid ${C.border}`, background: C.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <TrendingDown size={11} color={C.red} />
          <span style={{ fontSize: 11, color: C.muted }}>
            Projected monthly churn:{' '}
            <span style={{ color: C.text, fontWeight: 700, ...mono }}>$890/mo</span>
            {' '}without intervention
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 11, color: C.muted }}>
            With outreach campaign:{' '}
            <span style={{ color: C.green, fontWeight: 700, ...mono }}>-$651/mo saved</span>
          </span>
          <div style={{ width: 1, height: 14, background: C.border }} />
          <span style={{ fontSize: 11, color: C.dim }}>Updated 2 min ago</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 2 — Engagement Metrics
═══════════════════════════════════════════════════════════════ */
function EngagementMetrics({ stats = {} }) {
  const msgData   = [42,38,55,48,62,58,71,65,83];
  const reengData = [14,18,15,22,20,26,24,29,29];
  const mrrData   = [710,740,760,800,820,870,900,920,940];

  const rows = [
    { value: stats.messagesSent ?? 83,       label: 'Messages Sent',      data: msgData,   color: C.text,  sparkColor: C.blue },
    { value: stats.reengaged ?? 29,          label: 'Members Re-engaged',  data: reengData, color: C.green, sparkColor: C.green, trend: '+5%', up: true, sub: 'vs last month' },
    { value: `$${stats.mrrRetained ?? 940}`, label: 'MRR Retained',        data: mrrData,   color: C.blue,  sparkColor: C.blue,  trend: '+$130', up: true, sub: 'vs last month' },
  ];

  return (
    <div style={{ ...card({ padding: 0 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 15px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: C.blueDim, border: `1px solid ${C.blueBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart2 size={11} color={C.blue} />
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Engagement Metrics</span>
        <span style={{ fontSize: 9.5, color: C.muted, marginLeft: 'auto' }}>This month</span>
      </div>

      <div style={{ padding: '13px 15px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(({ value, label, data, color, sparkColor, trend, up, sub }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: '0 0 auto', minWidth: 60 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1, ...mono }}>{value}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{label}</div>
              {trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
                  {up ? <ChevronUp size={9} color={C.green} /> : <ChevronDown size={9} color={C.red} />}
                  <span style={{ fontSize: 9.5, color: up ? C.green : C.red, fontWeight: 700, ...mono }}>{trend}</span>
                  {sub && <span style={{ fontSize: 9, color: C.muted }}> {sub}</span>}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <Sparkline data={data} color={sparkColor} height={34} width={110} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '9px 15px', borderTop: `1px solid ${C.border}` }}>
        <button style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: C.blue, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
          View full report <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 3 — Member Health Overview
═══════════════════════════════════════════════════════════════ */
function MemberHealth() {
  const [tab, setTab] = useState('All');
  const tabs = ['Premium', 'Basic', 'All'];
  const data = [
    { label: 'Highly Active (0–6d)', pct: 75, color: C.green },
    { label: 'Slipping (7–13d)',      pct: 10, color: C.amber },
    { label: 'At Risk (14d+)',         pct: 16, color: C.red   },
  ];
  const trendData = [1.2,1.4,1.3,1.5,1.4,1.6,1.35,1.35,1.353];

  return (
    <div style={{ ...card({ padding: 0 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: C.greenDim, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={11} color={C.green} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Member Health</span>
        </div>
        <div style={{ display: 'flex', gap: 1, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 6, padding: 2 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none', background: tab === t ? C.blue : 'transparent', color: tab === t ? '#fff' : C.muted, transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '13px 15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 88, height: 88, flexShrink: 0, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.map(d => ({ name: d.label, value: d.pct }))}
                  cx="50%" cy="50%" innerRadius={27} outerRadius={40}
                  startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1, ...mono }}>4</span>
              <span style={{ fontSize: 8, color: C.dim, marginTop: 1 }}>total</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {data.map(({ label, pct, color }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, color: C.muted, flex: 1 }}>{label}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text, minWidth: 28, textAlign: 'right', ...mono }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 10, color: C.muted }}>Avg. visit frequency</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text, ...mono }}>1.353 <span style={{ fontSize: 9, color: C.dim }}>visits/wk</span></span>
          </div>
          <Sparkline data={trendData} color={C.green} height={26} width={220} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 4 — Recent Live Activity
═══════════════════════════════════════════════════════════════ */
function RecentLiveActivity() {
  const [tab, setTab] = useState('Automated outreach');
  const tabs = ['Automated outreach', 'Member action', 'Staff action'];
  const evs = [
    { name: 'James Okafor', action: 'returned via automation', time: 'just now',  type: 'returned' },
    { name: 'Seffa Sharma', action: 'marked inactive',          time: '1 min ago', type: 'inactive' },
    { name: 'Mal Zhang',    action: 'message sent',             time: 'just now',  type: 'message'  },
  ];
  const ts = {
    returned: { color: C.green, Icon: RotateCcw },
    inactive: { color: C.amber, Icon: AlertTriangle },
    message:  { color: C.blue,  Icon: Send },
  };

  return (
    <div style={{ ...card({ padding: 0 }) }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 14px 10px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', color: C.dim, textTransform: 'uppercase' }}>Live Activity</span>
      </div>

      {/* Sub-tabs — matches Content Hub tab style */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 14px' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 8px', background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${C.blue}` : '2px solid transparent', color: tab === t ? C.text : C.muted, fontSize: 10, fontWeight: tab === t ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', marginBottom: -1, transition: 'color 0.15s' }}>
            {t}
          </button>
        ))}
      </div>

      {evs.map((ev, i) => {
        const s = ts[ev.type];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', borderBottom: i < evs.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <Avatar name={ev.name} size={27} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.35 }}>
                <span style={{ fontWeight: 700 }}>{ev.name}</span>
                <span style={{ color: ev.type === 'inactive' ? C.amber : C.muted }}> — {ev.action}</span>
              </div>
              <div style={{ fontSize: 9.5, color: C.dim, marginTop: 1 }}>{ev.time}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[MessageSquare, Phone, Eye].map((Ic, j) => (
                <div key={j} style={{ width: 22, height: 22, borderRadius: 6, background: C.card2, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Ic size={9} color={C.muted} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 5 — Priority To-Dos
═══════════════════════════════════════════════════════════════ */
function PriorityTodos() {
  const [filter, setFilter] = useState('High');
  const [bulkSel, setBulkSel] = useState(false);
  const filters = ['Critical', 'High', 'Medium'];

  const sections = [
    {
      title: 'At-Risk Calls',
      items: [{ name: 'Sarah J.', detail: 'returned to the gym', sub: 'Automated outreach sent · 3 visits this month', badge: '2 tasks', badgeColor: 'amber' }],
    },
    {
      title: 'Member Updates',
      items: [{ name: 'Priya Sharma', detail: 'rejoined the programme', sub: 'Referred by John Doe', badge: '3 sent', badgeColor: 'blue' }],
    },
    {
      title: 'Anniversaries',
      items: [{ name: 'Ann N', detail: 'Send anniversary kudos to members', sub: '', badge: null }],
    },
  ];

  return (
    <div style={{ ...card({ padding: 0 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: C.amberDim, border: `1px solid ${C.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={11} color={C.amber} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Priority To-Dos</span>
        </div>
        <button onClick={() => setBulkSel(!bulkSel)} style={{ padding: '5px 11px', borderRadius: 7, background: bulkSel ? C.blue : C.blueDim, border: `1px solid ${C.blueBorder}`, color: bulkSel ? '#fff' : C.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          Bulk Message
        </button>
      </div>

      {/* Filter pills — matches Content Hub tab strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderBottom: `1px solid ${C.border}` }}>
        {filters.map(f => {
          const fc = { Critical: C.red, High: C.amber, Medium: C.green }[f] || C.blue;
          const fdim = { Critical: C.redDim, High: C.amberDim, Medium: C.greenDim }[f];
          const fbd  = { Critical: C.redBorder, High: C.amberBorder, Medium: C.greenBorder }[f];
          return (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 10.5, fontWeight: 700, background: filter === f ? fdim : 'transparent', border: filter === f ? `1px solid ${fbd}` : '1px solid transparent', color: filter === f ? fc : C.muted }}>
              {f}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 9.5, color: C.dim }}>Effort</span>
      </div>

      {sections.map((sec, si) => (
        <div key={si}>
          <div style={{ padding: '5px 14px 3px', fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: '0.09em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.1)' }}>
            {sec.title}
          </div>
          {sec.items.map((item, ii) => (
            <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
              <Avatar name={item.name} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.35 }}>
                  {item.name}
                  <span style={{ color: C.muted, fontWeight: 400 }}> {item.detail}</span>
                </div>
                {item.sub && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{item.sub}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                {item.badge && <Badge label={item.badge} color={item.badgeColor} small />}
                <div style={{ width: 20, height: 20, borderRadius: 5, background: C.card2, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <MoreHorizontal size={9} color={C.muted} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 6 — Facility Snapshots
═══════════════════════════════════════════════════════════════ */
function FacilitySnapshots() {
  const occupancy = 72;
  return (
    <div style={{ ...card({ padding: 0 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: C.greenDim, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Dumbbell size={11} color={C.green} />
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Facility Snapshots</span>
      </div>

      <div style={{ padding: '13px 14px' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>Real-time class occupancy</span>
            <span style={{ fontSize: 11, color: C.green, fontWeight: 700, ...mono }}>{occupancy}%</span>
          </div>
          <div style={{ position: 'relative', height: 16, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', zIndex: 2 }}>
              <span style={{ fontSize: 8.5, color: C.dim }}>Low</span>
              <span style={{ fontSize: 8.5, color: C.dim }}>High</span>
            </div>
            <div style={{ width: `${occupancy}%`, height: '100%', background: C.green, opacity: 0.5, borderRadius: 4 }} />
          </div>
        </div>

        <div style={{ marginBottom: 13 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Upcoming Classes</div>
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '6px 11px', borderBottom: `1px solid ${C.border}` }}>
              {['CLASS','INSTRUCTOR','COVER'].map((h, i) => (
                <span key={i} style={{ fontSize: 8.5, fontWeight: 700, color: C.dim, letterSpacing: '0.08em', textAlign: i > 0 ? 'center' : 'left' }}>{h}</span>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '10px 11px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>Soccer — Day 1</div>
                <div style={{ fontSize: 9.5, color: C.muted }}>7:39 pm</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: C.text }}>Raela Smith</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: C.text }}>Ariys Sham</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 2 }}>Staff Presence</div>
            <div style={{ fontSize: 10, color: C.muted }}>3 active vs. 4 scheduled</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
            <span style={{ fontSize: 10.5, color: C.green, fontWeight: 700 }}>Active</span>
            </div>
            </div>
            </div>
            </div>
            );
            }

function BusinessSnapshot() {
  const kpis = [
    { Icon: Users,      label: 'Total Members',      value: '87',     unit: '',  delta: '+4',   deltaUp: true,  sub: 'vs last month', color: C.blue,   dim: C.blueDim,   bd: C.blueBorder,   spark: [78,80,81,82,82,83,84,85,87] },
    { Icon: DollarSign, label: 'Monthly MRR',         value: '$4,800', unit: '',  delta: '+$340',deltaUp: true,  sub: 'vs last month', color: C.green,  dim: C.greenDim,  bd: C.greenBorder,  spark: [4100,4200,4280,4350,4400,4500,4600,4700,4800] },
    { Icon: Target,     label: 'Retention Rate',      value: '78',     unit: '%', delta: '-2%',  deltaUp: false, sub: 'vs last month', color: C.amber,  dim: C.amberDim,  bd: C.amberBorder,  spark: [82,81,80,81,80,79,80,79,78] },
    { Icon: Zap,        label: 'Re-engagement Rate',  value: '35',     unit: '%', delta: '+5%',  deltaUp: true,  sub: 'vs last month', color: C.purple, dim: C.purpleDim, bd: C.purpleBorder, spark: [22,24,26,28,27,30,31,33,35] },
  ];

  return (
    <div style={{ ...card({ padding: 0 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: C.purpleDim, border: `1px solid ${C.purpleBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={11} color={C.purple} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Business Snapshot</span>
        </div>
        <span style={{ fontSize: 9.5, color: C.muted }}>30-day rolling</span>
      </div>

      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {kpis.map(({ Icon: Ic, label, value, unit, delta, deltaUp, sub, color, dim, bd, spark }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: C.card2, border: `1px solid ${C.border}` }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: dim, border: `1px solid ${bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ic size={12} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9.5, color: C.muted, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', lineHeight: 1, ...mono }}>
                {value}<span style={{ fontSize: 11, fontWeight: 500, color: C.muted }}>{unit}</span>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <Sparkline data={spark} color={color} height={28} width={60} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, minWidth: 44 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {deltaUp ? <ChevronUp size={10} color={C.green} /> : <ChevronDown size={10} color={C.red} />}
                <span style={{ fontSize: 10.5, fontWeight: 700, color: deltaUp ? C.green : C.red, ...mono }}>{delta}</span>
              </div>
              <span style={{ fontSize: 8.5, color: C.dim, marginTop: 1, textAlign: 'right' }}>{sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT — with Sidebar + TopBar shell
═══════════════════════════════════════════════════════════════ */
export default function TabOverview({
  totalMembers = 87, atRisk = 3, mrr = 4800,
  automationStats = { messagesSent: 83, reengaged: 29, mrrRetained: 940, reengagementRate: 35 },
}) {
  useEffect(() => {
    const id = 'tab-ov-anim';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ovr>*{animation:fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both}
        .ovr>*:nth-child(1){animation-delay:0ms}
        .ovr>*:nth-child(2){animation-delay:60ms}
        .ovr>*:nth-child(3){animation-delay:120ms}
      `;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: "'Inter','DM Sans',system-ui,sans-serif",
      fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: 'antialiased',
      overflowY: 'auto', padding: '16px 18px 40px',
    }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        Overview
        <span style={{ color: C.muted, fontWeight: 300, fontSize: 17 }}>/</span>
        <span style={{ color: C.purple }}>Dashboard</span>
      </div>

      <RetentionStatusCard />

      <div className="ovr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12, alignItems: 'start' }}>
        <EngagementMetrics stats={automationStats} />
        <MemberHealth />
        <RecentLiveActivity />
      </div>

      <div className="ovr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'start' }}>
        <PriorityTodos />
        <FacilitySnapshots />
        <BusinessSnapshot />
      </div>
    </div>
  );
}