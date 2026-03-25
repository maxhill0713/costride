/**
 * DesignSystem.js — Unified Design Tokens & Shared Primitives
 * ═══════════════════════════════════════════════════════════════
 *
 * DUAL-MODE SYSTEM
 *   Professional Mode → Overview, Analytics, Members, Revenue
 *   Community Mode    → Content, Feed, Challenges, Posts
 *
 * PHILOSOPHY
 *   "Precision Noir" — Surgical dark UI with controlled warmth.
 *   Color is earned, never decorative. Every pixel of color
 *   must communicate meaning or invite interaction.
 *
 * TYPOGRAPHY
 *   Display:  "Satoshi", fallback to system
 *   Body:     "Satoshi", fallback to system
 *   Mono:     "JetBrains Mono", fallback to monospace
 *   All metrics use tabular-nums for alignment.
 *
 * SPACING
 *   Base unit: 4px
 *   Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
 *
 * ELEVATION
 *   Level 0: bg (page)
 *   Level 1: surface (cards)
 *   Level 2: surfaceRaised (hover, elevated panels)
 *   Level 3: surfaceOverlay (modals, dropdowns)
 */

/* ══════════════════════════════════════════════════════════════════
   FONT INJECTION
   Satoshi is a clean geometric sans with character.
   JetBrains Mono for metric numbers.
══════════════════════════════════════════════════════════════════ */
const FONT_CSS = `
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800,900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

:root {
  --font-sans: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  --tabular: 'Satoshi', sans-serif;
}
`;

/* ══════════════════════════════════════════════════════════════════
   COLOR TOKENS
══════════════════════════════════════════════════════════════════ */
export const DS = {
  // ── Backgrounds (4-level elevation) ────────────────────────────
  bg:             '#06090f',     // L0 — page body, deepest
  surface:        '#0b1018',     // L1 — cards, panels
  surfaceRaised:  '#0f1520',     // L2 — hover, elevated, selected
  surfaceOverlay: '#131a28',     // L3 — dropdowns, modals, tooltips

  // ── Borders (3 levels) ─────────────────────────────────────────
  border:      'rgba(255,255,255,0.06)',   // hairline, card edges
  borderMid:   'rgba(255,255,255,0.10)',   // hover, selected card
  borderHi:    'rgba(255,255,255,0.16)',   // active, focus rings
  divider:     'rgba(255,255,255,0.04)',   // intra-card separators

  // ── Text (5 levels — strict hierarchy) ─────────────────────────
  t0: '#f8fafc',   // Headline — hero metrics, page titles
  t1: '#e2e8f0',   // Primary — card values, row names
  t2: '#94a3b8',   // Secondary — labels, descriptions
  t3: '#64748b',   // Tertiary — timestamps, supporting
  t4: '#334155',   // Ghost — decorative, disabled, ranks

  // ── Brand Accent (single hue) ─────────────────────────────────
  accent:    '#3b82f6',
  accentDim: 'rgba(59,130,246,0.10)',
  accentMid: 'rgba(59,130,246,0.18)',
  accentBrd: 'rgba(59,130,246,0.28)',
  accentHi:  'rgba(59,130,246,0.40)',

  // ── Semantic: Danger ───────────────────────────────────────────
  danger:    '#ef4444',
  dangerDim: 'rgba(239,68,68,0.08)',
  dangerMid: 'rgba(239,68,68,0.14)',
  dangerBrd: 'rgba(239,68,68,0.24)',

  // ── Semantic: Success ──────────────────────────────────────────
  success:    '#10b981',
  successDim: 'rgba(16,185,129,0.08)',
  successMid: 'rgba(16,185,129,0.14)',
  successBrd: 'rgba(16,185,129,0.24)',

  // ── Semantic: Warn (use sparingly) ─────────────────────────────
  warn:    '#f59e0b',
  warnDim: 'rgba(245,158,11,0.08)',
  warnMid: 'rgba(245,158,11,0.14)',
  warnBrd: 'rgba(245,158,11,0.24)',

  // ── Community Mode accent (warmer blue-violet) ─────────────────
  community:    '#818cf8',
  communityDim: 'rgba(129,140,248,0.10)',
  communityBrd: 'rgba(129,140,248,0.24)',

  // ── Spacing scale (4px base) ───────────────────────────────────
  sp1:  4,   sp2:  8,   sp3: 12,  sp4: 16,
  sp5: 20,   sp6: 24,   sp7: 32,  sp8: 40,
  sp9: 48,   sp10: 64,

  // ── Radius ─────────────────────────────────────────────────────
  r1:  6,    r2:  8,    r3: 12,   r4: 16,   r5: 20,

  // ── Shadows ────────────────────────────────────────────────────
  shadowCard:    '0 1px 2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)',
  shadowRaised:  '0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
  shadowOverlay: '0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
  shadowInset:   'inset 0 1px 0 rgba(255,255,255,0.03)',

  // ── Transitions ────────────────────────────────────────────────
  fast:   'all 0.12s ease',
  medium: 'all 0.2s ease',
  slow:   'all 0.35s ease',

  // ── Fonts ──────────────────────────────────────────────────────
  fontSans: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', monospace",
};

