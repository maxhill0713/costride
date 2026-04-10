import React, { useState, useEffect } from 'react';
import {
  ArrowRight, TrendingUp,
  BarChart2, Star, MoreHorizontal,
  ChevronUp, ChevronDown,
  Bell, Clock, Trophy,
  RefreshCw, Shield, Award, Info, Check,
} from 'lucide-react';

/* ─── Design tokens ──────────────────────────────────────────── */
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
  amber:   '#fbbf24',  amberDim:   'rgba(245,158,11,0.10)',  amberBorder:  'rgba(245,158,11,0.25)',
  green:   '#34d399',  greenDim:   'rgba(16,185,129,0.10)',  greenBorder:  'rgba(16,185,129,0.25)',
  purple:  '#818cf8',  purpleDim:  'rgba(99,102,241,0.13)',  purpleBorder: 'rgba(99,102,241,0.25)',
  orange:  '#fb923c',  orangeDim:  'rgba(249,115,22,0.10)',  orangeBorder: 'rgba(249,115,22,0.25)',
};
const mono = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

/* ─── Primitives ─────────────────────────────────────────────── */
function Avatar({ name = '?', size = 28, src }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  if (src) {
    return (
      <img src={src} alt={name} style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        objectFit: 'cover', border: `1.5px solid rgba(255,255,255,0.12)`,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},35%,10%)`, border: `1.5px solid hsl(${hue},35%,22%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 800, color: `hsl(${hue},55%,62%)`, ...mono,
    }}>
      {initials}
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
      padding: small ? '2px 7px' : '3px 9px', borderRadius: 20,
      background: bg, border: `1px solid ${bd}`,
      fontSize: small ? 9.5 : 10.5, fontWeight: 700, color: fg,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: fg, flexShrink: 0 }} />}
      {label}
    </span>
  );
}

let _sparkId = 0;
function Sparkline({ data = [], color = C.blue, height = 32, width = 80 }) {
  const gid = React.useRef(`sg${++_sparkId}`).current;
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 1 - ((v - min) / range) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastPt = pts.split(' ').pop().split(',');
  const area = `M1,${height - 1} ${pts.split(' ').map(p => `L${p}`).join(' ')} L${width - 1},${height - 1} Z`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} />
    </svg>
  );
}

