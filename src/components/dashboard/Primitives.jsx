/**
 * Primitives.jsx — Shared UI Components
 * ═══════════════════════════════════════════════════════════════
 *
 * Every reusable component lives here. Tabs import from this file
 * instead of defining their own Card, StatNudge, Badge, etc.
 *
 * RULES:
 *   1. No component may accept a `style` prop that overrides tokens.
 *   2. Color is always from DS — never inline hex.
 *   3. Every interactive element has hover + focus states.
 *   4. All metrics use tabular-nums.
 */

import React, { useState } from 'react';
import DS, { CARD, CARD_HOVER, TYPE } from './DesignSystem';
import {
  ChevronRight, ArrowUpRight, TrendingDown, TrendingUp,
  Minus, CheckCircle, AlertTriangle, MoreHorizontal,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════
   CARD — The fundamental container
══════════════════════════════════════════════════════════════════ */
export function Card({
  children,
  variant = 'default',
  accentColor,
  padding,
  onClick,
  className,
}) {
  const [hov, setHov] = useState(false);
  const isInteractive = !!onClick;

  const bg  = variant === 'raised' ? DS.surfaceRaised : DS.surface;
  const brd = (hov && isInteractive) ? DS.borderMid : DS.border;

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => isInteractive && setHov(true)}
      onMouseLeave={() => isInteractive && setHov(false)}
      style={{
        background:   bg,
        border:       `1px solid ${brd}`,
        borderRadius: DS.r4,
        boxShadow:    `${DS.shadowInset}, ${hov && isInteractive ? DS.shadowRaised : DS.shadowCard}`,
        overflow:     'hidden',
        position:     'relative',
        cursor:       isInteractive ? 'pointer' : 'default',
        transition:   DS.fast,
        padding:      padding ?? undefined,
      }}
    >
      {accentColor && (
        <div style={{
          position:   'absolute',
          top: 0, left: 0, right: 0,
          height:     1.5,
          background: `linear-gradient(90deg, ${accentColor}50 0%, ${accentColor}14 60%, transparent 100%)`,
          pointerEvents: 'none',
        }} />
      )}
      {children}
    </div>
  );
}

/* ── Card sub-sections ────────────────────────────────────────── */
export function CardBody({ children, style = {} }) {
  return <div style={{ padding: DS.sp5, ...style }}>{children}</div>;
}

