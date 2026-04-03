/**
 * TabOverview — Enhanced with Priority Action Panel & Actionable Intelligence
 *
 * WHAT'S NEW (keeping exact UI system — tokens, card shell, hierarchy rules):
 *
 * 1. PRIORITY ACTION PANEL — top-center hero card with 3–5 ranked tasks,
 *    each with icon, title, explanation, impact estimate, and CTA.
 * 2. KPI CARDS — richer subtexts: contextual labels ("Lowest this week",
 *    "Above average"), vs-yesterday deltas, weekly avg context, inline CTAs.
 * 3. AT-RISK MEMBER PREVIEW — expanded inline preview showing member names,
 *    last-seen info, risk tags, and direct message / view buttons.
 * 4. GREETING HEADER — personalized "Good evening, Max — here's what to
 *    focus on today" with date display.
 * 5. SMARTER EMPTY STATES — encouraging language instead of blank panels.
 * 6. DYNAMIC INSIGHTS — detect drops, spikes, inactivity patterns and
 *    surface them contextually inside each card.
 *
 * All visual-hierarchy rules (Color = Meaning, left-border signals,
 * threshold-only color, neutral icon containers, flat fills) are UNCHANGED.
 * Token palette, CARD_SHADOW, CARD_RADIUS — all identical.
 * No revenue sections included per user request.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, subDays, startOfDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  TrendingDown, ArrowUpRight, Zap,
  CheckCircle, Trophy, UserPlus, QrCode, MessageSquarePlus,
  Pencil, Calendar, Activity, Users, AlertTriangle,
  ChevronRight, Minus, TrendingUp,
  Clock, Flame, BarChart2, Shield, Send, Eye, Heart,
  Sun, Moon, Sunrise, Coffee,
} from 'lucide-react';
import { RingChart, Avatar } from './DashboardPrimitives';

import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

/* ── Axis tick — always muted ──────────────────────────────────── */
const tick = { fill: C.t3, fontSize: 10, fontFamily: 'inherit' };

/* ── Greeting helper ───────────────────────────────────────────── */
function getGreeting(hour) {
  if (hour < 5)  return { text: 'Good night',      icon: Moon };
  if (hour < 12) return { text: 'Good morning',    icon: Sunrise };
  if (hour < 17) return { text: 'Good afternoon',  icon: Sun };
  return               { text: 'Good evening',     icon: Coffee };
}

/* ══════════════════════════════════════════════════════════════════
   CHART TOOLTIP
══════════════════════════════════════════════════════════════════ */
function Tip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   '#060c18',
      border:       `1px solid ${C.borderEl}`,
      borderRadius: 8,
      padding:      '7px 11px',
      boxShadow:    '0 6px 20px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: C.t3, fontSize: 10, fontWeight: 500, margin: '0 0 2px', letterSpacing: '.03em' }}>{label}</p>
      <p style={{ color: C.t1, fontWeight: 700, fontSize: 14, margin: 0 }}>{payload[0].value}{unit}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MINI SPARKLINE
