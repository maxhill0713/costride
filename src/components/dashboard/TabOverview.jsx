import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, ArrowRight, Activity, TrendingUp, TrendingDown,
  RotateCcw, BarChart2, Star, MessageSquare, Phone, PlayCircle,
  Check, MoreHorizontal, Eye, Users, DollarSign,
  Zap, Target, ChevronUp, ChevronDown, Send,
  LayoutDashboard, FileText, Settings, Flame,
  ExternalLink, LogOut, Search, Plus, Bell, Clock, Trophy,
  RefreshCw, Shield, Award, Dumbbell, Info, QrCode, Gift,
} from 'lucide-react';

/* ─── Design Tokens — exact Content Hub palette ─────────────── */
const C = {
  bg:      '#0b0e17',
  surface: '#111520',
  card:    '#161b28',
  card2:   '#1a2030',
  border:  'rgba(255,255,255,0.06)',
  border2: 'rgba(255,255,255,0.10)',
  text:    '#e8ecf4',
  muted:   '#7c879e',
  dim:     '#3e4a60',
  dimmer:  '#252d3d',
  blue:    '#3b82f6',  blueDim:    'rgba(59,130,246,0.13)',   blueBorder:   'rgba(59,130,246,0.22)',
  red:     '#f87171',  redDim:     'rgba(239,68,68,0.10)',    redBorder:    'rgba(239,68,68,0.25)',
  redSolid:'#ef4444',
  amber:   '#fbbf24',  amberDim:   'rgba(245,158,11,0.10)',   amberBorder:  'rgba(245,158,11,0.25)',
  green:   '#34d399',  greenDim:   'rgba(16,185,129,0.10)',   greenBorder:  'rgba(16,185,129,0.25)',
  purple:  '#818cf8',  purpleDim:  'rgba(99,102,241,0.13)',   purpleBorder: 'rgba(99,102,241,0.25)',
  orange:  '#fb923c',  orangeDim:  'rgba(249,115,22,0.10)',   orangeBorder: 'rgba(249,115,22,0.25)',
};
const mono = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

/* ─── Sidebar ────────────────────────────────────────────────── */
const NAV = [
  { Icon: LayoutDashboard, label: 'Overview',        active: true },
  { Icon: Users,           label: 'Members'          },
  { Icon: FileText,        label: 'Content'          },
  { Icon: BarChart2,       label: 'Analytics'        },
  { Icon: Zap,             label: 'Automations'      },
  { Icon: RefreshCw,       label: 'Reengagers'       },
  { Icon: Settings,        label: 'Settings'         },
  { Icon: Gift,            label: 'Loyalty Programs' },
];
const LINKS = [
  { Icon: ExternalLink, label: 'View Gym Page' },
  { Icon: Eye,          label: 'Member View'   },
  { Icon: LogOut,       label: 'Log Out', red: true },
];

