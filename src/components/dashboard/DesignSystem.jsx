/**
 * DesignSystem.js — Single source of truth for all dashboard design tokens
 */

const DS = {
  // Surfaces
  bg:           '#080e18',
  surface:      '#0c1422',
  surfaceRaised:'#101929',

  // Borders
  border:    'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.12)',
  borderHi:  'rgba(255,255,255,0.18)',
  divider:   'rgba(255,255,255,0.04)',

  // Text
  t0: '#ffffff',
  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#2d3f55',

  // Accent (blue)
  accent:    '#3b82f6',
  accentDim: 'rgba(59,130,246,0.12)',
  accentBrd: 'rgba(59,130,246,0.24)',

  // Semantic
  success:    '#10b981',
  successDim: 'rgba(16,185,129,0.10)',
  successBrd: 'rgba(16,185,129,0.22)',

  danger:    '#ef4444',
  dangerDim: 'rgba(239,68,68,0.10)',
  dangerBrd: 'rgba(239,68,68,0.22)',

  warn:    '#f59e0b',
  warnDim: 'rgba(245,158,11,0.10)',
  warnBrd: 'rgba(245,158,11,0.22)',

  // Shadows
  shadowCard:    'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)',
  shadowRaised:  'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.5)',
  shadowInset:   'inset 0 1px 0 rgba(255,255,255,0.04)',
  shadowOverlay: '0 8px 32px rgba(0,0,0,0.6)',

  // Spacing (px values)
  sp1: 2, sp2: 4, sp3: 8, sp4: 12, sp5: 16, sp6: 20, sp7: 24, sp8: 32,

  // Border radii
  r1: 6, r2: 8, r3: 10, r4: 14,

  // Fonts
  fontSans: 'inherit',
  fontMono: "'SF Mono', 'Fira Code', monospace",

  // Transitions
  fast:   'all 0.12s ease',
  medium: 'all 0.22s ease',
};

export default DS;

// Card shell shorthand
export const CARD = {
  background:   DS.surface,
  border:       `1px solid ${DS.border}`,
  borderRadius: DS.r4,
  boxShadow:    DS.shadowCard,
};

export const CARD_HOVER = {
  background: DS.surfaceRaised,
  border:     `1px solid ${DS.borderMid}`,
  boxShadow:  DS.shadowRaised,
};

// Typography scale
export const TYPE = {
  metric: {
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: '-0.04em',
    lineHeight: 1,
    color: DS.t1,
    fontVariantNumeric: 'tabular-nums',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: DS.t1,
    letterSpacing: '-0.01em',
  },
  label: {
    fontSize: 10.5,
    fontWeight: 700,
    color: DS.t3,
    letterSpacing: '.04em',
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 11,
    fontWeight: 400,
    color: DS.t3,
    lineHeight: 1.45,
  },
  micro: {
    fontSize: 10,
    fontWeight: 500,
    color: DS.t4,
    letterSpacing: '.02em',
  },
};