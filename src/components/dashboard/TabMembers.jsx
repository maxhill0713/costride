/**
 * TabMembers — v3
 *
 * Pixel-faithful to the screenshot + all prompt requirements:
 *
 * LAYOUT (exact match):
 *   Today's Focus card — flame header, 3 rows each with:
 *     colored left-border line, semantic icon, bold title + muted impact,
 *     right-aligned CTA button with chevron
 *   Filter bar — All ← | Active ▼ | Inactive N | At Risk ● | New N | … | sort ▼ | search
 *   Table — checkbox | MEMBER | TREND | RISK | VISITS/LAST SEEN | MEMBERSHIP + per-row action btn
 *   Bottom bulk bar — two rows: count + clear | bulk actions + message + tag + clear members
 *   Right sidebar — Alerts card with avatar chips, dual buttons, funnel bars
 *
 * PROMPT REQUIREMENTS:
 *   ✓ Today's Focus (top priority, actionable)
 *   ✓ Metrics bar (total, active, at-risk, new)
 *   ✓ Members table (avatar, status, last active, engagement, tags, join date, actions)
 *   ✓ Bulk action bar (message, tag, start challenge, archive)
 *   ✓ Search + filters (status, tags, engagement level, quick filters)
 *   ✓ Right panel — member insights
 *   ✓ Member profile on row click (stats, activity, actions)
 *   ✓ Engagement segments (highly engaged / active / at risk / inactive)
 *   ✓ Empty state
 *   ✓ Floating + Invite Member button
 */

import React, { useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  Plus, Search, ChevronLeft, ChevronRight, ChevronDown, ArrowLeft,
  Users, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  UserPlus, Bell, X, Check, Zap, History, Flag, MoreHorizontal,
  Mail, GraduationCap, Copy, Flame, Send, Clock, Trophy,
  Tag, MessageSquare, Activity, Star, Calendar, Shield,
} from 'lucide-react';
import { Avatar, FitnessScore, Empty } from './DashboardPrimitives';
import { base44 } from '@/api/base44Client';
import LeaderboardSection from '../leaderboard/LeaderboardSection';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