══════════════════════════════════════════════════════════════════ */
function MiniSpark({ data = [], width = 64, height = 26 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = pts.split(' ')[0], last = pts.split(' ').slice(-1)[0];
  const area = `${first.split(',')[0]},${height} ${pts} ${last.split(',')[0]},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-ov" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-ov)" />
      <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KPI CARD — enhanced with richer subtexts, contextual insights, CTAs
══════════════════════════════════════════════════════════════════ */
function KpiCard({ label, value, valueSuffix, sub, subTrend, subContext, sparkData, ring, ringColor, icon: Icon, valueColor, cta, onCta, insight }) {
  const trendColor = subTrend === 'up' ? C.success : subTrend === 'down' ? C.danger : C.t3;
  const TrendIcon  = subTrend === 'up' ? ArrowUpRight : subTrend === 'down' ? TrendingDown : Minus;
  const showRing   = ring != null && ring > 5 && ring < 98;

  return (
    <div style={{
      borderRadius:  CARD_RADIUS,
      padding:       '16px 18px',
      background:    C.surface,
      border:        `1px solid ${C.border}`,
      boxShadow:     CARD_SHADOW,
      display:       'flex',
      flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>{label}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: valueColor || C.t1, lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</span>
            {valueSuffix && <span style={{ fontSize: 13, fontWeight: 400, color: C.t3 }}>{valueSuffix}</span>}
          </div>
          {sub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <TrendIcon style={{ width: 10, height: 10, color: trendColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: trendColor, lineHeight: 1.3 }}>{sub}</span>
            </div>
          )}
          {subContext && (
            <div style={{ fontSize: 10, color: C.t3, marginTop: 3, lineHeight: 1.4 }}>{subContext}</div>
          )}
        </div>
        {showRing
          ? <RingChart pct={ring} size={44} stroke={3.5} color={ringColor || C.accent} />
          : sparkData && sparkData.some(v => v > 0)
          ? <MiniSpark data={sparkData} />
          : null
        }
      </div>

      {/* Contextual insight nudge */}
      {insight && (
        <div style={{
          fontSize:     10,
          color:        C.t3,
          lineHeight:   1.45,
          padding:      '6px 0 2px',
          borderTop:    `1px solid ${C.divider}`,
          marginTop:    'auto',
          fontStyle:    'italic',
        }}>
          {insight}
        </div>
      )}

      {cta && onCta && (
        <button onClick={onCta} style={{
          marginTop:      8,
          width:          '100%',
          padding:        '6px 10px',
          borderRadius:   8,
          background:     C.surfaceEl,
          border:         `1px solid ${C.borderEl}`,
          color:          C.t1,
          fontSize:       11,
          fontWeight:     600,
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            5,
          fontFamily:     'inherit',
          transition:     'border-color .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.borderEl}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.borderEl}
        >
          {cta} <ChevronRight style={{ width: 10, height: 10 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAT ROW
══════════════════════════════════════════════════════════════════ */
function StatRow({ label, value, valueColor, last, badge }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '8px 0',
      borderBottom:   last ? 'none' : `1px solid ${C.divider}`,
    }}>
      <span style={{ fontSize: 12, color: C.t2 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {badge && (
          <span style={{
            fontSize:     9,
            fontWeight:   600,
            color:        badge.color,
            background:   `${badge.color}10`,
            border:       `1px solid ${badge.color}22`,
            borderRadius: 5,
            padding:      '1px 6px',
          }}>
            {badge.label}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: valueColor || C.t1 }}>{value}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ACTION ROW — icon container neutral, glyph carries semantic color
══════════════════════════════════════════════════════════════════ */
function ActionRow({ icon: Icon, label, action, color, onClick, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          10,
        padding:      '9px 0',
        borderBottom: last ? 'none' : `1px solid ${C.divider}`,
        cursor:       'pointer',
      }}>
      <div style={{
        width:          28,
        height:         28,
        borderRadius:   7,
        background:     C.surfaceEl,
        border:         `1px solid ${C.border}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}>
        <Icon style={{ width: 12, height: 12, color }} />
      </div>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: hov ? C.t1 : C.t2, lineHeight: 1.4, transition: 'color .15s' }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: hov ? C.t1 : C.t3, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, transition: 'color .15s' }}>
        {action}<ChevronRight style={{ width: 10, height: 10 }} />
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIGNAL — 3px left border is the ONLY color. Surface always neutral.
══════════════════════════════════════════════════════════════════ */
function Signal({ color, icon: Icon, title, detail, action, onAction, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        padding:      '10px 12px',
        borderRadius: 9,
        background:   hov && onAction ? C.surfaceEl : C.surface,
        border:       `1px solid ${C.border}`,
        borderLeft:   `3px solid ${color}`,
        marginBottom: last ? 0 : 6,
        cursor:       onAction ? 'pointer' : 'default',
        transition:   'background .15s',
      }}
      onClick={onAction}
      onMouseEnter={() => onAction && setHov(true)}
      onMouseLeave={() => onAction && setHov(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Icon style={{ width: 12, height: 12, color, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, lineHeight: 1.3, marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</div>
        </div>
        {action && (
          <span style={{
            fontSize:   10,
            fontWeight: 600,
            color,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            marginTop:  1,
            display:    'flex',
            alignItems: 'center',
            gap:        2,
          }}>
            {action} <ChevronRight style={{ width: 9, height: 9 }} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAT NUDGE — surfaceEl bg, 2px left border is only color
══════════════════════════════════════════════════════════════════ */
function StatNudge({ color = C.accent, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{
      marginTop:    12,
      display:      'flex',
      alignItems:   'flex-start',
      gap:          9,
      padding:      '9px 11px',
      borderRadius: 8,
      background:   C.surfaceEl,
      border:       `1px solid ${C.border}`,
      borderLeft:   `2px solid ${color}`,
    }}>
      {Icon && <Icon style={{ width: 11, height: 11, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{stat} </span>
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={onAction} style={{
          flexShrink: 0,
          fontSize:   10,
          fontWeight: 600,
          color,
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          display:    'flex',
          alignItems: 'center',
          gap:        2,
          padding:    0,
        }}>
          {action} <ChevronRight style={{ width: 9, height: 9 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRIORITY ACTION PANEL — hero card with ranked, actionable tasks
   Each item: icon, title, explanation, impact, CTA button
══════════════════════════════════════════════════════════════════ */
function PriorityActionPanel({ priorities = [], now }) {
  if (!priorities || priorities.length === 0) return null;

  return (
    <div style={{
      padding:      '20px 22px',
      borderRadius: CARD_RADIUS,
      background:   C.surface,
      border:       `1px solid ${C.border}`,
      boxShadow:    CARD_SHADOW,
    }}>
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         8,
        marginBottom: 16,
      }}>
        <Zap style={{ width: 13, height: 13, color: C.accent }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>
          Today's Priorities
        </span>
        <span style={{
          marginLeft:   'auto',
          fontSize:     10,
          fontWeight:   600,
          color:        C.t3,
          background:   C.surfaceEl,
          border:       `1px solid ${C.border}`,
          borderRadius: 6,
          padding:      '2px 8px',
        }}>
          {priorities.length} action{priorities.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {priorities.map((p, i) => {
          const [hov, setHov] = useState(false);
          return (
            <div
              key={i}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{
                display:      'flex',
                alignItems:   'flex-start',
                gap:          12,
                padding:      '12px 14px',
                borderRadius: 10,
                background:   hov ? C.surfaceEl : 'rgba(255,255,255,0.015)',
                border:       `1px solid ${hov ? C.borderEl : C.border}`,
                borderLeft:   `3px solid ${p.color}`,
                cursor:       p.onAction ? 'pointer' : 'default',
                transition:   'all .15s',
              }}
              onClick={p.onAction}
            >
              {/* Icon container */}
              <div style={{
                width:          30,
                height:         30,
                borderRadius:   8,
                background:     C.surfaceEl,
                border:         `1px solid ${C.border}`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
              }}>
                {p.icon && <p.icon style={{ width: 13, height: 13, color: p.color }} />}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, lineHeight: 1.3 }}>{p.title}</span>
                </div>
                <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>
                  {p.detail}
                </div>
                {p.impact && (
                  <div style={{
                    display:    'inline-flex',
                    alignItems: 'center',
                    gap:        4,
                    marginTop:  5,
                    fontSize:   10,
                    fontWeight: 600,
                    color:      p.color,
                    background: `${p.color}10`,
                    border:     `1px solid ${p.color}22`,
                    borderRadius: 5,
                    padding:    '2px 7px',
                  }}>
                    {p.impact}
                  </div>
                )}
              </div>

              {/* CTA */}
              {p.cta && (
                <button
                  onClick={(e) => { e.stopPropagation(); p.onAction?.(); }}
                  style={{
                    flexShrink:   0,
                    fontSize:     10.5,
                    fontWeight:   600,
                    color:        p.color,
                    background:   `${p.color}10`,
                    border:       `1px solid ${p.color}22`,
                    borderRadius: 7,
                    padding:      '5px 12px',
                    cursor:       'pointer',
                    fontFamily:   'inherit',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          4,
                    whiteSpace:   'nowrap',
                    transition:   'all .15s',
                  }}
                >
                  {p.cta} <ChevronRight style={{ width: 9, height: 9 }} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   AT-RISK MEMBER PREVIEW — expanded inline preview
══════════════════════════════════════════════════════════════════ */
function AtRiskPreview({ atRiskMembers = [], openModal, setTab, avatarMap = {} }) {
  if (!atRiskMembers || atRiskMembers.length === 0) return null;

  const shown = atRiskMembers.slice(0, 4);
  const remaining = atRiskMembers.length - shown.length;

  return (
    <div style={{
      padding:      20,
      borderRadius: CARD_RADIUS,
      background:   C.surface,
      border:       `1px solid ${C.border}`,
      boxShadow:    CARD_SHADOW,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 2 }}>
            At-Risk Members
          </div>
          <div style={{ fontSize: 11, color: C.t3 }}>No visit in 14+ days</div>
        </div>
        <button
          onClick={() => setTab('members')}
          style={{
            fontSize: 11, fontWeight: 500, color: C.t3,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit',
          }}
        >
          View all <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {shown.map((m, i) => {
          const daysSince = m.daysSinceVisit || 0;
          const riskLevel = daysSince >= 21 ? 'High' : 'Medium';
          const riskColor = daysSince >= 21 ? C.danger : C.warn;
          const displayName = m.name || m.full_name || 'Unknown';

          return (
            <div key={i} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              padding:      '9px 12px',
              borderRadius: 9,
              background:   C.surfaceEl,
              border:       `1px solid ${C.border}`,
            }}>
              <Avatar name={displayName} size={28} src={avatarMap?.[m.user_id] || null} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>
                  Last visit {daysSince} day{daysSince !== 1 ? 's' : ''} ago
                </div>
              </div>
              <span style={{
                fontSize:     9,
                fontWeight:   700,
                color:        riskColor,
                background:   `${riskColor}10`,
                border:       `1px solid ${riskColor}22`,
                borderRadius: 5,
                padding:      '2px 7px',
                flexShrink:   0,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}>
                {riskLevel}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); openModal?.('message', m); }}
                style={{
                  flexShrink: 0,
                  padding:    '4px 9px',
                  borderRadius: 6,
                  background: 'transparent',
                  border:     `1px solid ${C.borderEl}`,
                  color:      C.t2,
                  fontSize:   10,
                  fontWeight: 600,
                  cursor:     'pointer',
                  fontFamily: 'inherit',
                  display:    'flex',
                  alignItems: 'center',
                  gap:        3,
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.t1; e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.t2; e.currentTarget.style.borderColor = C.borderEl; }}
              >
                <Send style={{ width: 9, height: 9 }} /> Message
              </button>
            </div>
          );
        })}
      </div>

      {remaining > 0 && (
        <button
          onClick={() => setTab('members')}
          style={{
            marginTop:    8,
            width:        '100%',
            padding:      '7px 10px',
            borderRadius: 8,
            background:   C.surfaceEl,
            border:       `1px solid ${C.borderEl}`,
            color:        C.t2,
            fontSize:     11,
            fontWeight:   600,
            cursor:       'pointer',
            fontFamily:   'inherit',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            gap:          4,
            transition:   'color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.t1}
          onMouseLeave={e => e.currentTarget.style.color = C.t2}
        >
          +{remaining} more at-risk member{remaining !== 1 ? 's' : ''} <ChevronRight style={{ width: 10, height: 10 }} />
        </button>
      )}

      <StatNudge color={C.danger} icon={Heart}
        stat="Direct outreach works."
        detail="A personal message is the most effective way to bring back lapsed members — members who receive one are significantly more likely to return."
        action="Send messages" onAction={() => openModal?.('message')}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ACTION ITEMS (signals panel)
══════════════════════════════════════════════════════════════════ */
function TodayActions({ atRisk, checkIns, allMemberships, posts, challenges, now, openModal, setTab, newNoReturnCount = 0 }) {
  const signals = useMemo(() => {
    const items = [];
    if (newNoReturnCount > 0) {
      items.push({ priority: 1, color: C.danger, icon: UserPlus, title: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''} haven't returned`, detail: 'Joined 1–2 weeks ago, no second visit yet. Week-1 follow-up has the highest retention impact.', action: 'Follow up', fn: () => openModal('message') });
    }
    if (atRisk > 0) {
      const pct = allMemberships.length > 0 ? Math.round((atRisk / allMemberships.length) * 100) : 0;
      items.push({ priority: 2, color: atRisk >= 5 ? C.danger : C.warn, icon: AlertTriangle, title: `${atRisk} member${atRisk > 1 ? 's' : ''} inactive for 14+ days`, detail: `${pct}% of your gym. Direct outreach is the most effective re-engagement method.`, action: 'View & message', fn: () => setTab('members') });
    }
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      items.push({ priority: 3, color: C.warn, icon: Trophy, title: 'No active challenge', detail: 'Members with an active goal tend to visit more consistently — give them something to compete for.', action: 'Create one', fn: () => openModal('challenge') });
    }
    const recentPost = (posts || []).find(p => differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 7);
    if (!recentPost) {
      const daysSince = posts?.length > 0 ? differenceInDays(now, new Date(posts[0].created_at || posts[0].created_date || now)) : null;
      items.push({ priority: 4, color: C.warn, icon: MessageSquarePlus, title: daysSince ? `No post in ${daysSince} days` : 'No community posts yet', detail: 'Regular posts lift engagement scores. Try a motivational post or a poll.', action: 'Post now', fn: () => openModal('post') });
    }
    const todayCount = checkIns.filter(c => {
      const d = new Date(c.check_in_date), t = now;
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    if (todayCount === 0 && now.getHours() >= 10) {
      items.push({ priority: 5, color: C.warn, icon: QrCode, title: 'No check-ins recorded today', detail: 'Check-ins usually start arriving by 9–10am. Scanner issue?', action: 'Check scanner', fn: () => openModal('qrScanner') });
    }
    const dayOfWeek = now.getDay();
    if ((dayOfWeek === 4 || dayOfWeek === 5) && !recentPost) {
      items.push({ priority: 6, color: C.warn, icon: Calendar, title: 'Thursday/Friday — prime time to promote weekend classes', detail: 'Promoting weekend classes on Thursday or Friday gives members time to plan ahead.', action: 'Post promo', fn: () => openModal('post') });
    }
    const recentPoll = (posts || []).find(p => (p.type === 'poll' || p.category === 'poll') && differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 14);
    if (!recentPoll && allMemberships.length >= 5) {
      items.push({ priority: 7, color: C.warn, icon: BarChart2, title: 'No poll in the last 2 weeks', detail: 'Polls invite participation and show members their opinion counts.', action: 'Run a poll', fn: () => openModal('poll') });
    }
    return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [atRisk, checkIns, allMemberships, posts, challenges, now]);

  const positives = useMemo(() => {
    const items = [];
    if (atRisk === 0) items.push('All members active');
    if ((challenges || []).some(c => !c.ended_at)) items.push('Active challenge running');
    return items.slice(0, 2);
  }, [atRisk, challenges]);

  const urgentCount = signals.filter(s => s.color === C.danger).length;

  return (
    <div style={{
      padding:      20,
      borderRadius: CARD_RADIUS,
      background:   C.surface,
      border:       `1px solid ${C.border}`,
      boxShadow:    CARD_SHADOW,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>Action Items</div>
        {signals.length > 0 && (
          <span style={{
            fontSize:     10,
            fontWeight:   700,
            color:        urgentCount > 0 ? C.danger : C.t3,
            background:   urgentCount > 0 ? C.dangerSub : 'transparent',
            border:       `1px solid ${urgentCount > 0 ? C.dangerBrd : C.border}`,
            borderRadius: 6,
            padding:      '1px 7px',
          }}>
            {signals.length} pending
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>Sorted by urgency</div>

      {signals.length === 0 ? (
        <div style={{
          padding:      '11px 13px',
          borderRadius: 9,
          background:   C.surfaceEl,
          border:       `1px solid ${C.border}`,
          borderLeft:   `3px solid ${C.success}`,
          display:      'flex',
          alignItems:   'center',
          gap:          8,
        }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>All clear today</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>No immediate actions needed</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {signals.map((s, i) => (
            <Signal key={i} color={s.color} icon={s.icon} title={s.title} detail={s.detail} action={s.action} onAction={s.fn} last={i === signals.length - 1} />
          ))}
        </div>
      )}

      {positives.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
          {positives.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < positives.length - 1 ? 4 : 0 }}>
              <CheckCircle style={{ width: 10, height: 10, color: C.success, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.success }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RETENTION BREAKDOWN
══════════════════════════════════════════════════════════════════ */
function RetentionBreakdown({ retentionBreakdown: risks = {}, setTab }) {
  const computed = {
    week1:     risks.week1     || 0,
    week2to4:  risks.week2to4  || 0,
    month2to3: risks.month2to3 || 0,
    beyond:    risks.beyond    || 0,
  };
  const rows = [
    { label: 'New — went quiet', sub: 'Joined < 2 wks, no return', val: computed.week1,     urgentColor: C.danger },
    { label: 'Early drop-off',   sub: 'Weeks 2–4 inactivity',      val: computed.week2to4,  urgentColor: C.warn   },
    { label: 'Month 2–3 slip',   sub: 'Common churn window',       val: computed.month2to3, urgentColor: C.warn   },
    { label: 'Long inactive',    sub: '21+ days absent',           val: computed.beyond,    urgentColor: C.t3     },
  ];
  const total = rows.reduce((s, r) => s + r.val, 0);

  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 2 }}>Drop-off Risk</div>
          <div style={{ fontSize: 11, color: C.t3 }}>Where members go quiet</div>
        </div>
        <button onClick={() => setTab && setTab('members')} style={{ fontSize: 11, fontWeight: 500, color: C.t3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
          View all <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {total === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.success}` }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t2 }}>No drop-off risks detected</span>
        </div>
      ) : rows.map((r, i) => (
        <div key={i} style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '8px 0',
          borderBottom:   i < rows.length - 1 ? `1px solid ${C.divider}` : 'none',
        }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 500, color: r.val > 0 ? C.t1 : C.t3 }}>{r.label}</span>
            <span style={{ fontSize: 10, color: C.t3, marginLeft: 7 }}>{r.sub}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: r.val > 0 ? r.urgentColor : C.t4 }}>{r.val}</span>
        </div>
      ))}

      {computed.week1 > 0 && (
        <StatNudge color={C.danger} icon={AlertTriangle}
          stat={`${computed.week1} new member${computed.week1 > 1 ? 's' : ''} went quiet immediately.`}
          detail="The first 7 days are critical — members who don't return in week 1 are far less likely to become regulars."
          action="Follow up" onAction={() => setTab && setTab('members')} />
      )}
      {computed.week1 === 0 && total > 0 && (
        <StatNudge color={C.success} icon={CheckCircle}
          stat="No immediate drop-offs."
          detail="Keep it up — the month 2–3 window is the next common drop-off point to watch." />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   WEEK-1 RETURN RATE
══════════════════════════════════════════════════════════════════ */
function WeekOneReturn({ week1ReturnRate = {}, openModal }) {
  const { returned = 0, didnt = 0, names = [] } = week1ReturnRate;
  const total    = returned + didnt;
  const pct      = total > 0 ? Math.round((returned / total) * 100) : 0;
  const pctColor = total === 0 ? C.t3 : pct >= 60 ? C.success : pct >= 40 ? C.t1 : C.danger;

  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 2 }}>Week-1 Return Rate</div>
          <div style={{ fontSize: 11, color: C.t3 }}>New members, joined 1–3 weeks ago</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: pctColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {total === 0 ? '—' : `${pct}%`}
        </div>
      </div>

      {total === 0 ? (
        <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>No members in the 1–3 week window yet.</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { count: returned, label: 'Came back',    color: returned > 0 ? C.success : C.t4 },
              { count: didnt,    label: "Didn't return", color: didnt > 0    ? C.danger  : C.t4 },
            ].map((cell, i) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: cell.color, letterSpacing: '-0.03em' }}>{cell.count}</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{cell.label}</div>
              </div>
            ))}
          </div>

          {didnt > 0 && names.length > 0 && (
            <div style={{ marginBottom: 0, padding: '9px 11px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.danger}` }}>
              <div style={{ fontSize: 11, color: C.t2, marginBottom: 5, lineHeight: 1.5 }}>
                {names.join(', ')}{didnt > 3 ? ` +${didnt - 3} more` : ''} — no return visit yet
              </div>
              <button onClick={() => openModal('message')} style={{ fontSize: 11, fontWeight: 600, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                Send follow-up <ChevronRight style={{ width: 10, height: 10 }} />
              </button>
            </div>
          )}

          <StatNudge
            color={pct >= 60 ? C.success : C.danger}
            icon={pct >= 60 ? CheckCircle : AlertTriangle}
            stat={pct >= 60 ? 'Strong week-1 retention.' : 'Week-1 follow-ups work.'}
            detail={pct >= 60
              ? 'Members who return in week 1 are significantly more likely to become long-term regulars.'
              : 'A personal message in the first week is the single highest-impact action for week-1 retention.'
            }
            action={didnt > 0 ? 'Message now' : undefined}
            onAction={didnt > 0 ? () => openModal('message') : undefined}
          />
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ENGAGEMENT BREAKDOWN
══════════════════════════════════════════════════════════════════ */
function EngagementBreakdown({ monthCiPer, totalMembers, atRisk, setTab }) {
  const rows = [
    { label: 'Super active', sub: '12+ visits/mo', val: (monthCiPer || []).filter(v => v >= 12).length,          dotColor: C.success },
    { label: 'Active',       sub: '4–11 visits',   val: (monthCiPer || []).filter(v => v >= 4 && v < 12).length, dotColor: C.accent },
    { label: 'Occasional',   sub: '1–3 visits',    val: (monthCiPer || []).filter(v => v >= 1 && v < 4).length,  dotColor: C.accent },
    { label: 'At risk',      sub: '14+ days away', val: atRisk,                                                   dotColor: C.danger },
  ];

  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>Engagement Split</div>
        <button onClick={() => setTab('members')} style={{ fontSize: 11, fontWeight: 500, color: C.t3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
          Members <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {rows.map((r, i) => {
        const pct = totalMembers > 0 ? Math.round((r.val / totalMembers) * 100) : 0;
        return (
          <div key={i} style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            padding:      '8px 0',
            borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : 'none',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: r.val > 0 ? r.dotColor : C.t4, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: r.val > 0 ? C.t1 : C.t3, flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 11, color: C.t3, marginRight: 8 }}>{r.sub}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: r.val > 0 ? r.dotColor : C.t4, minWidth: 20, textAlign: 'right' }}>{r.val}</span>
            <span style={{ fontSize: 10, color: C.t3, minWidth: 26, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      })}

      {atRisk > 0 && (
        <StatNudge color={C.danger} icon={AlertTriangle}
          stat={`${atRisk} member${atRisk > 1 ? 's' : ''} at risk.`}
          detail="Early outreach is most effective — the longer a lapsed member waits, the harder it is to re-engage."
          action="View members" onAction={() => setTab('members')} />
      )}
      {atRisk === 0 && totalMembers >= 5 && (
        <StatNudge color={C.success} icon={CheckCircle}
          stat="All members active."
          detail="Active gyms maintain this by running a challenge every 6–8 weeks." />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RECENT ACTIVITY FEED
══════════════════════════════════════════════════════════════════ */
function ActivityFeed({ recentActivity, now, avatarMap, nameMap = {} }) {
  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 16 }}>Recent Activity</div>
      {!recentActivity || recentActivity.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Activity style={{ width: 18, height: 18, color: C.t3, margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontSize: 12, color: C.t3, margin: '0 0 3px', fontWeight: 500 }}>No activity yet today</p>
          <p style={{ fontSize: 11, color: C.t3, margin: 0, opacity: 0.7 }}>Typical peak is 5–7pm</p>
        </div>
      ) : recentActivity.slice(0, 6).map((a, i) => {
        const displayName = nameMap[a.user_id] || a.name;
        const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
        const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` : `${Math.floor(minsAgo / 1440)}d ago`;
        return (
          <div key={i} style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            padding:      '8px 0',
            borderBottom: i < Math.min(recentActivity.length, 6) - 1 ? `1px solid ${C.divider}` : 'none',
          }}>
            <Avatar name={displayName} size={26} src={avatarMap?.[a.user_id] || null} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.t1, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>{displayName}</span>
                <span style={{ color: C.t2 }}> {a.action}</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>{timeStr}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBER GROWTH CARD (no revenue)
══════════════════════════════════════════════════════════════════ */
function MemberGrowthCard({ newSignUps, cancelledEst, retentionRate, monthGrowthData }) {
  const hasEnoughData = (monthGrowthData || []).filter(d => d.value > 0).length >= 2;
  const net           = newSignUps - cancelledEst;
  const netColor      = net < 0 ? C.danger : C.t1;
  const retColor      = retentionRate >= 70 ? C.success : retentionRate < 50 ? C.danger : C.t2;

  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 4 }}>Member Growth</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: C.t1, letterSpacing: '-0.04em' }}>
              {newSignUps > 0 ? `+${newSignUps}` : newSignUps}
            </span>
            <span style={{ fontSize: 12, color: C.t3 }}>this month</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{
            padding:      '3px 9px',
            borderRadius: 6,
            background:   retentionRate >= 70 ? C.successSub : C.surfaceEl,
            border:       `1px solid ${retentionRate >= 70 ? C.successBrd : C.border}`,
            fontSize:     11,
            fontWeight:   600,
            color:        retColor,
          }}>
            {retentionRate}% retained
          </div>
          {cancelledEst > 0 && (
            <div style={{ padding: '3px 9px', borderRadius: 6, background: C.dangerSub, border: `1px solid ${C.dangerBrd}`, fontSize: 11, fontWeight: 600, color: C.danger }}>
              {cancelledEst} left
            </div>
          )}
        </div>
      </div>

      {hasEnoughData ? (
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={monthGrowthData} barSize={18} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
            <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip content={<Tip unit=" members" />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" fill={C.accent} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: C.surfaceEl, gap: 5 }}>
          <div style={{ fontSize: 12, color: C.t3 }}>Chart populates as data grows</div>
          <div style={{ fontSize: 11, color: C.t3, opacity: 0.7 }}>Check back next month for trends</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.divider}` }}>
        {[
          { label: 'New',       value: newSignUps,   color: newSignUps > 0 ? C.success : C.t1 },
          { label: 'Cancelled', value: cancelledEst, color: cancelledEst > 0 ? C.danger : C.t4 },
          { label: 'Net',       value: `${net >= 0 ? '+' : ''}${net}`, color: netColor },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {retentionRate < 70 ? (
        <StatNudge color={C.danger} icon={TrendingDown}
          stat={`${retentionRate}% retention — below the 70% healthy threshold.`}
          detail="70% is the healthy baseline. The highest-impact habit: personally welcoming every new member in their first week." />
      ) : cancelledEst > newSignUps ? (
        <StatNudge color={C.danger} icon={AlertTriangle}
          stat="More cancellations than sign-ups this month."
          detail="Run a referral incentive or re-engagement challenge to reverse the trend." />
      ) : newSignUps > 0 ? (
        <StatNudge color={C.success} icon={TrendingUp}
          stat={`+${newSignUps} new member${newSignUps > 1 ? 's' : ''} this month.`}
          detail="Early habit formation matters — new members who visit frequently in their first weeks are far more likely to stick." />
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CHECK-IN ACTIVITY CHART
══════════════════════════════════════════════════════════════════ */
function CheckInChart({ chartDays, chartRange, setChartRange, now, activeThisWeek }) {
  const todayLabel = format(now, chartRange <= 7 ? 'EEE' : 'MMM d');

  const weeklyAvg = useMemo(() => {
    if (!chartDays?.length) return 0;
    const vals = chartDays.map(d => d.value);
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [chartDays]);

  const todayVal = (chartDays || []).find(d => d.day === todayLabel)?.value ?? 0;
  const chartMax = Math.max(...(chartDays || []).map(d => d.value), 1);

  // Detect if today is lowest this week
  const weekVals = (chartDays || []).map(d => d.value);
  const isLowest = todayVal > 0 && weekVals.length > 1 && todayVal <= Math.min(...weekVals.filter(v => v > 0));
  const isHighest = todayVal > 0 && weekVals.length > 1 && todayVal >= Math.max(...weekVals);

  const peakHour = now.getHours() >= 17 && now.getHours() <= 19;
  const RANGES   = [{ val: 7, label: '7D' }, { val: 30, label: '30D' }];

  return (
    <div style={{ padding: '20px 20px 16px', borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>Check-in Activity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, color: C.t3 }}>
              Daily avg <span style={{ fontWeight: 600, color: C.t2 }}>{weeklyAvg}</span>
            </div>
            {todayVal > 0 && (
              <>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.t4 }} />
                <div style={{ fontSize: 11, color: C.t3 }}>
                  Today <span style={{ fontWeight: 600, color: C.accent }}>{todayVal}</span>
                </div>
              </>
            )}
            {peakHour && (
              <>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.t4 }} />
                <div style={{ fontSize: 10, color: C.warn, fontWeight: 500 }}>Peak activity 5–7pm</div>
              </>
            )}
            {todayVal === 0 && now.getHours() < 10 && (
              <div style={{ fontSize: 10, color: C.t3, fontStyle: 'italic' }}>Peak usually 5–7pm</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map(r => (
            <button key={r.val} onClick={() => setChartRange(r.val)} style={{
              fontSize:     11,
              fontWeight:   chartRange === r.val ? 700 : 400,
              padding:      '4px 12px',
              borderRadius: 7,
              cursor:       'pointer',
              background:   chartRange === r.val ? C.accentSub : 'rgba(255,255,255,0.03)',
              color:        chartRange === r.val ? C.accent : C.t3,
              border:       `1px solid ${chartRange === r.val ? C.accentBrd : C.border}`,
              fontFamily:   'inherit',
              transition:   'all .15s',
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={184}>
        <BarChart data={chartDays || []} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barSize={chartRange <= 7 ? 20 : 8}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
          <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false} interval={chartRange <= 7 ? 0 : 4} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={28} allowDecimals={false} domain={[0, Math.max(chartMax + 1, 5)]} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const isToday = label === todayLabel;
              const val     = payload[0].value;
              const avg     = parseFloat(weeklyAvg);
              const vsAvg   = avg > 0 ? Math.round(((val - avg) / avg) * 100) : 0;
              return (
                <div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 9, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 120 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? C.accent : C.t3, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {isToday ? 'Today' : label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', marginBottom: 3 }}>
                    {val} <span style={{ fontSize: 10, fontWeight: 400, color: C.t3 }}>check-ins</span>
                  </div>
                  {avg > 0 && val > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {vsAvg >= 0
                        ? <TrendingUp style={{ width: 9, height: 9, color: C.success }} />
                        : <TrendingDown style={{ width: 9, height: 9, color: C.danger }} />
                      }
                      <span style={{ fontSize: 10, fontWeight: 600, color: vsAvg >= 0 ? C.success : C.danger }}>
                        {vsAvg >= 0 ? '+' : ''}{vsAvg}% vs avg
                      </span>
                    </div>
                  )}
                  {val === 0 && now.getHours() < 18 && isToday && (
                    <div style={{ fontSize: 10, color: C.t3 }}>Peak hours: 5–7pm</div>
                  )}
                </div>
              );
            }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {(chartDays || []).map((entry, i) => (
              <Cell key={i} fill={C.accent} fillOpacity={entry.day === todayLabel ? 0.85 : 0.3} />
            ))}
          </Bar>
          {parseFloat(weeklyAvg) > 0 && (
            <ReferenceLine
              y={parseFloat(weeklyAvg)}
              stroke={C.t4}
              strokeDasharray="4 4"
              label={{ value: `avg ${weeklyAvg}`, position: 'insideTopRight', fill: C.t3, fontSize: 9, fontFamily: 'inherit' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend + dynamic insight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.divider}`, flexWrap: 'wrap' }}>
        {[
          { op: 0.85, label: 'Today' },
          { op: 0.30, label: 'Past days' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: C.accent, opacity: l.op }} />
            <span style={{ fontSize: 10, color: C.t3 }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 1, borderTop: `2px dashed ${C.t4}` }} />
          <span style={{ fontSize: 10, color: C.t3 }}>Daily avg</span>
        </div>
      </div>

      {/* Dynamic insight below chart */}
      {isLowest && todayVal > 0 && (
        <StatNudge color={C.warn} icon={TrendingDown}
          stat="Lowest day this week."
          detail="Consider sending a reminder or posting a motivational update to boost tomorrow's attendance." />
      )}
      {isHighest && todayVal > 2 && (
        <StatNudge color={C.success} icon={TrendingUp}
          stat="Best day this week!"
          detail="Great momentum — capitalize on it with a community post celebrating the energy." />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   QUICK ACTIONS GRID
══════════════════════════════════════════════════════════════════ */
function QuickActionsGrid({ openModal }) {
  const actions = [
    { icon: Trophy,            label: 'New Challenge', color: C.accent, fn: () => openModal('challenge') },
    { icon: Calendar,          label: 'New Event',     color: C.accent, fn: () => openModal('event')     },
    { icon: MessageSquarePlus, label: 'Post Update',   color: C.accent, fn: () => openModal('post')      },
    { icon: Pencil,            label: 'New Poll',      color: C.accent, fn: () => openModal('poll')      },
  ];

  return (
    <div style={{ padding: 20, borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 14 }}>Quick Actions</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {actions.map(({ icon: Icon, label, color, fn }, i) => (
          <QuickActionButton key={i} icon={Icon} label={label} color={color} onClick={fn} />
        ))}
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display:      'flex',
      alignItems:   'center',
      gap:          8,
      padding:      '8px 10px',
      borderRadius: 8,
      background:   hov ? C.surfaceEl : 'rgba(255,255,255,0.025)',
      border:       `1px solid ${hov ? C.borderEl : C.border}`,
      cursor:       'pointer',
      transition:   'all .15s',
      fontFamily:   'inherit',
    }}>
      <Icon style={{ width: 13, height: 13, color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: hov ? C.t1 : C.t2, transition: 'color .15s' }}>{label}</span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   GREETING HEADER
══════════════════════════════════════════════════════════════════ */
function GreetingHeader({ now, selectedGym, ownerName }) {
  const greeting = getGreeting(now.getHours());
  const name = ownerName || selectedGym?.owner_name || '';
  const dateStr = format(now, 'EEEE, MMMM d');

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <greeting.icon style={{ width: 16, height: 16, color: C.warn, opacity: 0.7 }} />
        <span style={{ fontSize: 11, fontWeight: 500, color: C.t3, letterSpacing: '.02em' }}>{dateStr}</span>
      </div>
      <h1 style={{
        fontSize:      22,
        fontWeight:    700,
        color:         C.t1,
        margin:        0,
        letterSpacing: '-0.02em',
        lineHeight:    1.3,
      }}>
        {greeting.text}{name ? `, ${name}` : ''} <span style={{ fontWeight: 400, color: C.t2 }}>— here's what to focus on today</span>
      </h1>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════ */
export default function TabOverview({
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate,
  newSignUps, monthChangePct, ciPrev30, atRisk, sparkData, monthGrowthData,
  cancelledEst, monthCiPer,
  checkIns, allMemberships, challenges, posts, polls, classes, coaches,
  recentActivity, chartDays, chartRange, setChartRange, avatarMap, nameMap = {},
  priorities, selectedGym, now,
  openModal, setTab,
  retentionBreakdown = {}, week1ReturnRate = {}, newNoReturnCount = 0,
  atRiskMembers = [], ownerName,
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const inGymNow = checkIns.filter(c => {
    const diff = (now - new Date(c.check_in_date)) / 60000;
    return diff >= 0 && diff <= 120;
  }).length;

  /* ── Build priority actions dynamically ── */
  const computedPriorities = useMemo(() => {
    if (priorities && priorities.length > 0) return priorities;

    const items = [];

    // 1. At-risk members
    if (atRisk > 0) {
      items.push({
        color:    C.danger,
        icon:     Heart,
        title:    `Message ${atRisk} at-risk member${atRisk > 1 ? 's' : ''}`,
        detail:   `${atRisk} member${atRisk > 1 ? 's haven\'t' : ' hasn\'t'} visited in 14+ days. Personal outreach is the most effective retention tool.`,
        impact:   `Could retain ${atRisk} member${atRisk > 1 ? 's' : ''}`,
        cta:      'Send messages',
        onAction: () => setTab('members'),
      });
    }

    // 2. New members not returning
    if (newNoReturnCount > 0) {
      items.push({
        color:    C.danger,
        icon:     UserPlus,
        title:    `Follow up with ${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''}`,
        detail:   'Joined recently but haven\'t returned. Week-1 follow-ups have the highest retention impact.',
        impact:   'Highest retention impact',
        cta:      'Follow up',
        onAction: () => openModal('message'),
      });
    }

    // 3. No-shows today
    const todayCount = checkIns.filter(c => {
      const d = new Date(c.check_in_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    }).length;
    if (todayCount === 0 && now.getHours() >= 10) {
      items.push({
        color:    C.warn,
        icon:     Clock,
        title:    'Remind today\'s no-shows',
        detail:   'No check-ins recorded yet today. A quick reminder can boost this week\'s attendance.',
        impact:   'Boost this week\'s check-ins',
        cta:      'Send reminder',
        onAction: () => openModal('message'),
      });
    }

    // 4. No active challenge
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge && totalMembers >= 3) {
      items.push({
        color:    C.warn,
        icon:     Trophy,
        title:    'Launch a challenge',
        detail:   'No active challenge running. Members with goals visit more consistently.',
        impact:   'Boost weekly visits',
        cta:      'Create challenge',
        onAction: () => openModal('challenge'),
      });
    }

    // 5. Community engagement
    const recentPost = (posts || []).find(p => differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 7);
    if (!recentPost) {
      items.push({
        color:    C.accent,
        icon:     MessageSquarePlus,
        title:    'Post a community update',
        detail:   'Regular posts lift engagement. Try a motivational post, poll, or class promo.',
        impact:   'Improve engagement',
        cta:      'Post now',
        onAction: () => openModal('post'),
      });
    }

    return items.slice(0, 5);
  }, [atRisk, newNoReturnCount, checkIns, challenges, posts, totalMembers, now, priorities]);

  const ciSub = useMemo(() => {
    if (yesterdayCI === 0) return todayCI > 0 ? 'No data for yesterday' : 'No check-ins yet today';
    if (todayVsYest > 0)  return `↑ ${todayVsYest}% vs yesterday`;
    if (todayVsYest < 0)  return `↓ ${Math.abs(todayVsYest)}% vs yesterday`;
    return 'Same as yesterday';
  }, [todayCI, yesterdayCI, todayVsYest]);

  const weeklyAvgCI = useMemo(() => {
    if (!chartDays?.length) return null;
    return (chartDays.reduce((a, b) => a + b.value, 0) / chartDays.length).toFixed(1);
  }, [chartDays]);

  // Detect if today is lowest/highest this week for insight
  const weekVals = (chartDays || []).map(d => d.value).filter(v => v > 0);
  const todayIsLowest = todayCI > 0 && weekVals.length > 1 && todayCI <= Math.min(...weekVals);
  const todayIsAboveAvg = weeklyAvgCI && todayCI > parseFloat(weeklyAvgCI);

  const ciTrend  = yesterdayCI > 0 && todayVsYest > 0 ? 'up' : yesterdayCI > 0 && todayVsYest < 0 ? 'down' : null;
  const showRing = retentionRate > 5 && retentionRate < 98;

  // Dynamic insight for check-in KPI
  const ciInsight = useMemo(() => {
    if (todayIsLowest) return 'Lowest this week — consider sending a reminder';
    if (todayIsAboveAvg) return 'Above average — great momentum today';
    if (todayCI === 0 && now.getHours() < 10) return 'Mornings are usually quiet — peak at 5–7pm';
    return null;
  }, [todayCI, todayIsLowest, todayIsAboveAvg, now]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── GREETING HEADER ── */}
      <GreetingHeader now={now} selectedGym={selectedGym} ownerName={ownerName} />

      {/* ── PRIORITY ACTION PANEL (top center — most important) ── */}
      <PriorityActionPanel priorities={computedPriorities} now={now} />

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 292px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
            <KpiCard
              label="Today's Check-ins"
              value={todayCI}
              sub={ciSub}
              subTrend={ciTrend}
              subContext={weeklyAvgCI ? `Avg: ${weeklyAvgCI}/day` : undefined}
              sparkData={sparkData}
              icon={Activity}
              insight={ciInsight}
              cta={todayCI === 0 && now.getHours() >= 10 ? 'Send reminder' : undefined}
              onCta={todayCI === 0 && now.getHours() >= 10 ? () => openModal('message') : undefined}
            />
            <KpiCard
              label="Active This Week"
              value={activeThisWeek}
              valueSuffix={`of ${totalMembers}`}
              sub={`${retentionRate}% retention`}
              subTrend={retentionRate >= 70 ? 'up' : retentionRate < 50 ? 'down' : null}
              subContext={retentionRate < 60 ? 'Below 70% target' : retentionRate >= 80 ? 'Top 20% — excellent' : retentionRate >= 70 ? 'Steady' : undefined}
              ring={showRing ? retentionRate : null}
              ringColor={retentionRate >= 70 ? C.success : retentionRate >= 50 ? C.warn : C.danger}
              sparkData={!showRing ? sparkData : null}
              icon={Users}
            />
            <KpiCard
              label="Current In Gym"
              value={inGymNow}
              sub={inGymNow === 0
                ? (now.getHours() < 10 ? 'Early — peak at 5–7pm' : now.getHours() < 17 ? 'Quiet midday period' : 'No recent check-ins')
                : `${inGymNow === 1 ? 'Member' : 'Members'} in last 2h`}
              subTrend={inGymNow > 0 ? 'up' : null}
              sparkData={sparkData}
              icon={Users}
              insight={now.getHours() >= 17 && now.getHours() <= 19 ? 'Peak hours right now' : null}
            />
            <KpiCard
              label="At-Risk Members"
              value={atRisk}
              sub={atRisk > 0
                ? `${Math.round((atRisk / Math.max(totalMembers, 1)) * 100)}% of gym inactive`
                : 'All members active'}
              subTrend={atRisk > 0 ? 'down' : 'up'}
              subContext={atRisk > 0 ? '14+ days without a visit' : undefined}
              sparkData={sparkData}
              icon={Zap}
              valueColor={atRisk > 0 ? C.danger : undefined}
              cta={atRisk > 0 ? 'View & message' : undefined}
              onCta={atRisk > 0 ? () => setTab('members') : undefined}
              insight={atRisk > 0 ? 'Direct outreach is the most effective method' : null}
            />
          </div>

          {/* At-Risk Member Preview (NEW — expanded inline) */}
          {atRisk > 0 && atRiskMembers && atRiskMembers.length > 0 && (
            <AtRiskPreview
              atRiskMembers={atRiskMembers}
              openModal={openModal}
              setTab={setTab}
              avatarMap={avatarMap}
            />
          )}

          <CheckInChart
            chartDays={chartDays}
            chartRange={chartRange}
            setChartRange={setChartRange}
            now={now}
            activeThisWeek={activeThisWeek}
          />

          <MemberGrowthCard
            newSignUps={newSignUps}
            cancelledEst={cancelledEst}
            retentionRate={retentionRate}
            monthGrowthData={monthGrowthData}
          />

          <EngagementBreakdown
            monthCiPer={monthCiPer}
            totalMembers={totalMembers}
            atRisk={atRisk}
            setTab={setTab}
          />

          <ActivityFeed
            recentActivity={recentActivity}
            now={now}
            avatarMap={avatarMap}
            nameMap={nameMap}
          />
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <TodayActions
            atRisk={atRisk}
            checkIns={checkIns}
            allMemberships={allMemberships}
            posts={posts}
            challenges={challenges}
            now={now}
            openModal={openModal}
            setTab={setTab}
            newNoReturnCount={newNoReturnCount}
          />
          <QuickActionsGrid openModal={openModal} />
          <RetentionBreakdown retentionBreakdown={retentionBreakdown} setTab={setTab} />
          <WeekOneReturn week1ReturnRate={week1ReturnRate} openModal={openModal} />
        </div>
      </div>
    </div>
  );
}
