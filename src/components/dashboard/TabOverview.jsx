import React, { useState, useEffect } from 'react';
import {
  ArrowRight, TrendingUp, TrendingDown,
  BarChart2, Star, MoreHorizontal, Eye, Users,
  Zap, ChevronUp, ChevronDown, Send,
  LayoutDashboard, FileText, Settings, Flame,
  ExternalLink, LogOut, Search, Plus, Bell, Clock, Trophy,
  RefreshCw, Shield, Award, Info, QrCode, Gift, Check,
} from 'lucide-react';

/* ─── Exact Content Hub tokens ───────────────────────────────── */
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
  blue:    '#3b82f6',  blueDim:    'rgba(59,130,246,0.13)',  blueBorder:   'rgba(59,130,246,0.22)',
  red:     '#f87171',  redDim:     'rgba(239,68,68,0.10)',   redBorder:    'rgba(239,68,68,0.25)',
  redSolid:'#ef4444',
  amber:   '#fbbf24',  amberDim:   'rgba(245,158,11,0.10)',  amberBorder:  'rgba(245,158,11,0.25)',
  green:   '#34d399',  greenDim:   'rgba(16,185,129,0.10)',  greenBorder:  'rgba(16,185,129,0.25)',
  purple:  '#818cf8',  purpleDim:  'rgba(99,102,241,0.13)',  purpleBorder: 'rgba(99,102,241,0.25)',
  orange:  '#fb923c',  orangeDim:  'rgba(249,115,22,0.10)',  orangeBorder: 'rgba(249,115,22,0.25)',
};
const mono = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
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
    <div style={{ width: 210, minHeight: '100vh', flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
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
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, marginBottom: 1, cursor: 'pointer', background: item.active ? C.blueDim : 'transparent', border: item.active ? `1px solid ${C.blueBorder}` : '1px solid transparent' }}>
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