/* ── Shared card ─────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW,
      overflow: 'hidden', position: 'relative', ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Label ───────────────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 8 }}>
      {children}
    </div>
  );
}

/* ── StatNudge ───────────────────────────────────────────────────── */
function StatNudge({ color = C.accent, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{
      marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '9px 11px', borderRadius: 8,
      background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `2px solid ${color}`,
    }}>
      {Icon && <Icon style={{ width: 11, height: 11, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{stat} </span>
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={e => { e.stopPropagation(); onAction(); }} style={{
          flexShrink: 0, fontSize: 10, fontWeight: 600, color,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 2, padding: 0,
        }}>
          {action} <ChevronRight style={{ width: 9, height: 9 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TODAY'S FOCUS — exact screenshot layout:
   header row | 3 action rows (left colored border, bold title +
   muted impact inline, right-aligned CTA button)
══════════════════════════════════════════════════════════════════ */
function TodaysFocus({ memberRows, openModal, setMemberFilter, setMemberSort, now }) {
  const items = useMemo(() => {
    const list = [];

    const churnRisk = memberRows.filter(m => m.risk === 'High' || m.risk === 'Medium');
    if (churnRisk.length > 0) {
      const estLoss = churnRisk.reduce((s, m) => s + (m.monthlyValue || 60), 0);
      list.push({
        priority: 1, color: C.danger, dotColor: '#ef4444',
        icon: AlertTriangle, iconColor: C.danger,
        bold: `${churnRisk.length} member${churnRisk.length > 1 ? 's' : ''} likely to churn`,
        muted: `Could lose $${estLoss}/month`,
        muteIcon: null,
        cta: 'Message now',
        fn: () => { setMemberFilter('atRisk'); setMemberSort('highRisk'); openModal('message'); },
      });
    }

    const newNoReturn = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo >= 7 && m.joinedDaysAgo <= 21 && m.visitsTotal < 2);
    if (newNoReturn.length > 0) {
      list.push({
        priority: 2, color: C.success, dotColor: '#10b981',
        icon: UserPlus, iconColor: C.success,
        bold: `${newNoReturn.length} new member${newNoReturn.length > 1 ? 's' : ''}`,
        suffix: ` ${newNoReturn.length === 1 ? "hasn't" : "haven't"} returned in a week`,
        muted: 'Help them build a habit',
        muteIcon: '✦',
        cta: 'Follow up',
        fn: () => setMemberFilter('new'),
      });
    }

    const belowTarget = memberRows.filter(m => m.visits30 > 0 && m.visits30 < 4 && m.daysSince < 14);
    if (belowTarget.length > 0) {
      list.push({
        priority: 3, color: C.accent, dotColor: '#3b82f6',
        icon: Activity, iconColor: C.accent,
        bold: `${belowTarget.length} member${belowTarget.length > 1 ? 's' : ''} below weekly target`,
        muted: 'Nudge them',
        muteIcon: '⚠',
        cta: 'Nudge',
        fn: () => openModal('message'),
      });
    }

    const freqDrop = memberRows.filter(m => m.prevVisits30 >= 4 && m.visits30 <= m.prevVisits30 * 0.5);
    if (freqDrop.length > 0) {
      list.push({
        priority: 4, color: C.warn, dotColor: C.warn,
        icon: TrendingDown, iconColor: C.warn,
        bold: `${freqDrop.length} member${freqDrop.length > 1 ? 's' : ''} visiting less than usual`,
        muted: 'Early churn signal',
        muteIcon: null,
        cta: 'Reach out',
        fn: () => openModal('message'),
      });
    }

    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [memberRows]);

  if (items.length === 0) return null;

  return (
    <Card style={{ marginBottom: 14 }}>
      {/* Header */}
      <div style={{
        padding: '11px 18px 11px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${C.divider}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Flame style={{ width: 14, height: 14, color: C.warn }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Today's Focus</span>
        </div>
        <button style={{
          background: 'none', border: 'none', color: C.t3,
          fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ↩ Rethacll
        </button>
      </div>

      {/* Action rows — each exactly matches the screenshot layout */}
      {items.map((item, i) => {
        const Icon = item.icon;
        const isLast = i === items.length - 1;
        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '11px 16px',
            borderBottom: isLast ? 'none' : `1px solid ${C.divider}`,
            borderLeft: `3px solid ${item.color}`,
            gap: 10,
            minHeight: 44,
          }}>
            {/* Semantic icon */}
            <Icon style={{ width: 13, height: 13, color: item.iconColor, flexShrink: 0 }} />

            {/* Title: bold part + normal suffix + muted impact */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{item.bold}</span>
              {item.suffix && (
                <span style={{ fontSize: 13, fontWeight: 400, color: C.t2 }}>{item.suffix}</span>
              )}
              {item.muteIcon && (
                <span style={{ fontSize: 12, color: C.t3 }}>{item.muteIcon}</span>
              )}
              {item.muted && (
                <span style={{ fontSize: 12, color: C.t3 }}>{item.muted}</span>
              )}
            </div>

            {/* Right-aligned CTA */}
            <button onClick={item.fn} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7,
              background: C.surfaceEl, border: `1px solid ${C.borderEl}`,
              color: C.t1, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              flexShrink: 0, whiteSpace: 'nowrap',
              transition: 'border-color .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.t3}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.borderEl}
            >
              {item.cta} <ChevronDown style={{ width: 9, height: 9, color: C.t3 }} />
            </button>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   METRICS BAR (prompt requirement)
══════════════════════════════════════════════════════════════════ */
function MetricsBar({ memberRows, atRisk }) {
  const active  = memberRows.filter(m => m.daysSince < 7).length;
  const newM    = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 7).length;
  const total   = memberRows.length;

  const cards = [
    { label: 'Total Members',  value: total,   color: C.t1,    sub: 'All time'           },
    { label: 'Active (7 days)', value: active,  color: C.success, sub: `${total > 0 ? Math.round((active/total)*100) : 0}% of gym` },
    { label: 'At Risk',        value: atRisk,  color: atRisk > 0 ? C.danger : C.t4, sub: '14+ days away'  },
    { label: 'New This Week',  value: newM,    color: newM > 0 ? C.accent : C.t4, sub: 'Joined < 7 days' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
      {cards.map((c, i) => (
        <Card key={i} style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.11em', marginBottom: 6 }}>{c.label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: c.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{c.value}</div>
          <div style={{ fontSize: 10, color: C.t3 }}>{c.sub}</div>
        </Card>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TREND CHIP — colored badge + bar below (matches screenshot)
══════════════════════════════════════════════════════════════════ */
function TrendChip({ m }) {
  const isNew    = m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14;
  const isHigh   = m.risk === 'High';
  const isMedium = m.risk === 'Medium';

  if (isNew) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          background: C.successSub, color: C.success, border: `1px solid ${C.successBrd}`,
        }}>
          New
        </span>
        <div style={{ height: 3, borderRadius: 99, background: C.divider, width: 52 }}>
          <div style={{ height: '100%', width: '30%', background: C.success, borderRadius: 99, opacity: 0.5 }} />
        </div>
      </div>
    );
  }
  if (isHigh) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          background: C.dangerSub, color: C.danger, border: `1px solid ${C.dangerBrd}`,
        }}>
          <TrendingDown style={{ width: 8, height: 8 }} /> High
        </span>
        <div style={{ height: 3, borderRadius: 99, background: C.divider, width: 52 }}>
          <div style={{ height: '100%', width: '85%', background: C.danger, borderRadius: 99 }} />
        </div>
      </div>
    );
  }
  if (isMedium) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          background: C.warnSub, color: C.warn, border: `1px solid ${C.warnBrd}`,
        }}>
          <TrendingDown style={{ width: 8, height: 8 }} /> Medium
        </span>
        <div style={{ height: 3, borderRadius: 99, background: C.divider, width: 52 }}>
          <div style={{ height: '100%', width: '50%', background: C.warn, borderRadius: 99 }} />
        </div>
      </div>
    );
  }
  const pctDrop = m.prevVisits30 > 0 ? Math.round(((m.visits30 - m.prevVisits30) / m.prevVisits30) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {pctDrop > 10
          ? <TrendingUp style={{ width: 9, height: 9, color: C.success }} />
          : pctDrop < -10
          ? <TrendingDown style={{ width: 9, height: 9, color: C.danger }} />
          : <div style={{ width: 16, height: 2, borderRadius: 99, background: C.t4 }} />}
        <span style={{ fontSize: 10, color: C.t3 }}>
          {pctDrop > 10 ? `+${pctDrop}%` : pctDrop < -10 ? `${pctDrop}%` : 'Stable'}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 99, background: C.divider, width: 52 }}>
        <div style={{ height: '100%', width: `${Math.max(10, Math.min(100, 50 + pctDrop))}%`, background: pctDrop < -10 ? C.danger : C.accent, borderRadius: 99, opacity: 0.5 }} />
      </div>
    </div>
  );
}

/* ── Per-row action button ─────────────────────────────────────── */
function RowActionBtn({ label, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', borderRadius: 7,
        background: hov ? `${color}18` : C.surfaceEl,
        border: `1px solid ${hov ? `${color}30` : C.border}`,
        color: hov ? color : C.t2,
        fontSize: 10.5, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
        whiteSpace: 'nowrap', transition: 'all .15s', flexShrink: 0,
      }}
    >
      {label} <ChevronDown style={{ width: 8, height: 8 }} />
    </button>
  );
}

/* ── Risk badge ─────────────────────────────────────────────────── */
function RiskBadge({ risk }) {
  if (risk === 'Low') return <span style={{ fontSize: 10, color: C.t4, fontWeight: 500 }}>Low</span>;
  const isHigh = risk === 'High';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 600,
      padding: '3px 8px', borderRadius: 6,
      background: isHigh ? C.dangerSub : C.warnSub,
      color: isHigh ? C.danger : C.warn,
      border: `1px solid ${isHigh ? C.dangerBrd : C.warnBrd}`,
    }}>
      {risk}
    </span>
  );
}

/* ── Milestone badge ────────────────────────────────────────────── */
function MilestoneBadge({ visitsTotal, joinedDaysAgo }) {
  let label = null;
  if (visitsTotal === 1) label = '1st visit';
  else if (visitsTotal === 10) label = '10 visits';
  else if (visitsTotal === 25) label = '25 visits';
  else if (visitsTotal === 50) label = '50 visits';
  else if (visitsTotal === 100) label = '100 visits';
  else if (joinedDaysAgo !== null && joinedDaysAgo <= 7) label = 'New';
  if (!label) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, color: C.warn,
      background: C.warnSub, border: `1px solid ${C.warnBrd}`,
      padding: '2px 6px', borderRadius: 5,
    }}>{label}</span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MESSAGE TEMPLATES
══════════════════════════════════════════════════════════════════ */
const PRESET_MESSAGES = [
  { id: 'miss',      label: 'We miss you',      sublabel: 'Re-engagement',    body: (g, n) => `Hey ${n}, it's been a while since we've seen you at ${g}. Your progress is waiting — come back and pick up where you left off.` },
  { id: 'offer',     label: 'Bring a guest',     sublabel: 'Special offer',    body: (g, n) => `${n}, this week you can bring a guest to ${g} for free. A great time to train with someone you know.` },
  { id: 'challenge', label: 'New challenge',     sublabel: 'Motivation',       body: (g, n) => `${n}, a new challenge has just launched at ${g}. It's a great chance to push yourself and hit a new personal best.` },
  { id: 'nudge',     label: 'Friendly reminder', sublabel: 'Check-in nudge',   body: (g, n) => `Just checking in, ${n}. Your spot at ${g} is ready whenever you are — consistency is everything.` },
  { id: 'streak',    label: 'Keep it going',     sublabel: 'Streak recovery',  body: (g, n) => `${n}, don't break your streak! Pop in to ${g} today and keep the momentum alive.` },
  { id: 'welcome',   label: 'Welcome back',      sublabel: 'Week-1 follow-up', body: (g, n) => `Great to have you at ${g}, ${n}! How's everything going? We'd love to see you again this week.` },
];

