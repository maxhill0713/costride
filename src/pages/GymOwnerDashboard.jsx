/**
 * TabOverview — Restyled to match TabEngagement card system
 *
 * WHAT CHANGED (tokens + card shell only — hierarchy rules preserved):
 *
 * TOKENS
 *   bg         #090e1a  → #080e18
 *   surface    #0d1525  → #0c1422
 *   surfaceEl  #111c2e  → #101929
 *   border     rgba(255,255,255,0.065) → rgba(255,255,255,0.07)
 *   borderEl   rgba(255,255,255,0.11)  → rgba(255,255,255,0.12)
 *   t1         #dde3ed  → #f1f5f9  (crisper white)
 *   t2         #7a8ea8  → #94a3b8
 *   t3         #3f5068  → #475569
 *   t4         #243040  → #2d3f55
 *   accent     #5179ff  → #3b82f6
 *   danger     #e0524a  → #ef4444
 *   success    #38b27a  → #10b981
 *   warn       #d4893a  → #f59e0b
 *
 * CARD SHELL (every surface container)
 *   borderRadius  12 → 14
 *   boxShadow  added: inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)
 *
 * All visual-hierarchy rules (Color = Meaning, left-border signals,
 * threshold-only color, neutral icon containers, flat fills) are unchanged.
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
  Clock, Flame, BarChart2, Shield,
} from 'lucide-react';
import { RingChart, Avatar } from './DashboardPrimitives';

import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

/* ── Axis tick — always muted ──────────────────────────────────── */
const tick = { fill: C.t3, fontSize: 10, fontFamily: 'inherit' };

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
   KPI CARD
   Color rule: value is always t1. Only trend badge gets semantic
   color. valueColor passed only when threshold is crossed.
