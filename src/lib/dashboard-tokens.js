/**
 * Canonical design tokens for the gym owner dashboard.
 *
 * Previously duplicated verbatim in TabOverview, TabContent, TabAnalytics,
 * TabMembers, and TabEngagement. Single source of truth now.
 *
 * PHILOSOPHY: Color = Meaning. Silence = Safety.
 *   - Accent (#3b82f6) is reserved for interactive + data only.
 *   - Danger / warn / success are threshold-triggered, not decorative.
 *   - All neutrals (borders, text, bg) are never colored.
 */

export const C = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg:        '#050810',   // Page body
  surface:   '#0a0f1e',   // Cards, panels
  surfaceEl: '#0d1225',   // Hover, elevated rows, selected states

  // ── Borders & dividers (neutral only — never colored) ────────────────────
  border:   'rgba(255,255,255,0.04)',
  borderEl: 'rgba(255,255,255,0.07)',
  divider:  'rgba(255,255,255,0.03)',

  // ── Text scale (4 levels) ────────────────────────────────────────────────
  t1: '#f1f5f9',   // Primary — metric values, headings
  t2: '#94a3b8',   // Secondary — labels, descriptions
  t3: '#475569',   // Muted — timestamps, supporting copy
  t4: '#2d3f55',   // Ghost — decorative, disabled, rank numbers

  // ── Brand accent (one color) ─────────────────────────────────────────────
  accent:    '#3b82f6',
  accentSub: 'rgba(59,130,246,0.10)',
  accentBrd: 'rgba(59,130,246,0.22)',

  // Aliases used by TabEngagement
  blue:    '#3b82f6',
  blueDim: 'rgba(59,130,246,0.12)',
  blueBrd: 'rgba(59,130,246,0.24)',

  // ── Semantic: Danger ─────────────────────────────────────────────────────
  danger:    '#ef4444',
  dangerSub: 'rgba(239,68,68,0.08)',
  dangerBrd: 'rgba(239,68,68,0.22)',

  // Alias used by TabEngagement
  red:    '#ef4444',
  redDim: 'rgba(239,68,68,0.10)',

  // ── Semantic: Success ────────────────────────────────────────────────────
  success:    '#10b981',
  successSub: 'rgba(16,185,129,0.08)',
  successBrd: 'rgba(16,185,129,0.20)',

  // Alias used by TabEngagement
  green:    '#10b981',
  greenDim: 'rgba(16,185,129,0.10)',

  // ── Semantic: Warn ───────────────────────────────────────────────────────
  warn:    '#f59e0b',
  warnSub: 'rgba(245,158,11,0.08)',
  warnBrd: 'rgba(245,158,11,0.22)',

  // Aliases used by TabEngagement
  surfaceHi: '#0d1225',
  borderHi:  'rgba(255,255,255,0.07)',
};

/** Shared card elevation — matches coach dashboard card shell */
export const CARD_SHADOW = 'inset 0 1px 0 rgba(255,255,255,0.012)';
export const CARD_RADIUS = 16;