/* ══════════════════════════════════════════════════════════════════
   CHART AXIS TICK — always muted, monospaced
══════════════════════════════════════════════════════════════════ */
export const CHART_TICK = {
  fill: DS.t4,
  fontSize: 10,
  fontFamily: DS.fontMono,
  fontWeight: 500,
};

/* ══════════════════════════════════════════════════════════════════
   CARD STYLES
══════════════════════════════════════════════════════════════════ */
export const CARD = {
  background:   DS.surface,
  border:       `1px solid ${DS.border}`,
  borderRadius: DS.r4,
  boxShadow:    `${DS.shadowInset}, ${DS.shadowCard}`,
};

export const CARD_HOVER = {
  borderColor: DS.borderMid,
  boxShadow:   `${DS.shadowInset}, ${DS.shadowRaised}`,
};

/* ══════════════════════════════════════════════════════════════════
   TYPOGRAPHY PRESETS
══════════════════════════════════════════════════════════════════ */
export const TYPE = {
  // Hero metric (the one big number)
  hero: {
    fontSize:      40,
    fontWeight:    800,
    color:         DS.t0,
    letterSpacing: '-0.04em',
    lineHeight:    1,
    fontVariantNumeric: 'tabular-nums',
    fontFamily:    DS.fontSans,
  },
  // Large metric
  metric: {
    fontSize:      28,
    fontWeight:    700,
    color:         DS.t0,
    letterSpacing: '-0.035em',
    lineHeight:    1,
    fontVariantNumeric: 'tabular-nums',
    fontFamily:    DS.fontSans,
  },
  // Medium metric (inline stats)
  stat: {
    fontSize:      18,
    fontWeight:    700,
    color:         DS.t1,
    letterSpacing: '-0.02em',
    lineHeight:    1,
    fontVariantNumeric: 'tabular-nums',
    fontFamily:    DS.fontSans,
  },
  // Card title
  cardTitle: {
    fontSize:      13,
    fontWeight:    700,
    color:         DS.t1,
    letterSpacing: '-0.01em',
    lineHeight:    1.3,
    fontFamily:    DS.fontSans,
  },
  // Section label (uppercase)
  label: {
    fontSize:      10,
    fontWeight:    700,
    color:         DS.t3,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    lineHeight:    1,
    fontFamily:    DS.fontSans,
  },
  // Body text
  body: {
    fontSize:      13,
    fontWeight:    500,
    color:         DS.t2,
    lineHeight:    1.5,
    fontFamily:    DS.fontSans,
  },
  // Small text
  caption: {
    fontSize:      11,
    fontWeight:    500,
    color:         DS.t3,
    lineHeight:    1.4,
    fontFamily:    DS.fontSans,
  },
  // Tiny label
  micro: {
    fontSize:      9,
    fontWeight:    700,
    color:         DS.t4,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontFamily:    DS.fontSans,
  },
  // Monospaced number
  mono: {
    fontFamily:    DS.fontMono,
    fontVariantNumeric: 'tabular-nums',
    fontWeight:    600,
  },
};

/* ══════════════════════════════════════════════════════════════════
   RESPONSIVE BREAKPOINTS
══════════════════════════════════════════════════════════════════ */
export const BP = {
  mobile:  768,
  tablet:  1024,
  desktop: 1280,
  wide:    1440,
};

/* ══════════════════════════════════════════════════════════════════
   INJECT GLOBAL STYLES
   Call once at app root.
══════════════════════════════════════════════════════════════════ */
let injected = false;
export function injectGlobalStyles() {
  if (injected) return;
  injected = true;
  const style = document.createElement('style');
  style.textContent = `
    ${FONT_CSS}
    
    * { box-sizing: border-box; }
    
    body {
      background: ${DS.bg};
      color: ${DS.t1};
      font-family: ${DS.fontSans};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Scrollbar — subtle */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.12); }

    /* Selection */
    ::selection { background: ${DS.accentMid}; color: ${DS.t0}; }

    /* Focus ring */
    :focus-visible {
      outline: 2px solid ${DS.accent};
      outline-offset: 2px;
    }

    /* Tabular nums for all metric elements */
    [data-metric] {
      font-variant-numeric: tabular-nums;
      font-feature-settings: 'tnum' 1;
    }
  `;
  document.head.appendChild(style);
}

export default DS;