══════════════════════════════════════════════════════════════════ */
function KpiCard({ label, value, valueSuffix, sub, subTrend, subContext, sparkData, ring, ringColor, icon: Icon, valueColor, cta, onCta }) {
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
   week1 only gets danger. Zero values are ghost.
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
   Both cells neutral. Numbers inside get semantic color at threshold.
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
   Strict 3-tier: success / t3 / danger. No other colors.
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
   MEMBER GROWTH CARD
   Net: t1. Negative net: danger. Bar: flat accent, no gradient.
   Retention badge: success only at ≥70% threshold.
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
   Today bar: flat accent at 0.85. Past: 0.3. Reference line: t4.
   Range toggles: neutral active tab.
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
  const RANGES   = [{ val: 7, label: '7D' }, { val: 30, label: '30D' }];

  return (
    <div style={{ padding: '20px 20px 16px', borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em' }}>Check-in Activity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
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
            {todayVal === 0 && now.getHours() < 10 && (
              <div style={{ fontSize: 10, color: C.t3, fontStyle: 'italic' }}>Peak usually 5–7pm</div>
            )}
          </div>
        </div>

        {/* Range toggle — neutral tab style matching TabEngagement button pattern */}
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

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
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
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   QUICK ACTIONS GRID
   All hover states: same surfaceEl + borderEl (no per-button color).
   Icon glyphs retain semantic color (small enough not to compete).
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

  const ciTrend  = yesterdayCI > 0 && todayVsYest > 0 ? 'up' : yesterdayCI > 0 && todayVsYest < 0 ? 'down' : null;
  const showRing = retentionRate > 5 && retentionRate < 98;

  const tabInitialised = React.useRef(false);
  useEffect(() => {
    if (!tabInitialised.current && currentUser) {
      setTab(isCoach ? 'today' : 'overview');
      tabInitialised.current = true;
    }
  }, [currentUser, isCoach]);

  useEffect(() => {
    const h = () => base44.auth.logout();
    document.addEventListener('dash-logout', h);
    return () => document.removeEventListener('dash-logout', h);
  }, []);

  // Handle coach quick actions from the top bar
  useEffect(() => {
    const h = (e) => {
      if (e.detail === 'addClient') {
        setTab('members');
        setTimeout(() => window.dispatchEvent(new CustomEvent('coachOpenAddClient')), 100);
      } else if (e.detail === 'bookClient') {
        openModal('classes');
      }
    };
    window.addEventListener('coachAction', h);
    return () => window.removeEventListener('coachAction', h);
  }, [openModal]);

  const handleRoleSelect = (roleId) => {
    if (roleId === 'gym_owner') {setSelectedCoachId(null);} else {setSelectedCoachId(roleId);}
    setTab(roleId === 'gym_owner' ? 'overview' : 'today');
  };

  const NAV = ALL_NAV.filter((item) => item.roles.includes(dashRole)).map((item) => ({
    ...item, label: isCoach && item.coachLabel ? item.coachLabel : item.label
  }));

  const { data: gyms = [], error: gymsError } = useQuery({
    queryKey: ['ownerGyms', currentUser?.email],
    queryFn: async () => {
      if (isCoach) {
        const coachRecords = await base44.entities.Coach.filter({ user_email: currentUser.email });
        if (!coachRecords.length) return [];
        const gymIds = [...new Set(coachRecords.map((c) => c.gym_id))];
        return base44.entities.Gym.filter({ id: { $in: gymIds } });
      }
      return base44.entities.Gym.filter({ owner_email: currentUser.email });
    },
    enabled: !!currentUser?.email, retry: 3, staleTime: 60 * 1000, refetchInterval: 60 * 1000, refetchIntervalInBackground: false
  });

  const myGyms = isCoach ? gyms : gyms.filter((g) => g.owner_email === currentUser?.email);
  const approvedGyms = myGyms.filter((g) => g.status === 'approved');
  const pendingGyms = isCoach ? [] : myGyms.filter((g) => g.status === 'pending');

  useEffect(() => {if (approvedGyms.length > 0 && !selectedGym) setSelectedGym(approvedGyms[0]);}, [approvedGyms, selectedGym]);

  const qo = { staleTime: 3 * 60 * 1000, placeholderData: (p) => p };
  const on = !!selectedGym;

  const { data: rewards = [] } = useQuery({ queryKey: ['rewards', selectedGym?.id], queryFn: () => base44.entities.Reward.filter({ gym_id: selectedGym.id }, 'title', 50), enabled: on, ...qo });
  const { data: classes = [] } = useQuery({ queryKey: ['classes', selectedGym?.id], queryFn: () => base44.entities.GymClass.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: coaches = [] } = useQuery({ queryKey: ['coaches', selectedGym?.id], queryFn: () => base44.entities.Coach.filter({ gym_id: selectedGym.id }), enabled: on, ...qo });
  const { data: events = [] } = useQuery({ queryKey: ['events', selectedGym?.id], queryFn: () => base44.entities.Event.filter({ gym_id: selectedGym.id }, '-event_date', 50), enabled: on, ...qo });
  const { data: posts = [] } = useQuery({ queryKey: ['posts', selectedGym?.id], queryFn: () => base44.entities.Post.filter({ gym_id: selectedGym.id }, '-created_date', 20), enabled: on, ...qo });
  const { data: challenges = [] } = useQuery({ queryKey: ['challenges', selectedGym?.id], queryFn: () => base44.entities.Challenge.filter({ gym_id: selectedGym.id }, '-created_date', 50), enabled: on, ...qo });
  const { data: polls = [] } = useQuery({ queryKey: ['polls', selectedGym?.id], queryFn: () => base44.entities.Poll.filter({ gym_id: selectedGym.id, status: 'active' }, '-created_date'), enabled: on, ...qo });

  const { data: coachBookings = [] } = useQuery({ queryKey: ['coachBookings', selectedGym?.id], queryFn: () => base44.entities.Booking.filter({ gym_id: selectedGym.id }, '-session_date', 300), enabled: on && isCoach, staleTime: 2 * 60 * 1000 });
  const { data: coachAssignedWorkouts = [] } = useQuery({
    queryKey: ['coachAssignedWorkouts', selectedGym?.id, selectedCoachId],
    queryFn: async () => {
      const coachList = await base44.entities.Coach.filter({ gym_id: selectedGym.id });
      const me = coachList.find((c) => selectedCoachId ? c.id === selectedCoachId : c.user_email === currentUser?.email);
      if (!me) return [];
      return base44.entities.AssignedWorkout.filter({ coach_id: me.id }, '-assigned_date', 300);
    },
    enabled: on && isCoach, staleTime: 2 * 60 * 1000
  });

  const { data: stats = {} } = useQuery({
    queryKey: ['dashboardStats', selectedGym?.id, atRiskDays, chartRange],
    queryFn: () => base44.functions.invoke('getDashboardStats', { gymId: selectedGym.id, atRiskDays, chartRange }).then((r) => r.data),
    enabled: on, staleTime: 3 * 60 * 1000, placeholderData: (p) => p
  });

  const checkIns = stats.recentCheckIns || [];
  const recentActivity = stats.recentActivity || [];
  const allMemberships = stats.membersWithActivity || [];
  const effectiveMemberships = allMemberships;

  const inv = useCallback((...keys) => {keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k, selectedGym?.id] }));queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedGym?.id] });}, [queryClient, selectedGym?.id]);
  const invGyms = useCallback(() => queryClient.invalidateQueries({ queryKey: ['gyms'] }), [queryClient]);
  const onErr = useCallback((e) => toast.error(e?.message || 'Something went wrong'), []);

  const createRewardM = useMutation({ mutationFn: (d) => base44.entities.Reward.create(d), onSuccess: () => inv('rewards'), onError: onErr });
  const deleteRewardM = useMutation({ mutationFn: (id) => base44.entities.Reward.delete(id), onSuccess: () => inv('rewards'), onError: onErr });
  const createClassM = useMutation({ mutationFn: (d) => base44.entities.GymClass.create(d), onSuccess: () => inv('classes'), onError: onErr });
  const deleteClassM = useMutation({ mutationFn: (id) => base44.entities.GymClass.delete(id), onSuccess: () => inv('classes'), onError: onErr });
  const updateClassM = useMutation({ mutationFn: ({ id, data }) => base44.entities.GymClass.update(id, data), onSuccess: () => inv('classes'), onError: onErr });
  const createCoachM = useMutation({ mutationFn: (d) => base44.entities.Coach.create(d), onSuccess: () => inv('coaches'), onError: onErr });
  const deleteCoachM = useMutation({ mutationFn: (id) => base44.entities.Coach.delete(id), onSuccess: () => inv('coaches'), onError: onErr });
  const updateCoachM = useMutation({ mutationFn: ({ id, data }) => base44.entities.Coach.update(id, data), onSuccess: () => inv('coaches'), onError: onErr });
  const updateGalleryM = useMutation({ mutationFn: (g) => base44.entities.Gym.update(selectedGym.id, { gallery: g }), onSuccess: () => {invGyms();closeModal();}, onError: onErr });
  const updateGymM = useMutation({ mutationFn: (d) => base44.entities.Gym.update(selectedGym.id, d), onSuccess: () => {invGyms();closeModal();}, onError: onErr });
  const createEventM = useMutation({ mutationFn: (d) => base44.entities.Event.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, attendees: 0 }), onSuccess: () => {inv('events');closeModal();}, onError: onErr });
  const updateEventM = useMutation({ mutationFn: ({ id, ...d }) => base44.entities.Event.update(id, d), onSuccess: () => {inv('events');closeModal();}, onError: onErr });
  const createChallengeM = useMutation({ mutationFn: (d) => base44.entities.Challenge.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, participants: [], status: 'upcoming' }), onSuccess: () => {inv('challenges');closeModal();}, onError: onErr });
  const banMemberM = useMutation({ mutationFn: (uid) => base44.functions.invoke('manageMember', { memberId: uid, gymId: selectedGym.id, action: 'ban' }), onSuccess: invGyms, onError: onErr });
  const unbanMemberM = useMutation({ mutationFn: (uid) => base44.functions.invoke('manageMember', { memberId: uid, gymId: selectedGym.id, action: 'unban' }), onSuccess: invGyms, onError: onErr });
  const deleteGymM = useMutation({ mutationFn: () => base44.functions.invoke('deleteGym', { gymId: selectedGym.id }), onSuccess: () => {invGyms();closeModal();window.location.href = createPageUrl('Gyms');}, onError: onErr });
  const deleteAccountM = useMutation({ mutationFn: () => base44.functions.invoke('deleteUserAccount'), onSuccess: () => {closeModal();base44.auth.logout();}, onError: onErr });
  const createPollM = useMutation({ mutationFn: (d) => base44.entities.Poll.create({ ...d, gym_id: selectedGym.id, gym_name: selectedGym.name, created_by: currentUser.id, voters: [] }), onSuccess: () => {inv('polls');closeModal();}, onError: onErr });
  const deletePostM = useMutation({ mutationFn: (id) => base44.entities.Post.delete(id), onSuccess: () => inv('posts'), onError: onErr });
  const deleteEventM = useMutation({ mutationFn: (id) => base44.entities.Event.delete(id), onSuccess: () => inv('events'), onError: onErr });
  const deleteChallengeM = useMutation({ mutationFn: (id) => base44.entities.Challenge.delete(id), onSuccess: () => inv('challenges'), onError: onErr });
  const deletePollM = useMutation({ mutationFn: (id) => base44.entities.Poll.delete(id), onSuccess: () => inv('polls'), onError: onErr });

  const now = new Date();

  const memberUserIds = useMemo(() => {
    const ids = new Set();
    (allMemberships || []).forEach((m) => {if (m.user_id) ids.add(m.user_id);});
    checkIns.forEach((c) => {if (c.user_id) ids.add(c.user_id);});
    recentActivity.forEach((a) => {if (a.user_id) ids.add(a.user_id);});
    return [...ids].slice(0, 100);
  }, [allMemberships, checkIns, recentActivity]);

  const { data: memberUserRecords = [] } = useQuery({
    queryKey: ['memberUserRecords', selectedGym?.id, memberUserIds.join(',')],
    queryFn: () => base44.entities.User.filter({ id: { $in: memberUserIds } }),
    enabled: !!selectedGym && memberUserIds.length > 0,
    staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000
  });

  const memberAvatarMapResolved = useMemo(() => {
    const map = {};
    (allMemberships || []).forEach((m) => {if (m.user_id && m.avatar_url) map[m.user_id] = m.avatar_url;});
    memberUserRecords.forEach((u) => {if (u.id && u.avatar_url) map[u.id] = u.avatar_url;});
    if (currentUser?.id && currentUser.avatar_url) map[currentUser.id] = currentUser.avatar_url;
    return map;
  }, [allMemberships, memberUserRecords, currentUser]);

  const memberNameMap = useMemo(() => {
    const map = {};
    (allMemberships || []).forEach((m) => {if (m.user_id && m.user_name) map[m.user_id] = m.user_name;});
    checkIns.forEach((c) => {if (c.user_id && c.user_name) map[c.user_id] = c.user_name;});
    recentActivity.forEach((a) => {if (a.user_id && a.name) map[a.user_id] = a.name;});
    memberUserRecords.forEach((u) => {if (u.id) {const name = u.display_name || (u.username ? u.username : null) || u.full_name;if (name) map[u.id] = name;}});
    if (currentUser?.id) {const name = currentUser.display_name || currentUser.username || currentUser.full_name;if (name) map[currentUser.id] = name;}
    return map;
  }, [allMemberships, checkIns, recentActivity, memberUserRecords, currentUser]);

  const {
    todayCI = 0, yesterdayCI = 0, todayVsYest = 0,
    activeThisWeek = 0, weeklyChangePct = 0,
    activeThisMonth = 0, totalMembers = 0, retentionRate = 0,
    monthChangePct = 0, monthCiPer = [],
    newSignUps = 0, cancelledEst = 0,
    atRisk = 0, atRiskMembersData: atRiskMembersList = [],
    memberLastCheckIn = {},
    sparkData7 = [], monthGrowthData = [],
    peakLabel = null, peakEndLabel = null, peakEntry = null,
    satVsAvg = 0, chartDays = [], streaks = [],
    avatarMap = {},
    weekTrend = [], peakHours = [], busiestDays = [],
    returnRate = 0, dailyAvg = 0, engagementSegments = {},
    retentionFunnel = [], dropOffBuckets = [], churnSignals = [], week1ReturnTrend = [],
    retentionBreakdown = {}, week1ReturnRate = {}, newNoReturnCount = 0,
    ci7Count = 0, ci7pCount = 0, weeklyTrendCoach = 0, monthlyTrendCoach = 0,
    returningCount = 0, newMembersThis30 = 0,
    weeklyChart = [], monthlyChart = [],
    engagementSegmentsCoach = {}, weekSpark = []
  } = stats;

  const ci30 = [];
  // Use the resolved avatar map (fetched from User entity) as the primary source
  // Fall back to stats.avatarMap for any user IDs not covered by memberUserRecords
  const avatarMapFull = useMemo(() => {
    return { ...avatarMap, ...memberAvatarMapResolved };
  }, [avatarMap, memberAvatarMapResolved]);

  const activeCoachRecord = useMemo(() => {
    if (!isCoach) return null;
    if (selectedCoachId) return coaches.find((c) => c.id === selectedCoachId) || null;
    return coaches.find((c) => c.user_email === currentUser?.email) || null;
  }, [isCoach, selectedCoachId, coaches, currentUser]);

  const myClasses = useMemo(() => {
    if (!isCoach) return classes;
    if (activeCoachRecord) return classes.filter((c) => c.coach_id === activeCoachRecord.id || c.instructor === activeCoachRecord.name || c.coach_name === activeCoachRecord.name || c.coach_email === activeCoachRecord.user_email);
    return classes.filter((c) => c.instructor === currentUser?.full_name || c.instructor === currentUser?.email || c.coach_name === currentUser?.full_name || c.coach_email === currentUser?.email || c.coach_id === currentUser?.id);
  }, [classes, currentUser, isCoach, activeCoachRecord]);

  const coachMemberships = useMemo(() => {
    if (!isCoach) return allMemberships;
    // Include members who have a booking with this coach
    const bookedClientIds = new Set(coachBookings.map(b => b.client_id).filter(Boolean));
    if (bookedClientIds.size > 0) {
      return allMemberships.filter(m => bookedClientIds.has(m.user_id));
    }
    // Fallback: filter by client_notes if available
    if (activeCoachRecord?.client_notes) {
      const ids = Object.keys(activeCoachRecord.client_notes);
      if (ids.length > 0) return allMemberships.filter(m => ids.includes(m.user_id));
    }
    return allMemberships;
  }, [isCoach, activeCoachRecord, allMemberships, coachBookings]);

  const coachCheckIns = useMemo(() => {
    if (!isCoach || !activeCoachRecord) return checkIns;
    const clientIds = activeCoachRecord.client_notes ? Object.keys(activeCoachRecord.client_notes) : null;
    if (clientIds && clientIds.length > 0) return checkIns.filter((c) => clientIds.includes(c.user_id));
    return checkIns;
  }, [isCoach, activeCoachRecord, checkIns]);

  const coachCi30 = [];
  const coachUserId = activeCoachRecord ? activeCoachRecord.id : currentUser?.id;
  const coachPosts = isCoach ? posts.filter((p) => p.author_id === coachUserId || p.created_by === coachUserId || !p.author_id) : posts;
  const coachEvents = isCoach ? events.filter((e) => e.created_by === coachUserId || e.coach_id === coachUserId || !e.created_by) : events;
  const coachChallenges = isCoach ? challenges.filter((c) => c.created_by === coachUserId || c.coach_id === coachUserId || !c.created_by) : challenges;
  const coachPolls = isCoach ? polls.filter((p) => p.created_by === coachUserId || !p.created_by) : polls;

  const priorities = [
  atRisk > 0 && { icon: AlertCircle, color: D.red, label: `${atRisk} members inactive 14+ days`, action: 'View members', fn: () => setTab('members') },
  !challenges.some((c) => c.status === 'active') && { icon: Trophy, color: D.amber, label: 'No active challenge running', action: 'Create one', fn: () => openModal('challenge') },
  polls.length === 0 && { icon: BarChart2, color: D.amber, label: 'No active polls', action: 'Create poll', fn: () => openModal('poll') },
  monthChangePct < 0 && { icon: TrendingDown, color: D.amber, label: 'Attendance down vs last month', action: 'View analytics', fn: () => setTab('analytics') }].
  filter(Boolean).slice(0, 4);

  const tabPanels = NAV.map((item) => {
    let content = null;
    if (item.id === 'overview' && !isCoach) {
      content = <TabOverview todayCI={todayCI} yesterdayCI={yesterdayCI} todayVsYest={todayVsYest} activeThisWeek={activeThisWeek} totalMembers={totalMembers} retentionRate={retentionRate} newSignUps={newSignUps} monthChangePct={monthChangePct} ciPrev30={[]} atRisk={atRisk} sparkData={sparkData7} monthGrowthData={monthGrowthData} cancelledEst={cancelledEst} peakLabel={peakLabel} peakEndLabel={peakEndLabel} peakEntry={peakEntry} satVsAvg={satVsAvg} monthCiPer={monthCiPer} checkIns={checkIns} allMemberships={effectiveMemberships} challenges={challenges} posts={posts} polls={polls} classes={classes} coaches={coaches} streaks={streaks} recentActivity={recentActivity} chartDays={chartDays} chartRange={chartRange} setChartRange={setChartRange} avatarMap={memberAvatarMapResolved} nameMap={memberNameMap} priorities={priorities} selectedGym={selectedGym} now={now} openModal={openModal} setTab={setTab} Spark={Spark} Delta={Delta} retentionBreakdown={retentionBreakdown} week1ReturnRate={week1ReturnRate} newNoReturnCount={newNoReturnCount} />;
    } else if (item.id === 'today' && isCoach) {
      content = <TabCoachToday allMemberships={coachMemberships} checkIns={coachCheckIns} myClasses={myClasses} currentUser={currentUser} openModal={openModal} setTab={setTab} now={now} bookings={coachBookings} />;
    } else if (item.id === 'schedule' && isCoach) {
      content = <TabCoachSchedule myClasses={myClasses} checkIns={coachCheckIns} events={coachEvents} challenges={coachChallenges} allMemberships={coachMemberships} avatarMap={avatarMapFull} openModal={openModal} now={now} selectedGym={selectedGym} onRefresh={() => inv('dashboardStats', 'coachBookings')} />;
    } else if (item.id === 'members') {
      content = isCoach ?
      <TabCoachMembers openModal={openModal} coach={activeCoachRecord} bookings={coachBookings} checkIns={coachCheckIns} avatarMap={avatarMapFull} now={now} /> :
      <TabMembersComponent allMemberships={effectiveMemberships} checkIns={checkIns} ci30={ci30} memberLastCheckIn={memberLastCheckIn} selectedGym={selectedGym} atRisk={atRisk} atRiskMembersList={atRiskMembersList} retentionRate={retentionRate} totalMembers={totalMembers} activeThisWeek={activeThisWeek} newSignUps={newSignUps} weeklyChangePct={weeklyChangePct} avatarMap={avatarMapFull} memberFilter={memberFilter} setMemberFilter={setMemberFilter} memberSearch={memberSearch} setMemberSearch={setMemberSearch} memberSort={memberSort} setMemberSort={setMemberSort} memberPage={memberPage} setMemberPage={setMemberPage} memberPageSize={memberPageSize} selectedRows={selectedRows} setSelectedRows={setSelectedRows} openModal={openModal} now={now} Spark={Spark} Delta={Delta} />;
    } else if (item.id === 'content') {
      content = isCoach ?
      <TabCoachContent bookings={coachBookings} assignedWorkouts={coachAssignedWorkouts} events={coachEvents} challenges={coachChallenges} polls={coachPolls} posts={coachPosts} classes={myClasses} checkIns={coachCheckIns} ci30={coachCi30} avatarMap={avatarMapFull} allMemberships={coachMemberships} openModal={openModal} now={now} onDeletePost={(id) => deletePostM.mutate(id)} onDeleteEvent={(id) => deleteEventM.mutate(id)} onDeleteChallenge={(id) => deleteChallengeM.mutate(id)} onDeleteClass={(id) => deleteClassM.mutate(id)} onDeletePoll={(id) => deletePollM.mutate(id)} /> :
      <TabContentComponent events={events} challenges={challenges} polls={polls} posts={posts} classes={classes} checkIns={checkIns} ci30={ci30} avatarMap={avatarMapFull} currentUser={currentUser} leaderboardView={leaderboardView} setLeaderboardView={setLeaderboardView} openModal={openModal} now={now} onDeletePost={(id) => deletePostM.mutate(id)} onDeleteEvent={(id) => deleteEventM.mutate(id)} onDeleteChallenge={(id) => deleteChallengeM.mutate(id)} onDeleteClass={(id) => deleteClassM.mutate(id)} onDeletePoll={(id) => deletePollM.mutate(id)} />;
    } else if (item.id === 'analytics') {
      content = isCoach ?
      <TabCoachAnalytics ci30Count={allMemberships.reduce((s, m) => s + (m.ci30Count || 0), 0)} totalMembers={coachMemberships.length} myClasses={myClasses} monthChangePct={monthChangePct} retentionRate={retentionRate} activeThisMonth={activeThisMonth} atRisk={atRisk} gymId={selectedGym?.id} ci7Count={ci7Count} ci7pCount={ci7pCount} weeklyTrendCoach={weeklyTrendCoach} monthlyTrendCoach={monthlyTrendCoach} returningCount={returningCount} newMembersThis30={newMembersThis30} weeklyChart={weeklyChart} monthlyChart={monthlyChart} engagementSegmentsCoach={engagementSegmentsCoach} weekSpark={weekSpark} peakHours={peakHours} busiestDays={busiestDays} memberships={coachMemberships} checkIns={coachCheckIns} now={now} openModal={openModal} /> :
      <TabAnalyticsComponent checkIns={checkIns} ci30={ci30} totalMembers={totalMembers} monthCiPer={monthCiPer} monthChangePct={monthChangePct} monthGrowthData={monthGrowthData} retentionRate={retentionRate} activeThisMonth={activeThisMonth} newSignUps={newSignUps} atRisk={atRisk} gymId={selectedGym?.id} allMemberships={allMemberships} classes={classes} coaches={coaches} avatarMap={avatarMapFull} sparkData={sparkData7} Spark={Spark} Delta={Delta} weekTrend={weekTrend} peakHours={peakHours} busiestDays={busiestDays} returnRate={returnRate} dailyAvg={dailyAvg} engagementSegments={engagementSegments} retentionFunnel={retentionFunnel} dropOffBuckets={dropOffBuckets} churnSignals={churnSignals} week1ReturnTrend={week1ReturnTrend} />;
    } else if (item.id === 'profile' && isCoach) {
      content = <TabCoachProfile selectedGym={selectedGym} currentUser={currentUser} openModal={openModal} coach={activeCoachRecord} bookings={coachBookings} checkIns={coachCheckIns} avatarMap={avatarMapFull} />;
    } else if (item.id === 'engagement') {
      content = <TabEngagement selectedGym={selectedGym} allMemberships={effectiveMemberships} atRisk={atRisk} totalMembers={totalMembers} />;
    } else if (item.id === 'gym') {
      content = <TabGym selectedGym={selectedGym} classes={classes} coaches={coaches} openModal={openModal} checkIns={checkIns} allMemberships={allMemberships} atRisk={atRisk} retentionRate={retentionRate} rewards={rewards} onCreateReward={(d) => createRewardM.mutate(d)} onDeleteReward={(id) => deleteRewardM.mutate(id)} isLoading={createRewardM.isPending} />;
    }
    return { id: item.id, content };
  }).filter((p) => p.content !== null);

  const Splash = ({ children }) =>
  <div className="dash-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bgBase }}>
      <div style={{ background: D.bgSurface, border: `1px solid ${D.border}`, borderRadius: 16, padding: 36, maxWidth: 380, width: '100%', textAlign: 'center' }}>
        {children}
      </div>
    </div>;

  if (gymsError) return (
    <Splash>
      <X style={{ width: 26, height: 26, color: D.red, margin: '0 auto 12px' }} />
      <h2 style={{ color: D.t1, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Connection Error</h2>
      <p style={{ color: D.t3, fontSize: 13, marginBottom: 20 }}>{gymsError.message}</p>
      <button onClick={() => window.location.reload()} style={{ background: D.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
    </Splash>);

  if (approvedGyms.length === 0 && pendingGyms.length > 0) return (
    <Splash>
      <Clock style={{ width: 26, height: 26, color: D.amber, margin: '0 auto 12px' }} />
      <h2 style={{ color: D.t1, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>Pending Approval</h2>
      <p style={{ color: D.t3, fontSize: 13, marginBottom: 20 }}>Your gym <strong style={{ color: D.t1 }}>{pendingGyms[0].name}</strong> is under review. We'll notify you once it's approved.</p>
      <Link to={createPageUrl('Home')}><button style={{ background: 'rgba(255,255,255,0.06)', color: D.t1, border: `1px solid ${D.border}`, borderRadius: 9, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Back to Home</button></Link>
    </Splash>);

  if (myGyms.length === 0 && !isCoach) return (
    <Splash>
      <Dumbbell style={{ width: 26, height: 26, color: D.blue, margin: '0 auto 12px' }} />
      <h2 style={{ color: D.t1, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.03em' }}>No Gyms Yet</h2>
      <p style={{ color: D.t3, fontSize: 13, marginBottom: 20 }}>Register your gym to get started with the dashboard.</p>
      <Link to={createPageUrl('GymSignup')}><button style={{ background: D.blue, color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Register Your Gym</button></Link>
    </Splash>);

  const sharedModals =
  <>
      <ManageClassesModal open={modal === 'classes'} onClose={closeModal} classes={classes} onCreateClass={(d) => createClassM.mutate(d)} onUpdateClass={(id, data) => updateClassM.mutate({ id, data })} onDeleteClass={(id) => deleteClassM.mutate(id)} gym={selectedGym} isLoading={createClassM.isPending || updateClassM.isPending} />
      <CreateGymOwnerPostModal open={modal === 'post'} onClose={closeModal} gym={selectedGym} onSuccess={() => inv('posts')} targetMember={modalData} />
      <CreateEventModal open={modal === 'event'} onClose={closeModal} onSave={(d) => d.id ? updateEventM.mutate(d) : createEventM.mutate(d)} gym={selectedGym} isLoading={createEventM.isPending || updateEventM.isPending} initialEvent={modalData} />
      <CreateChallengeModal open={modal === 'challenge'} onClose={closeModal} gyms={gyms} onSave={(d) => createChallengeM.mutate(d)} isLoading={createChallengeM.isPending} />
      <QRScanner open={modal === 'qrScanner'} onClose={closeModal} />
      <CreatePollModal open={modal === 'poll'} onClose={closeModal} onSave={(d) => createPollM.mutate(d)} isLoading={createPollM.isPending} />
      <AssignWorkoutModal open={modal === 'assignWorkout'} onClose={closeModal} member={modalData} coach={activeCoachRecord} onSuccess={() => inv('coachAssignedWorkouts')} />
      <BookClientModal open={modal === 'bookClient'} onClose={closeModal} member={modalData} classes={myClasses} coach={activeCoachRecord} gymId={selectedGym?.id} onSuccess={() => inv('coachBookings')} />
      <ManageRewardsModal open={modal === 'rewards'} onClose={closeModal} rewards={rewards} onCreateReward={(d) => createRewardM.mutate(d)} onDeleteReward={(id) => deleteRewardM.mutate(id)} gym={selectedGym} isLoading={createRewardM.isPending} />
      <ManageCoachesModal open={modal === 'coaches'} onClose={closeModal} coaches={coaches} onCreateCoach={(d) => createCoachM.mutate(d)} onDeleteCoach={(id) => deleteCoachM.mutate(id)} onUpdateCoach={(id, data) => updateCoachM.mutate({ id, data })} gym={selectedGym} isLoading={createCoachM.isPending} allMemberships={allMemberships} classes={classes} />
      <EditGymPhotoModal open={modal === 'heroPhoto'} onClose={closeModal} gym={selectedGym} onSave={(url) => updateGymM.mutate({ image_url: url })} isLoading={updateGymM.isPending} />
      <ManageGymPhotosModal open={modal === 'photos'} onClose={closeModal} gallery={selectedGym?.gallery || []} onSave={(g) => updateGalleryM.mutate(g)} isLoading={updateGalleryM.isPending} />
      <ManageMembersModal open={modal === 'members'} onClose={closeModal} gym={selectedGym} onBanMember={(id) => banMemberM.mutate(id)} onUnbanMember={(id) => unbanMemberM.mutate(id)} />
      <ManageEquipmentModal open={modal === 'equipment'} onClose={closeModal} equipment={selectedGym?.equipment || []} onSave={(e) => updateGymM.mutate({ equipment: e })} isLoading={updateGymM.isPending} />
      <ManageAmenitiesModal open={modal === 'amenities'} onClose={closeModal} amenities={selectedGym?.amenities || []} onSave={(a) => updateGymM.mutate({ amenities: a })} isLoading={updateGymM.isPending} />
      <EditBasicInfoModal open={modal === 'editInfo'} onClose={closeModal} gym={selectedGym} onSave={(d) => updateGymM.mutate(d)} isLoading={updateGymM.isPending} />
      <EditGymLogoModal open={modal === 'logo'} onClose={closeModal} currentLogoUrl={selectedGym?.logo_url} onSave={(url) => updateGymM.mutate({ logo_url: url })} isLoading={updateGymM.isPending} />
      <EditPricingModal open={modal === 'pricing'} onClose={closeModal} gym={selectedGym} onSave={(d) => updateGymM.mutate(d)} isLoading={updateGymM.isPending} />

      <AlertDialog open={modal === 'deleteGym'} onOpenChange={(v) => !v && closeModal()}>
        <AlertDialogContent style={{ background: D.bgSurface, backdropFilter: 'blur(20px)', border: `1px solid ${D.redBrd}` }} className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: D.t1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
              <Trash2 style={{ width: 16, height: 16, color: D.red }} /> Delete Gym Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: D.t3, fontSize: 13 }}>
              Deletes <strong style={{ color: D.t1 }}>{selectedGym?.name}</strong> and all its data. <span style={{ color: D.red, fontWeight: 700 }}>This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: 'rgba(255,255,255,0.05)', color: D.t1, border: `1px solid ${D.border}` }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteGymM.mutate()} disabled={deleteGymM.isPending} style={{ background: D.red, color: '#fff', border: 'none' }}>
              {deleteGymM.isPending ? 'Deleting…' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={modal === 'deleteAccount'} onOpenChange={(v) => !v && closeModal()}>
        <AlertDialogContent style={{ background: D.bgSurface, backdropFilter: 'blur(20px)', border: `1px solid ${D.redBrd}` }} className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: D.t1, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800 }}>
              <Trash2 style={{ width: 16, height: 16, color: D.red }} /> Delete Account?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: D.t3, fontSize: 13 }}>
              Deletes your account, all gyms, and personal data. <span style={{ color: D.red, fontWeight: 700 }}>This cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: 'rgba(255,255,255,0.05)', color: D.t1, border: `1px solid ${D.border}` }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAccountM.mutate()} disabled={deleteAccountM.isPending} style={{ background: D.red, color: '#fff', border: 'none' }}>
              {deleteAccountM.isPending ? 'Deleting…' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GymJoinPoster gym={selectedGym} open={showPoster} onClose={() => setShowPoster(false)} />
      <MemberChatPanel open={showChat} onClose={() => setShowChat(false)} allMemberships={allMemberships} currentUser={currentUser} avatarMap={memberAvatarMapResolved} />
    </>;

  // ── MOBILE ────────────────────────────────────────────────────────────────
  if (isMobile) return (
    <div className="dash-root" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: D.bgBase, overflow: 'hidden' }}>
      <header style={{ flexShrink: 0, background: D.bgSidebar, borderBottom: `1px solid ${D.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: D.bgSurface, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Dumbbell style={{ width: 14, height: 14, color: D.blue }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: D.t1, letterSpacing: '-0.02em', lineHeight: 1 }}>{selectedGym?.name || 'Dashboard'}</div>
            <div style={{ fontSize: 9, color: D.t3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>{roleLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {atRisk > 0 &&
          <button onClick={() => setTab('members')} style={{ background: D.redDim, color: D.red, border: `1px solid ${D.redBrd}`, borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '4px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertTriangle style={{ width: 9, height: 9 }} />{atRisk}
            </button>
          }
          <button onClick={() => openModal('qrScanner')} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, color: D.t3, cursor: 'pointer' }}>
            <QrCode style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={() => openModal('post')} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.blue, border: 'none', color: '#fff', cursor: 'pointer' }}>
            <Plus style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </header>

      <MobileKpiStrip tab={tab} isCoach={isCoach} stats={stats} posts={posts} events={events} challenges={challenges} polls={polls} coaches={coaches} classes={classes} myClasses={myClasses} allMemberships={effectiveMemberships} />

      <main style={{ flex: 1, overflow: 'auto', padding: '12px 12px 80px', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
        <div style={{ maxWidth: '100%' }}>
          <Suspense fallback={<TabLoader />}>
            {tabPanels.map((p) =>
            <div key={p.id} style={{ display: p.id === tab ? 'block' : 'none' }}>{p.content}</div>
            )}
          </Suspense>
        </div>
      </main>

      <nav style={{ flexShrink: 0, background: D.bgSidebar, borderTop: `1px solid ${D.border}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button key={item.id} onClick={() => setTab(item.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '11px 4px 9px', border: 'none', background: active ? 'rgba(59,130,246,0.06)' : 'transparent', cursor: 'pointer', color: active ? D.blue : D.t4, transition: 'color 0.15s, background 0.15s', fontFamily: 'inherit', position: 'relative' }}>
              {active && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: D.blue, borderRadius: '0 0 2px 2px' }} />}
              <item.icon style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, letterSpacing: '0.03em' }}>{item.label}</span>
            </button>);
        })}
      </nav>
      {sharedModals}
    </div>);

  // ── DESKTOP ───────────────────────────────────────────────────────────────
  return (
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
          />
          <KpiCard
            label="Active Members"
            value={activeThisWeek}
            valueSuffix={`/ ${totalMembers}`}
            sub={`${retentionRate}% retention`}
            subTrend={retentionRate >= 70 ? 'up' : retentionRate < 50 ? 'down' : null}
            subContext={retentionRate < 60 ? 'Below 70% target' : retentionRate >= 80 ? 'Top 20% — excellent' : undefined}
            ring={showRing ? retentionRate : null}
            ringColor={retentionRate >= 70 ? C.success : retentionRate >= 50 ? C.warn : C.danger}
            sparkData={!showRing ? sparkData : null}
            icon={Users}
          />
          <KpiCard
            label="In Gym Now"
            value={inGymNow}
            sub={inGymNow === 0
              ? (now.getHours() < 10 ? 'Early — peak at 5–7pm' : now.getHours() < 17 ? 'Quiet midday period' : 'No recent check-ins')
              : `${inGymNow === 1 ? 'Member' : 'Members'} in last 2h`}
            subTrend={inGymNow > 0 ? 'up' : null}
            sparkData={sparkData}
            icon={Users}
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
          />
        </div>

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
  );
}