/* ─── Donut ring ─────────────────────────────────────────────── */
function DonutRing({ segments, size = 88, strokeWidth = 11 }) {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx   = size / 2;
  const cy   = size / 2;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const dash = (seg.pct / 100) * circ;
    const el = (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash.toFixed(2)} ${(circ - dash).toFixed(2)}`}
        strokeDashoffset={circ - offset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += dash;
    return el;
  });

  return (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.dimmer} strokeWidth={strokeWidth} />
      {arcs}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD — Member Engagement Score
═══════════════════════════════════════════════════════════════ */
function MemberEngagementScore() {
  const bands = [
    { label: 'Highly Active', pct: 75, color: '#22c55e' },
    { label: 'Slipping',      pct: 11, color: '#f97316' },
    { label: 'At Risk',       pct: 14, color: '#ef4444' },
  ];

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '13px 14px',
      display: 'flex', flexDirection: 'column', gap: 11,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text }}>Member Engagement Score</span>
        <Info size={11} color={C.dim} style={{ cursor: 'pointer', flexShrink: 0 }} />
      </div>

      {/* Donut + legend row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Donut with centre stat */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <DonutRing segments={bands} size={90} strokeWidth={12} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 19, fontWeight: 900, color: C.text, lineHeight: 1, ...mono }}>127</span>
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

      {/* Status row */}
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
   KPI CARD — compact height, tight spacing
═══════════════════════════════════════════════════════════════ */
function KpiCard({ label, value, subLabel, detail, color }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: '11px 13px',
    }}>
      {/* Label */}
      <div style={{
        fontSize: 10, fontWeight: 600, color: C.muted,
        lineHeight: 1.3, marginBottom: 8,
      }}>
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize: 28, fontWeight: 900, color,
        ...mono, letterSpacing: '-0.03em', lineHeight: 1,
        marginBottom: 8,
      }}>
        {value}
      </div>

      {/* Sub-lines — no extra margin between them */}
      {subLabel && (
        <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.4 }}>{subLabel}</div>
      )}
      {detail && (
        <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.4, marginTop: 1 }}>{detail}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD — At-Risk Action Center
═══════════════════════════════════════════════════════════════ */
function AtRiskActionCenter() {
  const members = [
    { name: 'Alex Rivers',   lastVisited: '14 hrs ago',  risk: 'Low',    pct: 18, color: C.green, src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
    { name: 'Sarah Chen',    lastVisited: '3 days ago',  risk: 'Medium', pct: 52, color: C.amber, src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
    { name: 'Mike Thompson', lastVisited: '12 days ago', risk: 'High',   pct: 86, color: C.red,   src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
  ];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
      {/* Header */}
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

      {/* Rows */}
      {members.map((m, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.8fr', padding: '13px 16px', alignItems: 'center', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={m.name} src={m.src} size={30} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{m.name}</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>{m.lastVisited}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: m.color, background: `${m.color}1a`, border: `1px solid ${m.color}40`, borderRadius: 20, padding: '2px 10px', flexShrink: 0 }}>
              {m.risk}
            </span>
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
    {
      title: 'At-Risk Calls',
      items: [{
        name: 'Sarah J.', detail: 'returned to the gym',
        sub: 'Automated outreach sent · 3 visits this month',
        badge: '2 tasks', bc: 'amber',
        src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
      }],
    },
    {
      title: 'Member Updates',
      items: [{
        name: 'Priya Sharma', detail: 'rejoined the programme',
        sub: 'Referred by John Doe',
        badge: '3 sent', bc: 'blue',
        src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face',
      }],
    },
    {
      title: 'Anniversaries',
      items: [{
        name: 'Ann N', detail: 'Send anniversary kudos to members',
        sub: '', badge: null,
        src: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&h=80&fit=crop&crop=face',
      }],
    },
  ];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: C.amberDim, border: `1px solid ${C.amberBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Star size={12} color={C.amber} />
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Priority To-Dos</span>
        </div>
        <button
          onClick={() => setBulkOn(!bulkOn)}
          style={{ padding: '5px 12px', borderRadius: 7, background: bulkOn ? C.blue : C.blueDim, border: `1px solid ${C.blueBorder}`, color: bulkOn ? '#fff' : C.blue, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          Bulk Message
        </button>
      </div>

      {/* Filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '7px 14px', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 10.5, color: C.muted, marginRight: 4 }}>Filter:</span>
        {filters.map(f => {
          const { fg, bg, bd } = fColors[f];
          return (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 10.5, fontWeight: 700, background: filter === f ? bg : 'transparent', border: filter === f ? `1px solid ${bd}` : '1px solid transparent', color: filter === f ? fg : C.muted }}>
              {f}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 9.5, color: C.dim }}>Effort</span>
      </div>

      {/* Sections */}
      {sections.map((sec, si) => (
        <div key={si}>
          <div style={{ padding: '5px 14px 3px', fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: '0.09em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.12)' }}>
            {sec.title}
          </div>
          {sec.items.map((item, ii) => (
            <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
              <Avatar name={item.name} src={item.src} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>
                  {item.name}
                  <span style={{ color: C.muted, fontWeight: 400 }}> {item.detail}</span>
                </div>
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
   RIGHT — Immediate Nudges
═══════════════════════════════════════════════════════════════ */
function ImmediateNudges() {
  const [sent, setSent] = useState({});

  const members = [
    { name: 'Sarah K.', sub: 'Risk just crossed', src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face' },
    { name: 'John D.',  sub: 'Risk just crossed', src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face' },
    { name: 'Mike P.',  sub: 'Risk just crossed', src: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face' },
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
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                Immediate Nudges{' '}
                <span style={{ fontSize: 9.5, color: C.muted, fontWeight: 400 }}>(Next 2 Hours)</span>
              </div>
              <div style={{ fontSize: 9.5, color: C.amber, fontWeight: 600, marginTop: 1 }}>
                Prioritised list. risk just crossed a threshold.
              </div>
            </div>
          </div>
          <MoreHorizontal size={13} color={C.dim} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {members.map((m, i) => (
        <div key={i} style={{ padding: '10px 14px', borderBottom: i < members.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: C.card2, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, fontWeight: 800, color: C.muted, flexShrink: 0 }}>
            {i + 1}
          </div>
          <Avatar name={m.name} src={m.src} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.text }}>{m.name}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{m.sub}</div>
          </div>
          <button
            onClick={() => setSent(p => ({ ...p, [i]: !p[i] }))}
            style={{
              padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
              fontSize: 10.5, fontWeight: 700, flexShrink: 0,
              background: sent[i] ? C.greenDim : C.blue,
              border: sent[i] ? `1px solid ${C.greenBorder}` : 'none',
              color: sent[i] ? C.green : '#fff',
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.18s',
            }}
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

/* ─── Live Pulse Feed ────────────────────────────────────────── */
function LivePulseFeed() {
  const events = [
    { name: 'James Olafor', action: 'returned via automation', time: '3h ago', src: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face' },
    { name: 'Sarah Chen',   action: 'booked class via Nudge',  time: '5h ago', src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
  ];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>Live Pulse Feed</span>
        </div>
        <MoreHorizontal size={13} color={C.dim} style={{ cursor: 'pointer' }} />
      </div>
      {events.map((ev, i) => (
        <div key={i} style={{ padding: '11px 14px', borderBottom: i < events.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={ev.name} src={ev.src} size={27} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 700 }}>{ev.name}</span>
              <span style={{ color: C.muted }}> – {ev.action}</span>
            </div>
            <div style={{ fontSize: 9.5, color: C.dim, marginTop: 2 }}>{ev.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Member Milestones ──────────────────────────────────────── */
function MemberMilestones() {
  const list = [
    { name: 'Sarah A.', text: '30 Days Complete!', Icon: Trophy, color: C.amber,  src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop&crop=face' },
    { name: 'Mike C.',  text: '30 Days Complete!', Icon: Trophy, color: C.amber,  src: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=80&h=80&fit=crop&crop=face' },
    { name: 'Chris W.', text: '100 Workout Club!', Icon: Award,  color: C.purple, src: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=80&h=80&fit=crop&crop=face' },
  ];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
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
      {list.map((m, i) => (
        <div key={i} style={{ padding: '10px 14px', borderBottom: i < list.length - 1 ? `1px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={m.name} src={m.src} size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: C.text }}>
              <span style={{ fontWeight: 700 }}>{m.name}</span>
              <span style={{ color: C.muted }}> – {m.text}</span>
            </div>
          </div>
          <m.Icon size={13} color={m.color} style={{ flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT — content only, no sidebar or topbar
═══════════════════════════════════════════════════════════════ */
export default function TabOverview() {
  useEffect(() => {
    const id = 'tov-anim';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .ovr > * { animation: fadeUp .35s cubic-bezier(.16,1,.3,1) both; }
        .ovr > *:nth-child(1) { animation-delay: 0ms;   }
        .ovr > *:nth-child(2) { animation-delay: 50ms;  }
        .ovr > *:nth-child(3) { animation-delay: 100ms; }
        .ovr > *:nth-child(4) { animation-delay: 150ms; }
      `;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div style={{
      color: C.text,
      fontFamily: "'Inter','DM Sans',system-ui,sans-serif",
      fontSize: 13, lineHeight: 1.5, WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Page heading */}
      <div style={{ fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
        Overview
        <span style={{ color: C.muted, fontWeight: 300, fontSize: 17 }}>/</span>
        <span style={{ color: C.purple }}>Dashboard</span>
      </div>

      {/* Two-column layout: main content | right sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 14, alignItems: 'start' }}>

        {/* Left column */}
        <div>
          {/* Row 1 — donut card + 3 compact KPI cards */}
          {/* alignItems: 'start' keeps KPI cards at natural height */}
          <div className="ovr" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 10, marginBottom: 12, alignItems: 'start' }}>
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
              subLabel="Visits / Week Avg."
              color={C.blue}
            />
          </div>

          {/* Row 2 — At-Risk Action Center */}
          <AtRiskActionCenter />

          {/* Row 3 — Priority To-Dos + Top Performing Posts */}
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