/**
 * dashboard-tokens.js — Single Source of Truth
 * Import { C, CARD_SHADOW, CARD_RADIUS, CHART_TICK } in every tab.
 * No local token objects. No orange. No amber.
 */

export const C = {
  bg:        '#070b14',
  surface:   '#0b1018',
  surfaceEl: '#0f1520',

  border:   'rgba(255,255,255,0.06)',
  borderEl: 'rgba(255,255,255,0.11)',
  divider:  'rgba(255,255,255,0.04)',

  t0: '#f8fafc',
  t1: '#e2e8f0',
  t2: '#94a3b8',
  t3: '#64748b',
  t4: '#334155',

  accent:    '#3b82f6',
  accentSub: 'rgba(59,130,246,0.10)',
  accentBrd: 'rgba(59,130,246,0.24)',

  danger:    '#ef4444',
  dangerSub: 'rgba(239,68,68,0.08)',
  dangerBrd: 'rgba(239,68,68,0.22)',

  success:    '#10b981',
  successSub: 'rgba(16,185,129,0.08)',
  successBrd: 'rgba(16,185,129,0.22)',

  caution:    '#64748b',
  cautionSub: 'rgba(100,116,139,0.10)',
  cautionBrd: 'rgba(100,116,139,0.22)',

  community:    '#818cf8',
  communitySub: 'rgba(129,140,248,0.10)',
  communityBrd: 'rgba(129,140,248,0.24)',
};

export const CARD_SHADOW = 'inset 0 1px 0 rgba(255,255,255,0.03), 0 1px 3px rgba(0,0,0,0.4)';
export const CARD_RADIUS = 14;
export const CHART_TICK = { fill: C.t4, fontSize: 10, fontFamily: 'inherit', fontWeight: 500 };

export default C;