function Sidebar() {
  return (
    <div style={{
      width: 210, minHeight: '100vh', flexShrink: 0,
      background: C.surface, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '16px 14px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Flame size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text, lineHeight: 1.25 }}>Foundry Gym</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 1 }}>Gym Owner</div>
        </div>
      </div>
      <div style={{ padding: '13px 12px 8px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.dimmer, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Navigation</div>
        {NAV.map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, marginBottom: 1, cursor: 'pointer',
            background: item.active ? C.blueDim : 'transparent',
            border: item.active ? `1px solid ${C.blueBorder}` : '1px solid transparent',
          }}>
            <item.Icon size={13} color={item.active ? C.blue : C.muted} strokeWidth={1.8} />
            <span style={{ fontSize: 12.5, fontWeight: item.active ? 700 : 400, color: item.active ? C.blue : C.muted }}>{item.label}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '10px 12px 18px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.dimmer, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Links</div>
        {LINKS.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 8, cursor: 'pointer', marginBottom: 1 }}>
            <l.Icon size={12} color={l.red ? C.red : C.muted} strokeWidth={1.8} />
            <span style={{ fontSize: 12, color: l.red ? C.red : C.muted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TopBar ─────────────────────────────────────────────────── */
function TopBar() {
  return (
    <div style={{
      height: 48, background: C.surface, borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, flexShrink: 0,
    }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>Thursday 9 April</span>
      <div style={{ position: 'relative', flex: '0 0 220px' }}>
        <Search size={11} color={C.dim} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input placeholder="Search members..." style={{ width: '100%', boxSizing: 'border-box', padding: '5px 9px 5px 27px', borderRadius: 7, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, outline: 'none' }} />
      </div>
      <div style={{ flex: 1 }} />
      <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        <QrCode size={11} /> Scan QR <ChevronDown size={9} />
      </button>
      <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', borderRadius: 7, background: C.blue, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        <Plus size={11} /> New Post
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px', borderRadius: 7, background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.blueDim, color: C.blue, fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>M</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Max</span>
        <ChevronDown size={9} color={C.dim} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: C.redDim, border: `1px solid ${C.redBorder}`, cursor: 'pointer' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.redSolid }} />
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.red }}>3 At Risk</span>
      </div>
    </div>
  );
}

/* ─── Primitives ─────────────────────────────────────────────── */
function Avatar({ name = '?', size = 28 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},35%,10%)`, border: `1.5px solid hsl(${hue},35%,22%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 800, color: `hsl(${hue},55%,62%)`, ...mono,
    }}>{initials}</div>
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
      padding: small ? '2px 7px' : '3px 9px', borderRadius: 20,
      background: bg, border: `1px solid ${bd}`,
      fontSize: small ? 9.5 : 10.5, fontWeight: 700, color: fg, whiteSpace: 'nowrap', flexShrink: 0,
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
  const gradId = `sp${Math.round(Math.random() * 99999)}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} />
    </svg>
  );
}

/* ─── Gauge ──────────────────────────────────────────────────── */
function GaugeMeter({ value = 127, max = 200 }) {
  const W = 200, H = 110, cx = 100, cy = 102, Ro = 82, Ri = 58;
  const pt = (r, deg) => {
    const rad = deg * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  };
  const seg = (s, e) => {
    const [sox, soy] = pt(Ro, s), [eox, eoy] = pt(Ro, e);
    const [eix, eiy] = pt(Ri, e),  [six, siy] = pt(Ri, s);
    const lg = Math.abs(s - e) > 180 ? 1 : 0;
    return `M${sox.toFixed(2)},${soy.toFixed(2)} A${Ro},${Ro} 0 ${lg} 0 ${eox.toFixed(2)},${eoy.toFixed(2)} L${eix.toFixed(2)},${eiy.toFixed(2)} A${Ri},${Ri} 0 ${lg} 1 ${six.toFixed(2)},${siy.toFixed(2)} Z`;
  };
  const zones = [
    { s: 182, e: 140, color: '#ef4444' },
    { s: 140, e: 104, color: '#f97316' },
    { s: 104, e: 66,  color: '#eab308' },
    { s: 66,  e: -2,  color: '#22c55e' },
  ];
  const needleDeg = (1 - Math.min(value / max, 1)) * 180;
  const [nx, ny] = pt(Ro - 10, needleDeg);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
      <path d={seg(182, -2)} fill={C.dimmer} opacity={0.6} />
      {zones.map((z, i) => <path key={i} d={seg(z.s, z.e)} fill={z.color} opacity={0.9} />)}
      {[140, 104, 66].map(d => { const [mx, my] = pt((Ro + Ri) / 2, d); return <circle key={d} cx={mx.toFixed(2)} cy={my.toFixed(2)} r={2} fill={C.bg} />; })}
      <line x1={cx} y1={cy} x2={nx.toFixed(2)} y2={ny.toFixed(2)} stroke={C.text} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={7} fill={C.card} stroke={C.border2} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={3} fill={C.text} />
    </svg>
  );
}

/* ─── Shared card shell ──────────────────────────────────────── */
function Card({ children, style = {}, accent }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${accent || C.border}`, borderRadius: 10, overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 1 — Member Engagement Score
═══════════════════════════════════════════════════════════════ */
function MemberEngagementScore() {
  const healthBands = [
    { label: 'Highly Active', pct: 75, color: '#22c55e' },
    { label: 'Slipping',      pct: 11, color: '#f97316' },
    { label: 'At Risk',       pct: 14, color: '#ef4444' },
  ];
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 0' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Member Engagement Score</span>
        <Info size={12} color={C.dim} style={{ cursor: 'pointer', flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 0' }}>
        <GaugeMeter value={127} max={200} />
      </div>
      <div style={{ textAlign: 'center', padding: '0 14px 10px', marginTop: -4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: C.text, ...mono, letterSpacing: '-0.04em', lineHeight: 1 }}>127</span>
          <span style={{ fontSize: 13, color: C.muted }}>Members</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
          <Badge label="Active" color="green" dot small />
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ChevronUp size={10} color={C.green} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.green, ...mono }}>+5%</span>
          </div>
        </div>
        <Badge label="● Healthy" color="green" />
      </div>
      <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {healthBands.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: b.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: C.muted, flex: 1 }}>{b.label}</span>
            <div style={{ width: 72 }}><ProgressBar value={b.pct} color={b.color} height={3} /></div>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.text, minWidth: 28, textAlign: 'right', ...mono }}>{b.pct}%</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '10px 14px 14px' }}>
        {[
          { label: 'Retention', value: '78%', color: C.amber },
          { label: 'New/Mo',    value: '+12',  color: C.blue  },
        ].map((m, i) => (
          <div key={i} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 7, padding: '7px 10px' }}>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{m.label}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: m.color, ...mono }}>{m.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Mini Stat Card ─────────────────────────────────────────── */
function MiniStatCard({ label, value, line1, line2, color }) {
  return (
    <Card>
      <div style={{ padding: '14px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: C.muted, marginBottom: 12, lineHeight: 1.4 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 900, color, ...mono, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>{value}</div>
        {line1 && <div style={{ fontSize: 10.5, color: C.dim, marginBottom: 3 }}>{line1}</div>}
        {line2 && <div style={{ fontSize: 10.5, color: C.muted }}>{line2}</div>}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD — At-Risk Action Center
═══════════════════════════════════════════════════════════════ */
function AtRiskActionCenter() {
  const members = [
    { name: 'Alex Rivers',   lastVisited: '14 hrs ago',  risk: 'Low',    riskPct: 18, color: C.green },
    { name: 'Sarah Chen',    lastVisited: '3 days ago',  risk: 'Medium', riskPct: 52, color: C.amber },
    { name: 'Mike Thompson', lastVisited: '12 days ago', risk: 'High',   riskPct: 86, color: C.red   },
  ];
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.redDim, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={12} color={C.red} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>At-Risk Action Center</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>Prioritized At-Risk Profiles (Last 14 Days)</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: C.orangeDim, border: `1px solid ${C.orangeBorder}` }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.orange, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.orange }}>3 at risk</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: C.card2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: C.muted }}>Isoro</span>
            <ChevronDown size={9} color={C.dim} />
          </div>
        </div>
      </div>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.8fr', padding: '7px 16px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        {[{ h: 'MEMBER', sort: true }, { h: 'LAST VISITED', sort: true }, { h: 'RISK SCORE / BAND', sort: false }].map(({ h, sort }, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{h}</span>
            {sort && <ChevronDown size={8} color={C.dimmer} />}
          </div>
        ))}
      </div>
      {members.map((m, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.8fr', padding: '13px 16px', alignItems: 'center', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={m.name} size={30} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{m.name}</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>{m.lastVisited}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: m.color, background: `${m.color}1a`, border: `1px solid ${m.color}40`, borderRadius: 20, padding: '2px 10px', textAlign: 'center', flexShrink: 0 }}>{m.risk}</span>
            <div style={{ flex: 1, maxWidth: 100 }}>
              <div style={{ height: 5, background: C.dimmer, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${m.riskPct}%`, height: '100%', background: m.color, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD — Priority To-Dos
═══════════════════════════════════════════════════════════════ */
function PriorityTodos() {
  const [filter, setFilter] = useState('High');
  const [bulkSel, setBulkSel] = useState(false);
  const filters = ['Critical', 'High', 'Medium'];
  const filterColors = {
    Critical: { fg: C.red,   bg: C.redDim,   bd: C.redBorder   },
    High:     { fg: C.amber, bg: C.amberDim, bd: C.amberBorder },
    Medium:   { fg: C.green, bg: C.greenDim, bd: C.greenBorder },
  };
  const sections = [
    { title: 'At-Risk Calls',  items: [{ name: 'Sarah J.',     detail: 'returned to the gym',             sub: 'Automated outreach sent · 3 visits this month', badge: '2 tasks', badgeColor: 'amber' }] },
    { title: 'Member Updates', items: [{ name: 'Priya Sharma', detail: 'rejoined the programme',           sub: 'Referred by John Doe',                          badge: '3 sent',  badgeColor: 'blue'  }] },
    { title: 'Anniversaries',  items: [{ name: 'Ann N',        detail: 'Send anniversary kudos to members', sub: '',                                               badge: null }] },
  ];

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.amberDim, border: `1px solid ${C.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Star size={12} color={C.amber} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Priority To-Dos</span>
        </div>
        <button onClick={() => setBulkSel(!bulkSel)} style={{ padding: '5px 12px', borderRadius: 7, background: bulkSel ? C.blue : C.blueDim, border: `1px solid ${C.blueBorder}`, color: bulkSel ? '#fff' : C.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          Bulk Message
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginRight: 4 }}>Filter:</span>
        {filters.map(f => {
          const { fg, bg, bd } = filterColors[f];
          return (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 10.5, fontWeight: 700, background: filter === f ? bg : 'transparent', border: filter === f ? `1px solid ${bd}` : '1px solid transparent', color: filter === f ? fg : C.muted }}>
              {f}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 9.5, color: C.dim }}>Effort</span>
      </div>
      {sections.map((sec, si) => (
        <div key={si}>
          <div style={{ padding: '5px 14px 3px', fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: '0.09em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.12)' }}>{sec.title}</div>
          {sec.items.map((item, ii) => (
            <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
              <Avatar name={item.name} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>
                  {item.name}<span style={{ color: C.muted, fontWeight: 400 }}> {item.detail}</span>
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
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD — Top Performing Posts
═══════════════════════════════════════════════════════════════ */
function TopPerformingPosts() {
  const posts = [
    { title: 'HIIT Challenge V2',         tag: 'Engagement', count: 83, accent: C.blue,   bg: 'rgba(59,130,246,0.08)'  },
    { title: 'Nutrition Tip of the Week', tag: 'Engagement', count: 32, accent: C.green,  bg: 'rgba(16,185,129,0.08)'  },
    { title: 'Nutrition Tip of the We…',  tag: 'Engagement', count: 10, accent: C.orange, bg: 'rgba(249,115,22,0.08)'  },
  ];
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.purpleDim, border: `1px solid ${C.purpleBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={12} color={C.purple} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Top Performing Posts</span>
        </div>
        <MoreHorizontal size={13} color={C.dim} style={{ cursor: 'pointer' }} />
      </div>
      {posts.map((p, i) => (
        <div key={i} style={{ padding: '11px 14px', borderBottom: i < posts.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 34, borderRadius: 7, background: p.bg, border: `1px solid ${p.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BarChart2 size={14} color={p.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
            <Badge label={p.tag} color="purple" small />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.text, ...mono, flexShrink: 0 }}>{p.count}</span>
        </div>
      ))}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RIGHT SIDEBAR — Immediate Nudges
═══════════════════════════════════════════════════════════════ */
function ImmediateNudges() {
  const [sent, setSent] = useState({});
  const members = [
    { name: 'Sarah K.', riskColor: C.red, openRate: '94%', aiNote: 'Best time: now' },
    { name: 'John D.',  riskColor: C.red, openRate: '87%', aiNote: '2nd attempt'    },
    { name: 'Mike P.',  riskColor: C.red, openRate: '79%', aiNote: 'Urgent'         },
  ];
  return (
    <Card accent={C.redBorder}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: C.redDim, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={11} color={C.red} />
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Immediate Nudges</div>
              <div style={{ fontSize: 9.5, color: C.amber, fontWeight: 600, marginTop: 1 }}>Next 2 Hours</div>
            </div>
          </div>
          <MoreHorizontal size={13} color={C.dim} style={{ cursor: 'pointer' }} />
        </div>
        <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.5, marginBottom: 10 }}>
          Prioritised list. <span style={{ color: C.red, fontWeight: 600 }}>risk just crossed</span> a threshold.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { label: 'Avg. Open Rate', value: '87%', color: C.green },
            { label: 'Est. Recovery',  value: '73%', color: C.blue  },
          ].map((s, i) => (
            <div key={i} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 7, padding: '7px 10px' }}>
              <div style={{ fontSize: 8.5, color: C.muted, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color, ...mono }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
      {members.map((m, i) => (
        <div key={i} style={{ padding: '10px 14px', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.card2, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: C.muted, flexShrink: 0 }}>{i + 1}</div>
          <Avatar name={m.name} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text }}>{m.name}</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: m.riskColor, background: `${m.riskColor}1a`, border: `1px solid ${m.riskColor}40`, borderRadius: 20, padding: '1px 6px' }}>High</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 8.5, color: C.dim }}>Open: <span style={{ color: C.green, fontWeight: 700 }}>{m.openRate}</span></span>
              <span style={{ fontSize: 8.5, color: C.amber, fontWeight: 600 }}>{m.aiNote}</span>
            </div>
          </div>
          {/* Blue primary button — matches rest of app */}
          <button
            onClick={() => setSent(p => ({ ...p, [i]: !p[i] }))}
            style={{
              padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 10, fontWeight: 700, flexShrink: 0,
              background: sent[i] ? C.greenDim : C.blue,
              border: sent[i] ? `1px solid ${C.greenBorder}` : 'none',
              color: sent[i] ? C.green : '#fff',
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.18s ease',
            }}
          >
            {sent[i] ? <><Check size={9} /> Sent</> : <><Send size={9} /> Send</>}
          </button>
        </div>
      ))}
      <div style={{ padding: '9px 14px', background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={10} color={C.amber} />
          <span style={{ fontSize: 9.5, color: C.amber, fontWeight: 600 }}>Best results within 2 hrs</span>
        </div>
        <button style={{ fontSize: 10.5, fontWeight: 700, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
          View all <ArrowRight size={9} />
        </button>
      </div>
    </Card>
  );
}

/* ─── Last 7 Days Win-backs ──────────────────────────────────── */
function LastSevenDaysWinbacks() {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Last 7 Days Win-backs</span>
        <MoreHorizontal size={13} color={C.dim} style={{ cursor: 'pointer' }} />
      </div>
      <div style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.greenDim, border: `1px solid ${C.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={12} color={C.green} />
            </div>
            <span style={{ fontSize: 34, fontWeight: 900, color: C.text, ...mono, letterSpacing: '-0.04em', lineHeight: 1 }}>7</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.muted }}>Members Recovered</div>
        </div>
        <div style={{ flex: 1 }}>
          <Sparkline data={[1, 2, 2, 3, 3, 5, 7]} color={C.green} height={44} width={110} />
        </div>
      </div>
    </Card>
  );
}

/* ─── Live Pulse Feed ────────────────────────────────────────── */
function LivePulseFeed() {
  const events = [
    { name: 'James Olafor', action: 'returned via automation', time: '3h ago' },
    { name: 'Sarah Chen',   action: 'booked class via Nudge',  time: '5h ago' },
  ];
  return (
    <Card>
      <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Live Pulse Feed</span>
        </div>
        <MoreHorizontal size={13} color={C.dim} style={{ cursor: 'pointer' }} />
      </div>
      {events.map((ev, i) => (
        <div key={i} style={{ padding: '11px 14px', borderBottom: i < events.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={ev.name} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700 }}>{ev.name}</span>
              <span style={{ color: C.muted }}> – {ev.action}</span>
            </div>
            <div style={{ fontSize: 9.5, color: C.dim, marginTop: 2 }}>{ev.time}</div>
          </div>
        </div>
      ))}
    </Card>
  );
}

/* ─── Member Milestones ──────────────────────────────────────── */
function MemberMilestones() {
  const milestones = [
    { name: 'Sarah A.', text: '30 Days Complete!', Icon: Trophy, color: C.amber  },
    { name: 'Mike C.',  text: '30 Days Complete!', Icon: Trophy, color: C.amber  },
    { name: 'Mike C.',  text: '100 Workout Club!', Icon: Award,  color: C.purple },
  ];
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.amberDim, border: `1px solid ${C.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy size={12} color={C.amber} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Member Milestones</div>
            <div style={{ fontSize: 9.5, color: C.muted, marginTop: 1 }}>Celebrating this week</div>
          </div>
        </div>
        <MoreHorizontal size={13} color={C.dim} style={{ cursor: 'pointer' }} />
      </div>
      {milestones.map((m, i) => (
        <div key={i} style={{ padding: '10px 14px', borderBottom: i < milestones.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={m.name} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: C.text }}>
              <span style={{ fontWeight: 700 }}>{m.name}</span>
              <span style={{ color: C.muted }}> – {m.text}</span>
            </div>
          </div>
          <m.Icon size={13} color={m.color} style={{ flexShrink: 0 }} />
        </div>
      ))}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabOverview() {
  useEffect(() => {
    const id = 'tab-ov-anim';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .ovr > * { animation: fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .ovr > *:nth-child(1) { animation-delay: 0ms;   }
        .ovr > *:nth-child(2) { animation-delay: 55ms;  }
        .ovr > *:nth-child(3) { animation-delay: 110ms; }
        .ovr > *:nth-child(4) { animation-delay: 165ms; }
      `;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: "'Inter','DM Sans',system-ui,sans-serif",
      fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: 'antialiased',
    }}>
      <div style={{ padding: '16px 18px 40px' }}>

          {/* Page heading */}
          <div style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            Overview
            <span style={{ color: C.muted, fontWeight: 300, fontSize: 17 }}>/</span>
            <span style={{ color: C.purple }}>Dashboard</span>
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 14, alignItems: 'start' }}>
            <div>
              <div className="ovr" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                <MemberEngagementScore />
                <MiniStatCard label="New Member Churn Risk"    value="6"   line1="Members at Risk" line2="12% churn rate"  color={C.red}   />
                <MiniStatCard label="Re-engagement Conversion" value="7%"  line1="Win-backs"       line2="45% Conversion" color={C.green} />
                <MiniStatCard label="Attendance Consistency"   value="2.8" line1="Visits/Week Avg."                       color={C.blue}  />
              </div>
              <AtRiskActionCenter />
              <div className="ovr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <PriorityTodos />
                <TopPerformingPosts />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ImmediateNudges />
              <LastSevenDaysWinbacks />
              <LivePulseFeed />
              <MemberMilestones />
            </div>
          </div>
      </div>
    </div>
  );
}