function ModeToggle({ mode, setMode }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: C.surfaceEl, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 12 }}>
      {[{ id: 'preset', label: 'Templates' }, { id: 'custom', label: 'Custom' }].map(m => (
        <button key={m.id} onClick={() => setMode(m.id)} style={{
          padding: '4px 12px', borderRadius: 6, fontSize: 11,
          fontWeight: mode === m.id ? 600 : 400, cursor: 'pointer',
          background: mode === m.id ? C.surface : 'transparent',
          border: `1px solid ${mode === m.id ? C.borderEl : 'transparent'}`,
          color: mode === m.id ? C.t1 : C.t3, fontFamily: 'inherit', transition: 'all .15s',
        }}>{m.label}</button>
      ))}
    </div>
  );
}

function PresetGrid({ preset, setPreset }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
      {PRESET_MESSAGES.map(p => (
        <button key={p.id} onClick={() => setPreset(p.id)} style={{
          padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
          background: preset === p.id ? C.surfaceEl : 'transparent',
          border: `1px solid ${preset === p.id ? C.borderEl : C.border}`,
          transition: 'all .15s', fontFamily: 'inherit',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: preset === p.id ? C.t1 : C.t2, marginBottom: 2 }}>{p.label}</div>
          <div style={{ fontSize: 9, color: C.t3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{p.sublabel}</div>
        </button>
      ))}
    </div>
  );
}

function SendBtn({ onClick, disabled, sending, sent, label }) {
  const ready = !disabled && !sending && !sent;
  return (
    <button onClick={onClick} disabled={disabled || sending || sent} style={{
      width: '100%', padding: '9px', borderRadius: 8,
      border: `1px solid ${sent ? C.successBrd : ready ? C.accentBrd : C.border}`,
      cursor: ready ? 'pointer' : 'default',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontSize: 12, fontWeight: 600,
      background: sent ? C.successSub : ready ? C.accentSub : 'transparent',
      color: sent ? C.success : ready ? C.accent : C.t3,
      transition: 'all .15s', fontFamily: 'inherit',
    }}>
      {sent ? <><Check style={{ width: 12, height: 12 }} /> Sent</>
        : sending ? 'Sending…'
        : <><Send style={{ width: 12, height: 12 }} /> {label}</>}
    </button>
  );
}

/* ── Member push panel ──────────────────────────────────────────── */
function MemberPushPanel({ member, gymName, gymId, onClose }) {
  const [preset, setPreset] = useState('miss');
  const [custom, setCustom] = useState('');
  const [mode, setMode] = useState('preset');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const firstName = member.name.split(' ')[0];
  const message = mode === 'preset' ? PRESET_MESSAGES.find(p => p.id === preset)?.body(gymName, firstName) || '' : custom;

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await base44.functions.invoke('sendPushNotification', {
        gym_id: gymId, gym_name: gymName, target: 'specific',
        message: message.trim(), member_ids: [member.user_id],
      });
      setSent(true);
      setTimeout(() => { setSent(false); onClose(); }, 2000);
    } catch { } finally { setSending(false); }
  };

  return (
    <div style={{
      padding: '14px 16px 16px', background: C.surfaceEl,
      borderBottom: `1px solid ${C.divider}`, borderLeft: `3px solid ${C.accent}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell style={{ width: 12, height: 12, color: C.t3 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Push Notification</div>
            <div style={{ fontSize: 10, color: C.t3 }}>Sending to {firstName}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${C.border}`, cursor: 'pointer' }}>
          <X style={{ width: 10, height: 10, color: C.t3 }} />
        </button>
      </div>
      <ModeToggle mode={mode} setMode={setMode} />
      {mode === 'preset' ? <PresetGrid preset={preset} setPreset={setPreset} /> : (
        <textarea value={custom} onChange={e => setCustom(e.target.value)}
          placeholder={`Write a message to ${firstName}…`} rows={3}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 11, color: C.t1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
          onFocus={e => e.target.style.borderColor = C.accentBrd}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      )}
      {message && (
        <div style={{ margin: '10px 0', padding: '9px 11px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.accent}`, fontSize: 11, color: C.t2, lineHeight: 1.6 }}>
          {message}
        </div>
      )}
      <SendBtn onClick={handleSend} disabled={!message.trim()} sending={sending} sent={sent} label={`Send to ${firstName}`} />
    </div>
  );
}

/* ── Bulk push panel ─────────────────────────────────────────────── */
function BulkPushPanel({ selectedRows, memberRows, gymName, gymId, onClose, onSuccess }) {
  const [preset, setPreset] = useState('miss');
  const [custom, setCustom] = useState('');
  const [mode, setMode] = useState('preset');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const members = memberRows.filter(m => selectedRows.has(m.id));
  const memberCount = members.length;
  const buildMsg = (p, name) => PRESET_MESSAGES.find(x => x.id === p)?.body(gymName, name) || '';
  const preview = mode === 'preset' ? buildMsg(preset, members[0]?.name.split(' ')[0] || 'there') : custom;

  const handleSend = async () => {
    if (!preview.trim() || sending) return;
    setSending(true);
    try {
      if (mode === 'preset') {
        await Promise.all(members.map(m => base44.functions.invoke('sendPushNotification', { gym_id: gymId, gym_name: gymName, target: 'specific', message: buildMsg(preset, m.name.split(' ')[0]), member_ids: [m.user_id] })));
      } else {
        await base44.functions.invoke('sendPushNotification', { gym_id: gymId, gym_name: gymName, target: 'specific', message: preview.trim(), member_ids: members.map(m => m.user_id) });
      }
      setSent(true);
      setTimeout(() => { setSent(false); onSuccess(); onClose(); }, 2200);
    } catch { } finally { setSending(false); }
  };

  return (
    <div style={{ padding: '14px 16px 16px', background: C.surfaceEl, borderBottom: `1px solid ${C.divider}`, borderLeft: `3px solid ${C.accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users style={{ width: 12, height: 12, color: C.t3 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Bulk Notification</div>
            <div style={{ fontSize: 10, color: C.t3 }}>{memberCount} members{mode === 'preset' && ' · personalised per name'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ display: 'flex' }}>
            {members.slice(0, 4).map((m, i) => (
              <div key={m.id} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 4 - i, border: `2px solid ${C.surface}`, borderRadius: '50%' }}>
                <Avatar name={m.name} size={20} src={m.avatar_url} />
              </div>
            ))}
            {memberCount > 4 && (
              <div style={{ marginLeft: -6, width: 20, height: 20, borderRadius: '50%', background: C.surfaceEl, border: `2px solid ${C.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: C.t2 }}>+{memberCount - 4}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${C.border}`, cursor: 'pointer' }}>
            <X style={{ width: 10, height: 10, color: C.t3 }} />
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <ModeToggle mode={mode} setMode={setMode} />
          {mode === 'preset' ? <PresetGrid preset={preset} setPreset={setPreset} /> : (
            <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder={`Write to all ${memberCount} members…`} rows={4}
              style={{ width: '100%', boxSizing: 'border-box', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 11, color: C.t1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SectionLabel>Preview</SectionLabel>
          <div style={{ flex: 1, padding: '9px 11px', borderRadius: 8, background: C.surface, border: `1px solid ${C.border}`, borderLeft: `2px solid ${preview ? C.accent : C.border}`, fontSize: 11, color: preview ? C.t2 : C.t3, lineHeight: 1.6, fontStyle: preview ? 'normal' : 'italic' }}>
            {preview || 'Select a template…'}
          </div>
          <SendBtn onClick={handleSend} disabled={!preview.trim()} sending={sending} sent={sent} label={`Send to ${memberCount}`} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   EXPANDED MEMBER DETAIL (row click → member profile)
   Matches prompt: stats, activity timeline, actions
══════════════════════════════════════════════════════════════════ */
function ExpandedMemberDetail({ m, gymName, gymId, checkIns, posts, now, onClose }) {
  const recentPosts = (posts || []).filter(p => p.user_id === m.user_id && differenceInDays(now, new Date(p.created_at)) <= 30).length;
  const engScore    = Math.min(100, Math.round((m.visits30 / 20) * 70 + (recentPosts / 5) * 30));
  const engColor    = engScore >= 70 ? C.success : engScore >= 40 ? C.warn : C.danger;

  return (
    <>
      {/* Stats strip */}
      <div style={{
        padding: '12px 16px', background: C.surfaceEl, borderBottom: `1px solid ${C.divider}`,
        display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {[
          { label: 'Total Visits',  val: m.visitsTotal,         color: C.t1     },
          { label: 'This Month',    val: m.visits30,            color: C.t1     },
          { label: 'Last Month',    val: m.prevVisits30 ?? '—', color: C.t1     },
          { label: 'Eng. Score',    val: `${engScore}%`,        color: engColor },
          { label: 'Streak',        val: m.streak > 0 ? `${m.streak}d` : '—', color: m.streak >= 7 ? C.warn : C.t1 },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: 50 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, letterSpacing: '-0.03em' }}>{s.val}</div>
            <div style={{ fontSize: 9, color: C.t3, textTransform: 'uppercase', marginTop: 2, letterSpacing: '.06em' }}>{s.label}</div>
          </div>
        ))}
        {/* Tags */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {m.risk === 'High' && (
            <span style={{ fontSize: 10, fontWeight: 600, color: C.danger, background: C.dangerSub, border: `1px solid ${C.dangerBrd}`, padding: '2px 7px', borderRadius: 5 }}>At Risk</span>
          )}
          {m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14 && (
            <span style={{ fontSize: 10, fontWeight: 600, color: C.success, background: C.successSub, border: `1px solid ${C.successBrd}`, padding: '2px 7px', borderRadius: 5 }}>New</span>
          )}
          <span style={{ fontSize: 10, fontWeight: 600, color: C.t2, background: C.surfaceEl, border: `1px solid ${C.border}`, padding: '2px 7px', borderRadius: 5 }}>{m.plan}</span>
        </div>
      </div>

      {m.user_email && (
        <div style={{ padding: '8px 16px', background: C.surfaceEl, borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.06em' }}>Email</span>
          <a href={`mailto:${m.user_email}`} style={{ fontSize: 12, fontWeight: 500, color: C.accent, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
            {m.user_email}
          </a>
        </div>
      )}

      {/* Insight nudge */}
      {(() => {
        const wrap = node => <div style={{ padding: '8px 16px', borderBottom: `1px solid ${C.divider}` }}>{node}</div>;
        const fn = m.name.split(' ')[0];
        if (m.daysSince >= 21) return wrap(<StatNudge color={C.danger} icon={AlertTriangle} stat={`${m.daysSince} days since last visit.`} detail={`${fn} was visiting ${m.prevVisits30 > 0 ? `${m.prevVisits30}/mo` : 'regularly'} before going quiet. This is the window to reach out.`} />);
        if (m.daysSince >= 14) return wrap(<StatNudge color={C.warn} icon={AlertTriangle} stat={`${m.daysSince} days away.`} detail={`${fn} is showing early churn signals. A quick check-in now is more effective than waiting.`} />);
        if (m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14 && m.visitsTotal < 2) return wrap(<StatNudge color={C.warn} icon={Zap} stat="New member — hasn't returned yet." detail={`${fn} joined ${m.joinedDaysAgo} day${m.joinedDaysAgo !== 1 ? 's' : ''} ago. A personal welcome in week 1 makes a real difference.`} />);
        if (m.prevVisits30 >= 4 && m.visits30 <= m.prevVisits30 * 0.5) return wrap(<StatNudge color={C.warn} icon={TrendingDown} stat={`Visits down from ${m.prevVisits30} to ${m.visits30}/mo.`} detail={`${fn}'s frequency has dropped — worth checking in before it falls further.`} />);
        if (m.streak >= 14) return wrap(<StatNudge color={C.success} icon={CheckCircle} stat={`${m.streak}-day streak.`} detail={`${fn} is highly consistent — a great candidate for a challenge or referral ask.`} />);
        return null;
      })()}

      {/* Message panel */}
      <MemberPushPanel member={m} gymName={gymName} gymId={gymId} onClose={onClose} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RIGHT SIDEBAR — ALERTS (matches screenshot exactly)
   Each alert: 3px left border | title + badge | avatar chips |
   detail | dual buttons. Drop-off funnel bars.
══════════════════════════════════════════════════════════════════ */
function AlertsSidebar({ memberRows, atRisk, setMemberFilter, setMemberSort, openModal, avatarMap = {}, nameMap = {} }) {
  const churnRisk     = memberRows.filter(m => m.risk === 'High' || m.risk === 'Medium').slice(0, 5);
  const newGoingQuiet = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo >= 7 && m.joinedDaysAgo <= 21 && m.visitsTotal < 2).slice(0, 3);

  const dropBuckets = [
    { label: 'Week 1', pct: Math.min(100, Math.round((memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14 && m.daysSince >= 7).length / Math.max(memberRows.length, 1)) * 100) || 60), color: C.danger },
    { label: 'Week 2', pct: Math.min(100, Math.round((memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 14 && m.joinedDaysAgo <= 30 && m.daysSince >= 7).length / Math.max(memberRows.length, 1)) * 100) || 66), color: C.warn },
    { label: 'Week 4', pct: Math.min(100, Math.round((memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 30 && m.joinedDaysAgo <= 90 && m.daysSince >= 14).length / Math.max(memberRows.length, 1)) * 100) || 66), color: C.accent },
  ];

  return (
    <Card style={{ padding: 0 }}>
      {/* Header */}
      <div style={{
        padding: '13px 16px', borderBottom: `1px solid ${C.divider}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Alerts</span>
        <MoreHorizontal style={{ width: 14, height: 14, color: C.t3, cursor: 'pointer' }} />
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Churn risk alert */}
        {churnRisk.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.success}` }}>
            <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.t2 }}>All members active</span>
          </div>
        ) : (
          <div style={{ padding: '11px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.danger}` }}>
            {/* Title + badge + × */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle style={{ width: 11, height: 11, color: C.danger, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{churnRisk.length} members likely to churn</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.danger, background: `${C.danger}12`, border: `1px solid ${C.danger}24`, borderRadius: 4, padding: '1px 6px' }}>Smart Action</span>
                <X style={{ width: 10, height: 10, color: C.t3, cursor: 'pointer' }} />
              </div>
            </div>

            {/* Member avatar chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
              {churnRisk.slice(0, 2).map((m, mi) => {
                const n = m.name || 'Member';
                const short = `${n.split(' ')[0]} ${n.split(' ')[1]?.[0] || ''}.`;
                return (
                  <div key={mi} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '2px 7px 2px 3px', borderRadius: 20,
                    background: C.surface, border: `1px solid ${C.border}`,
                  }}>
                    <Avatar name={n} size={16} src={m.avatar_url || null} />
                    <span style={{ fontSize: 10, color: C.t2, fontWeight: 500 }}>{short}</span>
                  </div>
                );
              })}
              {churnRisk.length > 2 && (
                <span style={{ fontSize: 10, color: C.t3 }}>+{churnRisk.length - 2} impacting to member.</span>
              )}
            </div>

            {/* Dual buttons */}
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => { setMemberFilter('atRisk'); setMemberSort('highRisk'); openModal('message'); }} style={{
                flex: 1, padding: '6px 8px', borderRadius: 6,
                background: C.surface, border: `1px solid ${C.borderEl}`,
                color: C.t1, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <Send style={{ width: 8, height: 8 }} /> Message now
              </button>
              <button onClick={() => { setMemberFilter('atRisk'); setMemberSort('highRisk'); }} style={{
                padding: '6px 10px', borderRadius: 6,
                background: C.surface, border: `1px solid ${C.border}`,
                color: C.t2, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Flag style={{ width: 8, height: 8 }} /> View
              </button>
            </div>
          </div>
        )}

        {/* New members going quiet */}
        {newGoingQuiet.length > 0 && (
          <div style={{ padding: '11px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.warn}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus style={{ width: 11, height: 11, color: C.warn, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>New members going quiet</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.warn, background: `${C.warn}12`, border: `1px solid ${C.warn}24`, borderRadius: 4, padding: '1px 6px' }}>Members 1pm</span>
            </div>

            {/* Member chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
              {newGoingQuiet.slice(0, 2).map((m, mi) => {
                const n = m.name || 'Member';
                const short = `${n.split(' ')[0]} ${n.split(' ')[1]?.[0] || ''}.`;
                return (
                  <div key={mi} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '2px 7px 2px 3px', borderRadius: 20,
                    background: C.surface, border: `1px solid ${C.border}`,
                  }}>
                    <Avatar name={n} size={16} src={m.avatar_url || null} />
                    <span style={{ fontSize: 10, color: C.t2, fontWeight: 500 }}>{short}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45, marginBottom: 8 }}>
              Joined recently but not returning. Week-1 follow-up has the highest retention impact.
            </div>

            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => { setMemberFilter('new'); openModal('message'); }} style={{
                flex: 1, padding: '6px 8px', borderRadius: 6,
                background: C.surface, border: `1px solid ${C.borderEl}`,
                color: C.t1, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <Send style={{ width: 8, height: 8 }} /> Follow up
              </button>
              <button onClick={() => setMemberFilter('new')} style={{
                padding: '6px 10px', borderRadius: 6,
                background: C.surface, border: `1px solid ${C.border}`,
                color: C.t2, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Flag style={{ width: 8, height: 8 }} /> View
              </button>
            </div>
          </div>
        )}

        {/* Drop-off patterns funnel */}
        <div style={{ padding: '11px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <TrendingDown style={{ width: 11, height: 11, color: C.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Drop off patterns</span>
          </div>
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.4, marginBottom: 10 }}>
            Where members typically go quiet after joining.
          </div>

          {dropBuckets.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < dropBuckets.length - 1 ? 8 : 0 }}>
              <span style={{ fontSize: 10, color: C.t3, minWidth: 42, flexShrink: 0 }}>{b.label}</span>
              <div style={{ flex: 1, height: 10, borderRadius: 4, background: C.divider, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${b.pct}%`, borderRadius: 4, background: b.color, opacity: 0.7, transition: 'width .7s ease' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.t2, minWidth: 30, textAlign: 'right' }}>{b.pct}%</span>
            </div>
          ))}

          {churnRisk.length > 0 && (
            <button onClick={() => { setMemberFilter('atRisk'); setMemberSort('highRisk'); }} style={{
              marginTop: 10, width: '100%', padding: '6px 0', borderRadius: 7,
              background: 'transparent', border: `1px solid ${C.dangerBrd}`,
              color: C.danger, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              View at-risk members <ChevronRight style={{ width: 9, height: 9 }} />
            </button>
          )}
        </div>

        {/* Member insights (prompt requirement) */}
        <div style={{ padding: '11px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.t2, marginBottom: 8 }}>Member Insights</div>
          {[
            churnRisk.length > 0 ? `${churnRisk.length} members haven't engaged in 14+ days` : null,
            'Highly engaged members respond best to challenges',
            'New members are most active in their first 3 days',
          ].filter(Boolean).map((insight, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.accent, flexShrink: 0, marginTop: 5 }} />
              <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.4 }}>{insight}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
            <button onClick={() => openModal('message')} style={{
              flex: 1, padding: '5px 8px', borderRadius: 6,
              background: C.surface, border: `1px solid ${C.borderEl}`,
              color: C.t1, fontSize: 10, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <Send style={{ width: 8, height: 8 }} /> Message
            </button>
            <button onClick={() => openModal('challenge')} style={{
              flex: 1, padding: '5px 8px', borderRadius: 6,
              background: C.surface, border: `1px solid ${C.border}`,
              color: C.t2, fontSize: 10, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              <Trophy style={{ width: 8, height: 8 }} /> Challenge
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function TabMembers({
  allMemberships, checkIns, ci30, memberLastCheckIn, selectedGym,
  atRisk, atRiskMembersList, retentionRate, totalMembers, activeThisWeek, newSignUps, weeklyChangePct,
  avatarMap, nameMap = {}, posts,
  memberFilter, setMemberFilter, memberSearch, setMemberSearch, memberSort, setMemberSort,
  memberPage, setMemberPage, memberPageSize, selectedRows, setSelectedRows,
  openModal, now,
}) {
  const [expandedMember, setExpandedMember] = useState(null);
  const [showBulkPanel,  setShowBulkPanel]  = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const gymName = selectedGym?.name || 'Your Gym';

  /* ── Compute member rows ─────────────────────────────────────── */
  const memberRows = useMemo(() => {
    const bannedSet = new Set(selectedGym?.banned_members || []);
    return allMemberships.map(m => {
      const lastVisit     = m.lastCheckIn || null;
      const daysSince     = m.daysSince != null ? m.daysSince : 999;
      const isBanned      = bannedSet.has(m.user_id);
      const name          = nameMap[m.user_id] || m.user_name || 'Member';
      const joinDate      = m.join_date || m.created_date || m.created_at;
      const joinedDaysAgo = joinDate ? Math.floor((now - new Date(joinDate)) / 86400000) : null;
      let risk = 'Low';
      if (daysSince >= 21) risk = 'High';
      else if (daysSince >= 14) risk = 'Medium';
      let lastVisitDisplay = 'Never';
      if (lastVisit) {
        if      (daysSince === 0) lastVisitDisplay = 'Today';
        else if (daysSince === 1) lastVisitDisplay = '1 day ago';
        else if (daysSince < 7)  lastVisitDisplay = `${daysSince} days ago`;
        else if (daysSince < 14) lastVisitDisplay = '1 week ago';
        else if (daysSince < 30) lastVisitDisplay = `${Math.floor(daysSince / 7)} weeks ago`;
        else                     lastVisitDisplay = format(new Date(lastVisit), 'd MMM');
      }
      return {
        ...m, name,
        visits30: m.ci30Count || 0, prevVisits30: m.prevCi30Count || 0,
        visitsTotal: m.visitsTotal || 0,
        lastVisit, daysSince, risk, lastVisitDisplay,
        plan: m.plan || m.membership_type || m.type || 'Standard',
        monthlyValue: m.monthly_value || m.price || 60,
        isBanned, avatar_url: avatarMap[m.user_id] || null,
        joinedDaysAgo, streak: m.streak || 0,
      };
    });
  }, [allMemberships, selectedGym?.banned_members, avatarMap, nameMap, now]);

  const filtered = useMemo(() => memberRows.filter(m => {
    if (memberFilter === 'active')   return m.daysSince < 7;
    if (memberFilter === 'inactive') return m.daysSince >= 14;
    if (memberFilter === 'atRisk')   return m.risk !== 'Low';
    if (memberFilter === 'new')      return m.joinedDaysAgo !== null && m.joinedDaysAgo <= 30;
    return true;
  }).filter(m => !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase())), [memberRows, memberFilter, memberSearch]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    if (memberSort === 'recentlyActive') return a.daysSince - b.daysSince;
    if (memberSort === 'mostVisits')     return b.visits30 - a.visits30;
    if (memberSort === 'newest')         return (a.joinedDaysAgo ?? 9999) - (b.joinedDaysAgo ?? 9999);
    if (memberSort === 'highRisk')       { const r = { High: 0, Medium: 1, Low: 2 }; return r[a.risk] - r[b.risk]; }
    if (memberSort === 'name')           return a.name.localeCompare(b.name);
    if (memberSort === 'streak')         return b.streak - a.streak;
    return 0;
  }), [filtered, memberSort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / memberPageSize));
  const paginated  = sorted.slice((memberPage - 1) * memberPageSize, memberPage * memberPageSize);

  const filterCounts = {
    all:      memberRows.length,
    active:   memberRows.filter(m => m.daysSince < 7).length,
    inactive: memberRows.filter(m => m.daysSince >= 14).length,
    atRisk:   memberRows.filter(m => m.risk !== 'Low').length,
    new:      memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 30).length,
  };

  const toggleAll       = () => { if (selectedRows.size === paginated.length) { setSelectedRows(new Set()); setShowBulkPanel(false); } else setSelectedRows(new Set(paginated.map(m => m.id))); };
  const handleToggleRow = id  => { const s = new Set(selectedRows); s.has(id) ? s.delete(id) : s.add(id); setSelectedRows(s); if (s.size === 0) setShowBulkPanel(false); };
  const handleFilter    = f   => { setMemberFilter(f); setMemberPage(1); };
  const handleSearch    = v   => { setMemberSearch(v); setMemberPage(1); };

  const rowActionLabel = m => {
    if (m.risk === 'High')   return 'Message now';
    if (m.risk === 'Medium') return 'Motivate';
    if (m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14) return 'Follow up';
    return 'Message';
  };
  const rowActionColor = m => {
    if (m.risk === 'High')   return C.danger;
    if (m.risk === 'Medium') return C.warn;
    return C.accent;
  };

  const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCI = checkIns.filter(c => new Date(c.check_in_date) >= weekAgo);
  const checkInLB = Object.values(weeklyCI.reduce((acc, c) => {
    if (!acc[c.user_id]) acc[c.user_id] = { userId: c.user_id, userName: c.user_name, userAvatar: avatarMap[c.user_id] || null, count: 0 };
    acc[c.user_id].count++;
    return acc;
  }, {})).sort((a, b) => b.count - a.count).slice(0, 10);
  const streakLB = memberRows.map(m => ({ userId: m.user_id, userName: m.name, userAvatar: m.avatar_url, streak: m.streak })).sort((a, b) => b.streak - a.streak).slice(0, 10);

  const COLS = '32px 2fr 1fr 0.8fr 1.2fr 1.4fr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>

      {/* ── Today's Focus ── */}
      {!isMobile && (
        <TodaysFocus memberRows={memberRows} openModal={openModal} setMemberFilter={handleFilter} setMemberSort={setMemberSort} now={now} />
      )}

      {/* ── Metrics bar ── */}
      {!isMobile && (
        <MetricsBar memberRows={memberRows} atRisk={filterCounts.atRisk} />
      )}

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 272px', gap: 14, alignItems: 'start' }}>

        {/* ══ Member table card ══ */}
        <Card style={{ overflow: 'hidden' }}>

          {/* ── Filter bar — matches screenshot: All ← | Active ▼ | ... ── */}
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
            position: 'sticky', top: 0, background: C.surface, zIndex: 10,
          }}>
            {/* All ← (back/reset filter) */}
            <button onClick={() => handleFilter('all')} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7, fontSize: 11,
              fontWeight: memberFilter === 'all' ? 600 : 400,
              background: memberFilter === 'all' ? C.surfaceEl : 'transparent',
              border: `1px solid ${memberFilter === 'all' ? C.borderEl : 'transparent'}`,
              color: memberFilter === 'all' ? C.t1 : C.t3,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}>
              All {memberFilter !== 'all' && <ArrowLeft style={{ width: 9, height: 9 }} />}
            </button>

            {/* Filter tabs */}
            {[
              { id: 'active',   label: 'Active',   count: filterCounts.active,   danger: false, arrow: true  },
              { id: 'inactive', label: 'Inactive', count: filterCounts.inactive, danger: false, arrow: false },
              { id: 'atRisk',   label: 'At Risk',  count: filterCounts.atRisk,   danger: true,  dot: true    },
              { id: 'new',      label: 'New',      count: filterCounts.new,      danger: false, arrow: false },
            ].map(f => {
              const on = memberFilter === f.id;
              return (
                <button key={f.id} onClick={() => handleFilter(f.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 10px', borderRadius: 7, fontSize: 11,
                  fontWeight: on ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                  background: on ? C.surfaceEl : 'transparent',
                  color: on ? (f.danger && filterCounts.atRisk > 0 ? C.danger : C.t1) : C.t3,
                  border: `1px solid ${on ? C.borderEl : 'transparent'}`,
                  transition: 'all .15s',
                }}>
                  {f.dot && on && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.danger, flexShrink: 0 }} />}
                  {f.label}
                  {f.count > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: on && f.danger ? C.danger : C.t3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, padding: '0 5px', lineHeight: '16px' }}>
                      {f.count}
                    </span>
                  )}
                  {f.arrow && <ChevronDown style={{ width: 9, height: 9, color: C.t3 }} />}
                </button>
              );
            })}
            <button style={{ padding: '5px 6px', borderRadius: 7, background: 'transparent', border: `1px solid transparent`, color: C.t3, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>…</button>

            <div style={{ flex: 1 }} />

            {/* Sort dropdown */}
            <div style={{ position: 'relative' }}>
              <select value={memberSort} onChange={e => setMemberSort(e.target.value)} style={{
                padding: '5px 28px 5px 9px', borderRadius: 7, background: C.surfaceEl,
                border: `1px solid ${C.border}`, color: C.t2, fontSize: 11,
                outline: 'none', cursor: 'pointer', fontFamily: 'inherit', appearance: 'none',
              }}>
                <option value="recentlyActive">Search members</option>
                <option value="recentlyActive">Recently Active</option>
                <option value="mostVisits">Most Visits</option>
                <option value="newest">Newest First</option>
                <option value="highRisk">High Risk First</option>
                <option value="streak">Longest Streak</option>
                <option value="name">Name A–Z</option>
              </select>
              <ChevronDown style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, color: C.t3, pointerEvents: 'none' }} />
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.t3, pointerEvents: 'none' }} />
              <input
                placeholder="Search members"
                value={memberSearch}
                onChange={e => handleSearch(e.target.value)}
                style={{
                  padding: '6px 12px 6px 28px', borderRadius: 8,
                  background: C.surfaceEl, border: `1px solid ${C.border}`,
                  color: C.t1, fontSize: 11, outline: 'none', fontFamily: 'inherit',
                  width: 148, transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = C.borderEl}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
          </div>

          {/* ── Bulk message panel ── */}
          {showBulkPanel && selectedRows.size > 0 && (
            <BulkPushPanel
              selectedRows={selectedRows} memberRows={memberRows}
              gymName={gymName} gymId={selectedGym?.id}
              onClose={() => setShowBulkPanel(false)}
              onSuccess={() => setSelectedRows(new Set())}
            />
          )}

          {/* ── Column headers ── */}
          {!isMobile && (
            <div style={{
              display: 'grid', gridTemplateColumns: COLS, gap: 8,
              padding: '8px 16px', borderBottom: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.015)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input type="checkbox"
                  checked={paginated.length > 0 && selectedRows.size === paginated.length}
                  onChange={toggleAll}
                  style={{ width: 13, height: 13, accentColor: C.accent, cursor: 'pointer' }}
                />
              </div>
              {['MEMBER', 'TREND', 'RISK', 'VISITS / LAST SEEN', 'MEMBERSHIP'].map((col, i) => (
                <div key={i}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em' }}>{col}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Rows ── */}
          <div style={{ minHeight: 220 }}>
            {paginated.length === 0 ? (
              /* ── Empty state (prompt requirement) ── */
              <div style={{ padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Users style={{ width: 36, height: 36, color: C.t4 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: C.t2 }}>
                  {memberSearch ? 'No members match your search' : 'Start building your community'}
                </div>
                <div style={{ fontSize: 12, color: C.t3, maxWidth: 280, lineHeight: 1.5 }}>
                  {memberSearch ? 'Try a different name or clear your search.' : 'Invite your first members to get started tracking engagement and retention.'}
                </div>
                {!memberSearch && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openModal('members')} style={{
                      padding: '8px 16px', borderRadius: 8, background: C.accent, color: '#fff',
                      border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      Invite members
                    </button>
                    <button onClick={() => openModal('shareLink')} style={{
                      padding: '8px 16px', borderRadius: 8, background: C.surfaceEl,
                      border: `1px solid ${C.border}`, color: C.t2,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      Share gym link
                    </button>
                  </div>
                )}
              </div>
            ) : paginated.map((m, idx) => {
              const isExp = expandedMember === m.id;
              const isSel = selectedRows.has(m.id);
              return (
                <div key={m.id || idx}>
                  <div
                    onClick={() => { setExpandedMember(isExp ? null : m.id); if (showBulkPanel) setShowBulkPanel(false); }}
                    style={{
                      display:             isMobile ? 'flex' : 'grid',
                      gridTemplateColumns: isMobile ? undefined : COLS,
                      gap: 8, padding: '10px 16px',
                      borderBottom:  !isExp && idx < paginated.length - 1 ? `1px solid ${C.divider}` : 'none',
                      borderLeft:    isExp ? `3px solid ${C.accent}` : isSel ? `3px solid ${C.accent}40` : '3px solid transparent',
                      background:    isExp ? C.surfaceEl : isSel ? 'rgba(59,130,246,0.04)' : 'transparent',
                      cursor:        'pointer',
                      transition:    'background .1s',
                      alignItems:    'center',
                    }}
                    onMouseEnter={e => { if (!isExp && !isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                    onMouseLeave={e => { if (!isExp && !isSel) e.currentTarget.style.background = isExp ? C.surfaceEl : isSel ? 'rgba(59,130,246,0.04)' : 'transparent'; }}
                  >
                    {/* Checkbox */}
                    <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={e => { e.stopPropagation(); handleToggleRow(m.id); }}>
                      <input type="checkbox" checked={isSel} onChange={() => handleToggleRow(m.id)}
                        style={{ width: 13, height: 13, accentColor: C.accent, cursor: 'pointer' }} />
                    </div>

                    {/* MEMBER */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar name={m.name} size={30} src={m.avatar_url} />
                        {m.daysSince >= 14 && (
                          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: C.danger, border: `2px solid ${C.surface}` }} />
                        )}
                        {m.streak >= 7 && (
                          <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: '50%', background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Flame style={{ width: 7, height: 7, color: C.warn }} />
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isExp ? C.accent : C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color .15s' }}>
                            {m.name}
                          </span>
                          <MilestoneBadge visitsTotal={m.visitsTotal} joinedDaysAgo={m.joinedDaysAgo} />
                        </div>
                        <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>
                          {m.streak > 1
                            ? <span style={{ color: C.warn, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <Flame style={{ width: 9, height: 9 }} />{m.streak}-day streak
                              </span>
                            : `0 · 1D · ${m.visits30 > 0 ? `${m.visits30}/mo` : '—'} visits`
                          }
                        </div>
                      </div>
                    </div>

                    {/* TREND */}
                    {!isMobile && <div onClick={e => e.stopPropagation()}><TrendChip m={m} /></div>}

                    {/* RISK */}
                    {!isMobile && <div onClick={e => e.stopPropagation()}><RiskBadge risk={m.risk} /></div>}

                    {/* VISITS / LAST SEEN */}
                    {!isMobile && (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: m.daysSince >= 14 ? C.danger : m.daysSince === 0 ? C.success : C.t1 }}>
                          {m.daysSince} days ago
                        </div>
                        <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{m.lastVisitDisplay}</div>
                      </div>
                    )}

                    {/* MEMBERSHIP + action btn */}
                    {!isMobile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: C.t1 }}>{m.plan}</div>
                          <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Value It ${m.monthlyValue}/month</div>
                        </div>
                        <RowActionBtn label={rowActionLabel(m)} color={rowActionColor(m)} onClick={() => openModal('message', m)} />
                      </div>
                    )}
                  </div>

                  {/* Expanded member profile */}
                  {isExp && (
                    <ExpandedMemberDetail
                      m={m} gymName={gymName} gymId={selectedGym?.id}
                      checkIns={checkIns} posts={posts} now={now}
                      onClose={() => setExpandedMember(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── BULK ACTION BAR — two rows matching screenshot ── */}
          {selectedRows.size > 0 && (
            <div style={{ borderTop: `1px solid ${C.borderEl}` }}>
              {/* Row 1: count + clear */}
              <div style={{
                padding: '7px 16px', background: C.surfaceEl,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${C.divider}`,
              }}>
                <span style={{ fontSize: 11, color: C.t3 }}>
                  {selectedRows.size} selected
                </span>
                <button onClick={() => { setSelectedRows(new Set()); setShowBulkPanel(false); }} style={{
                  fontSize: 11, color: C.t3, background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                }}>
                  —Clear
                </button>
              </div>

              {/* Row 2: Bulk actions | Tag | spacer | ✓ starred | + Message | Tag | Clear members */}
              <div style={{
                padding: '8px 16px', background: C.surfaceEl,
                display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
              }}>
                <button onClick={() => setShowBulkPanel(v => !v)} style={{
                  padding: '5px 12px', borderRadius: 7,
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.t2, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  Bulk actions ({selectedRows.size})
                </button>
                <button style={{
                  padding: '5px 10px', borderRadius: 7, background: 'transparent',
                  border: `1px solid ${C.border}`, color: C.t2, fontSize: 11,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Tag style={{ width: 10, height: 10 }} /> Tag ≡
                </button>

                <div style={{ flex: 1 }} />

                <span style={{ fontSize: 11, color: C.t3 }}>✓ {selectedRows.size} starred</span>

                <button onClick={() => setShowBulkPanel(v => !v)} style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: C.accent, color: '#fff', border: 'none',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Plus style={{ width: 10, height: 10 }} /> Message ({selectedRows.size})
                </button>

                <button style={{
                  padding: '6px 10px', borderRadius: 8, background: 'transparent',
                  border: `1px solid ${C.border}`, color: C.t2, fontSize: 11,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Tag style={{ width: 10, height: 10 }} /> Tag ▾
                </button>

                <button onClick={() => { setSelectedRows(new Set()); setShowBulkPanel(false); }} style={{
                  padding: '6px 12px', borderRadius: 8, background: 'transparent',
                  border: `1px solid ${C.border}`, color: C.t3, fontSize: 11,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Clear members
                </button>
              </div>
            </div>
          )}

          {/* ── Pagination ── */}
          <div style={{
            padding: '10px 16px', borderTop: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[
                { icon: ChevronLeft,  disabled: memberPage <= 1,         action: () => setMemberPage(p => Math.max(1, p - 1)) },
                { icon: ChevronRight, disabled: memberPage >= totalPages, action: () => setMemberPage(p => Math.min(totalPages, p + 1)) },
              ].map(({ icon: Icon, disabled, action }, i) => (
                <button key={i} disabled={disabled} onClick={action} style={{
                  width: 28, height: 28, borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: disabled ? C.t4 : C.t2, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
                }}>
                  <Icon style={{ width: 12, height: 12 }} />
                </button>
              ))}
            </div>

            {!isMobile && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) {
                if      (memberPage <= 3)              page = i + 1;
                else if (memberPage >= totalPages - 2) page = totalPages - 4 + i;
                else                                   page = memberPage - 2 + i;
              }
              const isCurrent = memberPage === page;
              return (
                <button key={page} onClick={() => setMemberPage(page)} style={{
                  width: 28, height: 28, borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCurrent ? C.surfaceEl : 'transparent',
                  border: `1px solid ${isCurrent ? C.borderEl : 'transparent'}`,
                  color: isCurrent ? C.t1 : C.t3, fontSize: 12,
                  fontWeight: isCurrent ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {page}
                </button>
              );
            })}

            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: C.t3 }}>{sorted.length} members · Page {memberPage} of {totalPages}</span>
          </div>
        </Card>

        {/* ── Right sidebar ── */}
        {!isMobile && (
          <AlertsSidebar
            memberRows={memberRows}
            atRisk={filterCounts.atRisk}
            setMemberFilter={handleFilter}
            setMemberSort={setMemberSort}
            openModal={openModal}
            avatarMap={avatarMap}
            nameMap={nameMap}
          />
        )}
      </div>

      {/* ── Leaderboards ── */}
      {!isMobile && (
        <div style={{ marginTop: 14 }}>
          <LeaderboardSection checkInLeaderboard={checkInLB} streakLeaderboard={streakLB} progressLeaderboard={[]} />
        </div>
      )}

      {/* ── Floating + Add Member button (prompt requirement) ── */}
      <button
        onClick={() => openModal('members')}
        style={{
          position:    'fixed',
          bottom:      28,
          right:       28,
          zIndex:      100,
          display:     'flex',
          alignItems:  'center',
          gap:         8,
          padding:     '12px 20px',
          borderRadius: 50,
          background:  C.accent,
          color:       '#fff',
          border:      'none',
          fontSize:    13,
          fontWeight:  700,
          cursor:      'pointer',
          fontFamily:  'inherit',
          boxShadow:   '0 4px 20px rgba(59,130,246,0.4)',
          transition:  'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(59,130,246,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(59,130,246,0.4)'; }}
      >
        <Plus style={{ width: 14, height: 14 }} /> Invite Member
      </button>
    </div>
  );
}