/* ═══════════════════════════════════════════════════════════════
   TOPBAR
═══════════════════════════════════════════════════════════════ */
function TopBar() {
  return (
    <div style={{ height: 48, background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, flexShrink: 0 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>Thursday 9 April</span>
      <div style={{ position: 'relative', flex: '0 0 220px' }}>
        <Search size={11} color={C.dim} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input placeholder="Search members..." style={{ width: '100%', boxSizing: 'border-box', padding: '5px 9px 5px 27px', borderRadius: 7, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 12, outline: 'none' }} />
      </div>
      <div style={{ flex: 1 }} />
      <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, background: C.card, border: `1px solid ${C.border2}`, color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        <QrCode size={11} /> Seen GR
      </button>
      <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', borderRadius: 7, background: C.blue, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
        <Plus size={11} /> New Post
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px', borderRadius: 7, background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.blueDim, color: C.blue, fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>M</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Max</span>
        <ChevronDown size={9} color={C.dim} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVES
═══════════════════════════════════════════════════════════════ */
function Avatar({ name = '?', size = 28 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `hsl(${hue},35%,10%)`, border: `1.5px solid hsl(${hue},35%,22%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 800, color: `hsl(${hue},55%,62%)`, ...mono }}>
      {initials}
    </div>
  );
}

function Badge({ label, color = 'blue', dot, small }) {
  const m = { blue: [C.blue, C.blueDim, C.blueBorder], red: [C.red, C.redDim, C.redBorder], amber: [C.amber, C.amberDim, C.amberBorder], green: [C.green, C.greenDim, C.greenBorder], orange: [C.orange, C.orangeDim, C.orangeBorder], purple: [C.purple, C.purpleDim, C.purpleBorder] };
  const [fg, bg, bd] = m[color] || m.blue;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: small ? '2px 7px' : '3px 9px', borderRadius: 20, background: bg, border: `1px solid ${bd}`, fontSize: small ? 9.5 : 10.5, fontWeight: 700, color: fg, whiteSpace: 'nowrap', flexShrink: 0 }}>
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
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => { const x = (i / (data.length - 1)) * (width - 2) + 1; const y = height - 1 - ((v - min) / range) * (height - 4); return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(' ');
  const lastPt = pts.split(' ').pop().split(',');
  const area = `M1,${height - 1} ${pts.split(' ').map(p => `L${p}`).join(' ')} L${width - 1},${height - 1} Z`;
  const gid = `sg${Math.round(Math.random() * 99999)}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.18" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DONUT RING — replaces gauge, shows health split cleanly
═══════════════════════════════════════════════════════════════ */
function DonutRing({ segments, size = 88, strokeWidth = 11 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;

  let offset = 0; // start from top (rotate -90deg via transform)
  const paths = segments.map((seg, i) => {
    const dash = (seg.pct / 100) * circ;
    const gap  = circ - dash;
    const el = (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash.toFixed(2)} ${gap.toFixed(2)}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.dimmer} strokeWidth={strokeWidth} />
      {paths}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD — Member Engagement Score  (donut version)
═══════════════════════════════════════════════════════════════ */
function MemberEngagementScore() {
  const bands = [
    { label: 'Highly Active', pct: 75, color: '#22c55e' },
    { label: 'Slipping',      pct: 11, color: '#f97316' },
    { label: 'At Risk',       pct: 14, color: '#ef4444' },
  ];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text }}>Member Engagement Score</span>
        <Info size={11} color={C.dim} style={{ cursor: 'pointer', flexShrink: 0 }} />
      </div>

      {/* Donut + big number side by side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Donut with centre label */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <DonutRing segments={bands} size={92} strokeWidth={12} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1, ...mono }}>127</span>
            <span style={{ fontSize: 8.5, color: C.muted, marginTop: 2 }}>members</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {bands.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: b.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10.5, color: C.muted, flex: 1 }}>{b.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text, ...mono }}>{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Badge label="Active" color="green" dot small />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ChevronUp size={10} color={C.green} />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: C.green, ...mono }}>+5%</span>
        </div>
        <div style={{ flex: 1 }} />
        <Badge label="● Healthy" color="green" small />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI CARD — sized exactly to match screenshot
   label → big number → sub-label → detail  (tight, no extras)
═══════════════════════════════════════════════════════════════ */
function KpiCard({ label, value, subLabel, detail, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '13px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Title */}
      <div style={{ fontSize: 10.5, fontWeight: 600, color: C.muted, lineHeight: 1.35, marginBottom: 10 }}>{label}</div>

      {/* Big value */}
      <div style={{ fontSize: 34, fontWeight: 900, color, ...mono, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>

      {/* Sub lines */}
      <div style={{ marginTop: 10 }}>
        {subLabel && <div style={{ fontSize: 10.5, color: C.dim }}>{subLabel}</div>}
        {detail   && <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>{detail}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD — At-Risk Action Center
═══════════════════════════════════════════════════════════════ */
function AtRiskActionCenter() {
  const members = [
    { name: 'Alex Rivers',   lastVisited: '14 hrs ago',  risk: 'Low',    pct: 18, color: C.green },
    { name: 'Sarah Chen',    lastVisited: '3 days ago',  risk: 'Medium', pct: 52, color: C.amber },
    { name: 'Mike Thompson', lastVisited: '12 days ago', risk: 'High',   pct: 86, color: C.red   },
  ];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
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
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.orange }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: C.orange }}>3 at risk</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: C.card2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: C.muted }}>Isoro</span>
            <ChevronDown size={9} color={C.dim} />
          </div>
        </div>
      </div>

      {/* Column headers */}
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
            <span style={{ fontSize: 10.5, fontWeight: 700, color: m.color, background: `${m.color}1a`, border: `1px solid ${m.color}40`, borderRadius: 20, padding: '2px 10px', flexShrink: 0 }}>{m.risk}</span>
            <div style={{ flex: 1, maxWidth: 100 }}>
              <div style={{ height: 5, background: C.dimmer, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: 3 }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD — Priority To-Dos
═══════════════════════════════════════════════════════════════ */
function PriorityTodos() {
  const [filter, setFilter] = useState('High');
  const [bulkOn, setBulkOn] = useState(false);
  const filters = ['Critical', 'High', 'Medium'];
  const fColors = {
    Critical: { fg: C.red,   bg: C.redDim,   bd: C.redBorder   },
    High:     { fg: C.amber, bg: C.amberDim, bd: C.amberBorder },
    Medium:   { fg: C.green, bg: C.greenDim, bd: C.greenBorder },
  };
  const sections = [
    { title: 'At-Risk Calls',  items: [{ name: 'Sarah J.',     detail: 'returned to the gym',              sub: 'Automated outreach sent · 3 visits this month', badge: '2 tasks', bc: 'amber' }] },
    { title: 'Member Updates', items: [{ name: 'Priya Sharma', detail: 'rejoined the programme',            sub: 'Referred by John Doe',                          badge: '3 sent',  bc: 'blue'  }] },
    { title: 'Anniversaries',  items: [{ name: 'Ann N',        detail: 'Send anniversary kudos to members', sub: '',                                               badge: null }] },
  ];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.amberDim, border: `1px solid ${C.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Star size={12} color={C.amber} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Priority To-Dos</span>
        </div>
        <button onClick={() => setBulkOn(!bulkOn)} style={{ padding: '5px 12px', borderRadius: 7, background: bulkOn ? C.blue : C.blueDim, border: `1px solid ${C.blueBorder}`, color: bulkOn ? '#fff' : C.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          Bulk Message
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '7px 14px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 10.5, color: C.muted, marginRight: 4 }}>Filter:</span>
        {filters.map(f => {
          const { fg, bg, bd } = fColors[f];
          return <button key={f} onClick={() => setFilter(f)} style={{ padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 10.5, fontWeight: 700, background: filter === f ? bg : 'transparent', border: filter === f ? `1px solid ${bd}` : '1px solid transparent', color: filter === f ? fg : C.muted }}>{f}</button>;
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
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{item.name}<span style={{ color: C.muted, fontWeight: 400 }}> {item.detail}</span></div>
                {item.sub && <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{item.sub}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                {item.badge && <Badge label={item.badge} color={item.bc} small />}
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
   CARD — Top Performing Posts
═══════════════════════════════════════════════════════════════ */
function TopPerformingPosts() {
  const posts = [
    { title: 'HIIT Challenge V2',         tag: 'Engagement', count: 83, accent: C.blue,   bg: 'rgba(59,130,246,0.08)'  },
    { title: 'Nutrition Tip of the Week', tag: 'Engagement', count: 32, accent: C.green,  bg: 'rgba(16,185,129,0.08)'  },
    { title: 'Nutrition Tip of the We…',  tag: 'Engagement', count: 10, accent: C.orange, bg: 'rgba(249,115,22,0.08)'  },
  ];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
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
          <div style={{ width: 40, height: 32, borderRadius: 7, background: p.bg, border: `1px solid ${p.accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BarChart2 size={13} color={p.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
            <Badge label={p.tag} color="purple" small />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.text, ...mono, flexShrink: 0 }}>{p.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RIGHT — Immediate Nudges  (clean, no extra stats)
═══════════════════════════════════════════════════════════════ */
function ImmediateNudges() {
  const [sent, setSent] = useState({});
  const members = [
    { name: 'Sarah K.', sub: 'Risk just crossed' },
    { name: 'John D.',  sub: 'Risk just crossed' },
    { name: 'Mike P.',  sub: 'Risk just crossed' },
  ];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.redBorder}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: C.redDim, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={11} color={C.red} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Immediate Nudges <span style={{ fontSize: 9.5, color: C.muted, fontWeight: 400 }}>(Next 2 Hours)</span></div>
              <div style={{ fontSize: 9.5, color: C.amber, fontWeight: 600, marginTop: 1 }}>Prioritised list. risk just crossed a threshold.</div>
            </div>
          </div>
          <MoreHorizontal size={13} color={C.dim} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {members.map((m, i) => (
        <div key={i} style={{ padding: '10px 14px', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: C.card2, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 800, color: C.muted, flexShrink: 0 }}>{i + 1}</div>
          <Avatar name={m.name} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.text }}>{m.name}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{m.sub}</div>
          </div>
          <button
            onClick={() => setSent(p => ({ ...p, [i]: !p[i] }))}
            style={{ padding: '5px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 10.5, fontWeight: 700, flexShrink: 0, background: sent[i] ? C.greenDim : C.blue, border: sent[i] ? `1px solid ${C.greenBorder}` : 'none', color: sent[i] ? C.green : '#fff', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.18s' }}
          >
            {sent[i] ? <><Check size={9} /> Sent</> : 'Click to Send'}
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
    </div>
  );
}

/* ─── Last 7 Days Win-backs ──────────────────────────────────── */
function LastSevenDaysWinbacks() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
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
      </div>
      );
      }
}

/* ═══════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════ */
export default function TabOverview() {
  useEffect(() => {
    const id = 'tov-anim';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .ovr>*{animation:fadeUp .35s cubic-bezier(.16,1,.3,1) both}
        .ovr>*:nth-child(1){animation-delay:0ms}
        .ovr>*:nth-child(2){animation-delay:50ms}
        .ovr>*:nth-child(3){animation-delay:100ms}
        .ovr>*:nth-child(4){animation-delay:150ms}
      `;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter','DM Sans',system-ui,sans-serif", fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: 'antialiased' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 40px' }}>

          {/* Page heading */}
          <div style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            Overview
            <span style={{ color: C.muted, fontWeight: 300, fontSize: 17 }}>/</span>
            <span style={{ color: C.purple }}>Dashboard</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 14, alignItems: 'start' }}>

            {/* Left column */}
            <div>
              {/* Row 1: donut engagement card + 3 KPI cards, all same height */}
              <div className="ovr" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 10, marginBottom: 12, alignItems: 'stretch' }}>
                <MemberEngagementScore />
                <KpiCard
                  label="New Member Churn Risk"
                  value="6"
                  subLabel="Members at Risk"
                  detail="12% churn rate"
                  color={C.red}
                />
                <KpiCard
                  label="Re-engagement Conversion"
                  value="7%"
                  subLabel="Win-backs"
                  detail="45% Conversion"
                  color={C.green}
                />
                <KpiCard
                  label="Attendance Consistency"
                  value="2.8"
                  subLabel="Visits/Week Avg."
                  color={C.blue}
                />
              </div>

              {/* Row 2: At-Risk Action Center */}
              <AtRiskActionCenter />

              {/* Row 3: To-Dos + Posts */}
              <div className="ovr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <PriorityTodos />
                <TopPerformingPosts />
              </div>
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ImmediateNudges />
              <LastSevenDaysWinbacks />
              <LivePulseFeed />
              <MemberMilestones />
            </div>
          </div>
    </div>
  );
}