export function CardHeader({ title, sub, right, style = {} }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     sub ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      marginBottom:   DS.sp4,
      gap:            DS.sp3,
      ...style,
    }}>
      <div>
        <div style={TYPE.label}>{title}</div>
        {sub && <div style={{ ...TYPE.caption, marginTop: 3 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KPI CARD — Primary metric tile
══════════════════════════════════════════════════════════════════ */
export function KpiCard({
  label,
  value,
  valueSuffix,
  sub,
  subTrend,
  subContext,
  sparkData,
  ring,
  ringColor,
  icon: Icon,
  valueColor,
  cta,
  onCta,
}) {
  const trendColor = subTrend === 'up' ? DS.success : subTrend === 'down' ? DS.danger : DS.t3;
  const TrendIcon  = subTrend === 'up' ? ArrowUpRight : subTrend === 'down' ? TrendingDown : Minus;

  return (
    <Card padding={`${DS.sp4}px ${DS.sp5}px`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: DS.sp4 }}>
        <span style={TYPE.label}>{label}</span>
        {Icon && <Icon style={{ width: 13, height: 13, color: DS.t4 }} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: DS.sp3 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span data-metric style={{ ...TYPE.metric, color: valueColor || DS.t0 }}>
              {value}
            </span>
            {valueSuffix && (
              <span style={{ fontSize: 12, fontWeight: 500, color: DS.t3 }}>{valueSuffix}</span>
            )}
          </div>
          {sub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: DS.sp2 }}>
              <TrendIcon style={{ width: 10, height: 10, color: trendColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: trendColor, lineHeight: 1.3 }}>{sub}</span>
            </div>
          )}
          {subContext && (
            <div style={{ ...TYPE.micro, color: DS.t4, marginTop: 3 }}>{subContext}</div>
          )}
        </div>
        {sparkData && sparkData.some(v => v > 0) && <MiniSpark data={sparkData} />}
      </div>

      {cta && onCta && (
        <ActionButton onClick={onCta} size="sm" variant="ghost" style={{ marginTop: DS.sp2, width: '100%' }}>
          {cta} <ChevronRight style={{ width: 10, height: 10 }} />
        </ActionButton>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MINI SPARKLINE
══════════════════════════════════════════════════════════════════ */
export function MiniSpark({ data = [], width = 64, height = 28, color = DS.accent }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const max   = Math.max(...data, 1);
  const min   = Math.min(...data, 0);
  const range = max - min || 1;
  const pts   = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = pts.split(' ')[0];
  const last  = pts.split(' ').slice(-1)[0];
  const area  = `${first.split(',')[0]},${height} ${pts} ${last.split(',')[0]},${height}`;
  const gradId = `spark-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIGNAL — Alert row with 3px left border as only color
══════════════════════════════════════════════════════════════════ */
export function Signal({ color, icon: Icon, title, detail, action, onAction, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onAction}
      onMouseEnter={() => onAction && setHov(true)}
      onMouseLeave={() => onAction && setHov(false)}
      style={{
        padding:      `${DS.sp3}px ${DS.sp3}px`,
        borderRadius: DS.r2,
        background:   hov && onAction ? DS.surfaceRaised : DS.surface,
        border:       `1px solid ${DS.border}`,
        borderLeft:   `3px solid ${color}`,
        marginBottom: last ? 0 : DS.sp2,
        cursor:       onAction ? 'pointer' : 'default',
        transition:   DS.fast,
        boxShadow:    DS.shadowCard,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: DS.sp2 }}>
        <Icon style={{ width: 12, height: 12, color, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...TYPE.cardTitle, fontSize: 12, marginBottom: 2 }}>{title}</div>
          <div style={{ ...TYPE.caption, fontSize: 11 }}>{detail}</div>
        </div>
        {action && (
          <span style={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0, whiteSpace: 'nowrap', marginTop: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            {action} <ChevronRight style={{ width: 9, height: 9 }} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAT NUDGE — Contextual insight with 2px left border
══════════════════════════════════════════════════════════════════ */
export function StatNudge({ color = DS.accent, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{
      marginTop:    DS.sp3,
      display:      'flex',
      alignItems:   'flex-start',
      gap:          DS.sp2 + 1,
      padding:      `${DS.sp2 + 1}px ${DS.sp3}px`,
      borderRadius: DS.r2,
      background:   DS.surfaceRaised,
      border:       `1px solid ${DS.border}`,
      borderLeft:   `2px solid ${color}`,
    }}>
      {Icon && <Icon style={{ width: 11, height: 11, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: DS.t1 }}>{stat} </span>
        <span style={{ fontSize: 11, fontWeight: 500, color: DS.t3, lineHeight: 1.5 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={e => { e.stopPropagation(); onAction(); }} style={{
          flexShrink: 0, fontSize: 10, fontWeight: 700, color,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: DS.fontSans, whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 2, padding: 0,
        }}>
          {action} <ChevronRight style={{ width: 9, height: 9 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAT ROW — Key-value row for lists
══════════════════════════════════════════════════════════════════ */
export function StatRow({ label, value, valueColor, sub, last, badge }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        `${DS.sp2}px 0`,
      borderBottom:   last ? 'none' : `1px solid ${DS.divider}`,
    }}>
      <div>
        <span style={{ fontSize: 12, fontWeight: 500, color: DS.t2 }}>{label}</span>
        {sub && <span style={{ fontSize: 10, color: DS.t4, marginLeft: DS.sp2 }}>{sub}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {badge && <Badge label={badge.label} color={badge.color} />}
        <span data-metric style={{ fontSize: 13, fontWeight: 700, color: valueColor || DS.t1, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BADGE — Status indicator pill
══════════════════════════════════════════════════════════════════ */
export function Badge({ label, color, variant = 'filled', size = 'sm' }) {
  const isFilled = variant === 'filled';
  const isGhost  = variant === 'ghost';
  const sz = size === 'xs' ? { fs: 8, px: 5, py: 1 } : { fs: 9.5, px: 7, py: 2 };

  return (
    <span style={{
      display:        'inline-flex',
      alignItems:     'center',
      fontSize:       sz.fs,
      fontWeight:     700,
      padding:        `${sz.py}px ${sz.px}px`,
      borderRadius:   5,
      letterSpacing:  '0.02em',
      color:          isGhost ? DS.t4 : color,
      background:     isFilled ? `${color}10` : 'transparent',
      border:         `1px solid ${isGhost ? 'transparent' : `${color}22`}`,
      whiteSpace:     'nowrap',
      fontFamily:     DS.fontSans,
    }}>
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ACTION BUTTON
══════════════════════════════════════════════════════════════════ */
export function ActionButton({ children, onClick, variant = 'ghost', size = 'md', disabled, style: overrides = {} }) {
  const [hov, setHov] = useState(false);

  const colors = {
    primary: { bg: DS.accent,   color: '#fff',   brd: DS.accent,    hoverBg: `${DS.accent}dd`   },
    ghost:   { bg: 'transparent', color: DS.t2,  brd: DS.border,    hoverBg: DS.surfaceRaised   },
    danger:  { bg: 'transparent', color: DS.danger, brd: DS.dangerBrd, hoverBg: DS.dangerDim   },
    success: { bg: 'transparent', color: DS.success, brd: DS.successBrd, hoverBg: DS.successDim },
  };
  const c = colors[variant] || colors.ghost;
  const sz = size === 'sm' ? { px: 10, py: 5, fs: 10, r: DS.r1 }
           : size === 'lg' ? { px: 18, py: 9, fs: 13, r: DS.r3 }
           :                 { px: 14, py: 7, fs: 11, r: DS.r2 };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            DS.sp2,
        padding:        `${sz.py}px ${sz.px}px`,
        borderRadius:   sz.r,
        fontSize:       sz.fs,
        fontWeight:     700,
        fontFamily:     DS.fontSans,
        cursor:         disabled ? 'default' : 'pointer',
        opacity:        disabled ? 0.4 : 1,
        transition:     DS.fast,
        background:     hov ? c.hoverBg : c.bg,
        color:          c.color,
        border:         `1px solid ${hov ? (variant === 'primary' ? c.brd : DS.borderMid) : c.brd}`,
        ...overrides,
      }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════════════════════════════ */
export function SectionLabel({ children, style = {} }) {
  return <div style={{ ...TYPE.label, marginBottom: DS.sp2, ...style }}>{children}</div>;
}

/* ══════════════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════════════ */
export function EmptyState({ icon: Icon, label, sub, action, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `${DS.sp8}px ${DS.sp5}px`, gap: DS.sp2 }}>
      {Icon && <Icon style={{ width: 20, height: 20, color: DS.t4, opacity: 0.5 }} />}
      <span style={{ fontSize: 12, fontWeight: 600, color: DS.t3 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: DS.t4 }}>{sub}</span>}
      {action && onAction && (
        <ActionButton onClick={onAction} variant="ghost" size="sm" style={{ marginTop: DS.sp2 }}>
          {action}
        </ActionButton>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CHART TOOLTIP
══════════════════════════════════════════════════════════════════ */
export function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   '#04070d',
      border:       `1px solid ${DS.borderHi}`,
      borderRadius: DS.r2,
      padding:      `${DS.sp2}px ${DS.sp3}px`,
      boxShadow:    DS.shadowOverlay,
    }}>
      <p style={{ ...TYPE.micro, margin: '0 0 2px' }}>{label}</p>
      <p data-metric style={{ color: DS.t0, fontWeight: 700, fontSize: 14, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
        {payload[0].value}{unit}
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB TOGGLE
══════════════════════════════════════════════════════════════════ */
export function TabToggle({ options, value, onChange }) {
  return (
    <div style={{
      display:      'flex',
      gap:          2,
      padding:      2,
      background:   DS.surfaceRaised,
      borderRadius: DS.r2,
      border:       `1px solid ${DS.border}`,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            fontSize:     10,
            fontWeight:   value === opt.value ? 700 : 500,
            padding:      `4px ${DS.sp3}px`,
            borderRadius: DS.r1,
            cursor:       'pointer',
            fontFamily:   DS.fontSans,
            transition:   DS.fast,
            background:   value === opt.value ? DS.accentDim : 'transparent',
            color:        value === opt.value ? DS.accent : DS.t3,
            border:       `1px solid ${value === opt.value ? DS.accentBrd : 'transparent'}`,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ICON BADGE
══════════════════════════════════════════════════════════════════ */
export function IconBadge({ icon: Icon, color, size = 28 }) {
  return (
    <div style={{
      width:          size,
      height:         size,
      borderRadius:   DS.r2,
      background:     DS.surfaceRaised,
      border:         `1px solid ${DS.border}`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      flexShrink:     0,
    }}>
      <Icon style={{ width: size * 0.43, height: size * 0.43, color: color || DS.t3 }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TREND BADGE
══════════════════════════════════════════════════════════════════ */
export function TrendBadge({ value, suffix = '%' }) {
  if (value == null || value === 0) return null;
  const up    = value > 0;
  const color = up ? DS.success : DS.danger;
  const Icon  = up ? ArrowUpRight : TrendingDown;

  return (
    <span style={{
      display:            'inline-flex',
      alignItems:         'center',
      gap:                3,
      padding:            '2px 6px',
      borderRadius:       5,
      fontSize:           10,
      fontWeight:         700,
      color,
      background:         up ? DS.successDim : DS.dangerDim,
      border:             `1px solid ${up ? DS.successBrd : DS.dangerBrd}`,
      fontVariantNumeric: 'tabular-nums',
    }}>
      <Icon style={{ width: 9, height: 9 }} />
      {up ? '+' : ''}{value}{suffix}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   UPDATED TIMESTAMP
══════════════════════════════════════════════════════════════════ */
export function UpdatedAt({ timestamp }) {
  if (!timestamp) return null;
  const fmt = typeof timestamp === 'string'
    ? timestamp
    : timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: DS.sp2, paddingTop: DS.sp2, borderTop: `1px solid ${DS.divider}` }}>
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: DS.success, opacity: 0.5 }} />
      <span style={{ ...TYPE.micro, fontSize: 9, color: DS.t4 }}>Updated {fmt}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PROGRESS BAR
══════════════════════════════════════════════════════════════════ */
export function ProgressBar({ value, max = 100, color = DS.accent, height = 3 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ height, borderRadius: 99, background: DS.divider, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.7s ease' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STATUS DOT
══════════════════════════════════════════════════════════════════ */
export function StatusDot({ color, size = 6, pulse = false }) {
  return (
    <div style={{
      width:      size,
      height:     size,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      ...(pulse ? { boxShadow: `0 0 0 2px ${color}20` } : {}),
    }} />
  );
}

/* ══════════════════════════════════════════════════════════════════
   GRID LAYOUTS
══════════════════════════════════════════════════════════════════ */
export function KpiGrid({ children, cols = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: DS.sp3 }}>
      {children}
    </div>
  );
}

export function PageGrid({ left, right, rightWidth = 292, gap = DS.sp5 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `1fr ${rightWidth}px`, gap, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: DS.sp5 }}>{left}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: DS.sp4 }}>{right}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RING CHART — Donut progress indicator
══════════════════════════════════════════════════════════════════ */
export function RingChart({ pct, size = 44, stroke = 3.5, color = DS.accent }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={DS.divider} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: size * 0.26, fontWeight: 700, fill: DS.t1, fontFamily: DS.fontMono }}
      >
        {pct}%
      </text>
    </svg>
  );
}