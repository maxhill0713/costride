/**
 * TabMembers — v2 matching screenshot
 *
 * Layout changes vs v1:
 *   - TodaysFocus panel at top: 3 inline action rows (colored left border,
 *     impact text, CTA button right-aligned)
 *   - Table columns: MEMBER | TREND | RISK | VISITS / LAST SEEN | MEMBERSHIP
 *     with per-row context-aware action buttons
 *   - Bottom bulk bar: Bulk actions · Tag · + Message (N) · Clear members
 *   - Right sidebar Alerts: member avatar stacks + dual buttons per alert,
 *     Drop-off funnel visualization
 *
 * All tokens and hierarchy rules from v1 preserved.
 */

import React, { useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  Plus, Search, ChevronLeft, ChevronRight, ChevronDown,
  Users, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  UserPlus, Bell, X, Check,
  Zap, History, Flag,
  MoreHorizontal, Mail, GraduationCap, Copy,
  Flame, Send, Clock, Trophy, Tag, MessageSquare,
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

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 8 }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TODAY'S FOCUS PANEL (new)
   3–4 action rows. Each: colored left indicator, title + impact, CTA button.
══════════════════════════════════════════════════════════════════ */
function TodaysFocus({ memberRows, openModal, setMemberFilter, setMemberSort, now }) {
  const items = useMemo(() => {
    const list = [];

    // Churn risk
    const churnRisk = memberRows.filter(m => m.risk === 'High' || m.risk === 'Medium');
    if (churnRisk.length > 0) {
      const estLoss = churnRisk.reduce((s, m) => s + (m.monthlyValue || 60), 0);
      list.push({
        priority:    1,
        color:       C.danger,
        icon:        AlertTriangle,
        title:       `${churnRisk.length} member${churnRisk.length > 1 ? 's' : ''} likely to churn`,
        impact:      `Could lose $${estLoss}/month`,
        cta:         'Message now',
        ctaIcon:     Send,
        fn:          () => { setMemberFilter('atRisk'); setMemberSort('highRisk'); },
      });
    }

    // New members not returned
    const newNoReturn = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo >= 7 && m.joinedDaysAgo <= 21 && m.visitsTotal < 2);
    if (newNoReturn.length > 0) {
      list.push({
        priority:    2,
        color:       C.success,
        icon:        UserPlus,
        title:       `${newNoReturn.length} new member${newNoReturn.length > 1 ? 's' : ''} ${newNoReturn.length === 1 ? "hasn't" : "haven't"} returned in a week`,
        impact:      'Help them build a habit',
        cta:         'Follow up',
        ctaIcon:     Bell,
        fn:          () => { setMemberFilter('new'); },
      });
    }

    // Below weekly target
    const belowTarget = memberRows.filter(m => m.visits30 > 0 && m.visits30 < 4 && m.daysSince < 14);
    if (belowTarget.length > 0) {
      list.push({
        priority:    3,
        color:       C.accent,
        icon:        TrendingDown,
        title:       `${belowTarget.length} member${belowTarget.length > 1 ? 's' : ''} below weekly target`,
        impact:      'Nudge them',
        cta:         'Nudge',
        ctaIcon:     Bell,
        fn:          () => openModal('message'),
      });
    }

    // Frequency drop
    const freqDrop = memberRows.filter(m => m.prevVisits30 >= 4 && m.visits30 <= m.prevVisits30 * 0.5);
    if (freqDrop.length > 0) {
      list.push({
        priority:    4,
        color:       C.warn,
        icon:        TrendingDown,
        title:       `${freqDrop.length} member${freqDrop.length > 1 ? 's' : ''} visiting less than usual`,
        impact:      'Early churn signal',
        cta:         'Reach out',
        ctaIcon:     MessageSquare,
        fn:          () => openModal('message'),
      });
    }

    return list.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [memberRows]);

  if (items.length === 0) return null;

  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{
        padding: '12px 18px',
        borderBottom: `1px solid ${C.divider}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame style={{ width: 14, height: 14, color: C.warn }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Today's Focus</span>
        </div>
        <button style={{ background: 'none', border: 'none', color: C.t3, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
          Rethacll
        </button>
      </div>

      {items.map((item, i) => {
        const Icon    = item.icon;
        const CtaIcon = item.ctaIcon;
        const isLast  = i === items.length - 1;
        return (
          <div key={i} style={{
            display:      'flex',
            alignItems:   'center',
            gap:          12,
            padding:      '11px 18px',
            borderBottom: isLast ? 'none' : `1px solid ${C.divider}`,
            borderLeft:   `3px solid ${item.color}`,
          }}>
            {/* Icon */}
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: `${item.color}12`, border: `1px solid ${item.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon style={{ width: 11, height: 11, color: item.color }} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{item.title}</span>
              {item.impact && (
                <span style={{ fontSize: 12, color: C.t3, marginLeft: 6 }}>— {item.impact}</span>
              )}
            </div>

            {/* CTA */}
            <button onClick={item.fn} style={{
              display:     'flex',
              alignItems:  'center',
              gap:         5,
              padding:     '6px 12px',
              borderRadius: 7,
              background:  C.surfaceEl,
              border:      `1px solid ${C.borderEl}`,
              color:       C.t1,
              fontSize:    11,
              fontWeight:  600,
              cursor:      'pointer',
              fontFamily:  'inherit',
              flexShrink:  0,
              whiteSpace:  'nowrap',
            }}>
              <CtaIcon style={{ width: 9, height: 9 }} /> {item.cta}
              <ChevronDown style={{ width: 9, height: 9, color: C.t3 }} />
            </button>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TREND CHIP — matches screenshot's TREND column
   Shows a bar indicator + label
══════════════════════════════════════════════════════════════════ */
function TrendChip({ m }) {
  const isNew     = m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14;
  const isHigh    = m.risk === 'High';
  const isMedium  = m.risk === 'Medium';

  if (isNew) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 700, padding: '3px 8px',
        borderRadius: 6, background: C.successSub,
        color: C.success, border: `1px solid ${C.successBrd}`,
      }}>
        New
      </span>
    );
  }
  if (isHigh) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '3px 8px',
          borderRadius: 6, background: C.dangerSub,
          color: C.danger, border: `1px solid ${C.dangerBrd}`,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, padding: '3px 8px',
          borderRadius: 6, background: C.warnSub,
          color: C.warn, border: `1px solid ${C.warnBrd}`,
        }}>
          <TrendingDown style={{ width: 8, height: 8 }} /> Medium
        </span>
        <div style={{ height: 3, borderRadius: 99, background: C.divider, width: 52 }}>
          <div style={{ height: '100%', width: '50%', background: C.warn, borderRadius: 99 }} />
        </div>
      </div>
    );
  }
  // Low / active
  const pctDrop = m.prevVisits30 > 0 ? Math.round(((m.visits30 - m.prevVisits30) / m.prevVisits30) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {pctDrop > 10
          ? <TrendingUp style={{ width: 9, height: 9, color: C.success }} />
          : pctDrop < -10
          ? <TrendingDown style={{ width: 9, height: 9, color: C.danger }} />
          : <div style={{ width: 9, height: 2, borderRadius: 99, background: C.t4 }} />}
        <span style={{ fontSize: 10, fontWeight: 500, color: C.t3 }}>
          {pctDrop > 10 ? `+${pctDrop}%` : pctDrop < -10 ? `${pctDrop}%` : 'Stable'}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 99, background: C.divider, width: 52 }}>
        <div style={{ height: '100%', width: `${Math.max(10, Math.min(100, 50 + pctDrop))}%`, background: pctDrop < -10 ? C.danger : C.accent, borderRadius: 99, opacity: 0.6 }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PER-ROW ACTION BUTTON — context-aware dropdown style
══════════════════════════════════════════════════════════════════ */
function RowActionBtn({ label, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick && onClick(); }}
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
        whiteSpace: 'nowrap', transition: 'all .15s',
        flexShrink: 0,
      }}
    >
      {label} <ChevronDown style={{ width: 8, height: 8 }} />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RISK BADGE
══════════════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════════════
   MILESTONE BADGE
══════════════════════════════════════════════════════════════════ */
function MilestoneBadge({ visitsTotal, joinedDaysAgo }) {
  let label = null;
  if      (visitsTotal === 1)                            label = '1st visit';
  else if (visitsTotal === 10)                           label = '10 visits';
  else if (visitsTotal === 25)                           label = '25 visits';
  else if (visitsTotal === 50)                           label = '50 visits';
  else if (visitsTotal === 100)                          label = '100 visits';
  else if (joinedDaysAgo !== null && joinedDaysAgo <= 7) label = 'New';
  if (!label) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 600, color: C.warn,
      background: C.warnSub, border: `1px solid ${C.warnBrd}`,
      padding: '2px 6px', borderRadius: 5,
    }}>
      {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAT NUDGE
══════════════════════════════════════════════════════════════════ */
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
   MESSAGE TEMPLATES + COMPONENTS (preserved from v1)
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

/* ══════════════════════════════════════════════════════════════════
   MEMBER PUSH PANEL
══════════════════════════════════════════════════════════════════ */
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
        <button onClick={onClose} style={{
          width: 24, height: 24, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: `1px solid ${C.border}`, cursor: 'pointer',
        }}>
          <X style={{ width: 10, height: 10, color: C.t3 }} />
        </button>
      </div>
      <ModeToggle mode={mode} setMode={setMode} />
      {mode === 'preset' ? <PresetGrid preset={preset} setPreset={setPreset} /> : (
        <textarea value={custom} onChange={e => setCustom(e.target.value)}
          placeholder={`Write a message to ${firstName}…`} rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', marginBottom: 10,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '8px 10px', fontSize: 11,
            color: C.t1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
          }}
          onFocus={e => e.target.style.borderColor = C.accentBrd}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      )}
      {message && (
        <div style={{
          margin: '10px 0', padding: '9px 11px', borderRadius: 8,
          background: C.surface, border: `1px solid ${C.border}`,
          borderLeft: `2px solid ${C.accent}`, fontSize: 11, color: C.t2, lineHeight: 1.6,
        }}>
          {message}
        </div>
      )}
      <SendBtn onClick={handleSend} disabled={!message.trim()} sending={sending} sent={sent} label={`Send to ${firstName}`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BULK PUSH PANEL (preserved from v1)
══════════════════════════════════════════════════════════════════ */
function BulkPushPanel({ selectedRows, memberRows, gymName, gymId, onClose, onSuccess }) {
  const [preset, setPreset] = useState('miss');
  const [custom, setCustom] = useState('');
  const [mode, setMode] = useState('preset');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const members     = memberRows.filter(m => selectedRows.has(m.id));
  const memberCount = members.length;
  const buildMsg    = (p, name) => PRESET_MESSAGES.find(x => x.id === p)?.body(gymName, name) || '';
  const preview     = mode === 'preset' ? buildMsg(preset, members[0]?.name.split(' ')[0] || 'there') : custom;

  const handleSend = async () => {
    if (!preview.trim() || sending) return;
    setSending(true);
    try {
      if (mode === 'preset') {
        await Promise.all(members.map(m => base44.functions.invoke('sendPushNotification', {
          gym_id: gymId, gym_name: gymName, target: 'specific',
          message: buildMsg(preset, m.name.split(' ')[0]), member_ids: [m.user_id],
        })));
      } else {
        await base44.functions.invoke('sendPushNotification', {
          gym_id: gymId, gym_name: gymName, target: 'specific',
          message: preview.trim(), member_ids: members.map(m => m.user_id),
        });
      }
      setSent(true);
      setTimeout(() => { setSent(false); onSuccess(); onClose(); }, 2200);
    } catch { } finally { setSending(false); }
  };

  return (
    <div style={{
      padding: '14px 16px 16px', background: C.surfaceEl,
      borderBottom: `1px solid ${C.divider}`, borderLeft: `3px solid ${C.accent}`,
    }}>
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
            <textarea value={custom} onChange={e => setCustom(e.target.value)}
              placeholder={`Write a message to all ${memberCount} members…`} rows={4}
              style={{ width: '100%', boxSizing: 'border-box', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 11, color: C.t1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = C.accentBrd}
              onBlur={e => e.target.style.borderColor = C.border}
            />
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
   EXPANDED MEMBER DETAIL (preserved from v1)
══════════════════════════════════════════════════════════════════ */
function ExpandedMemberDetail({ m, gymName, gymId, checkIns, posts, now, onClose }) {
  const recentPosts = (posts || []).filter(p => p.user_id === m.user_id && differenceInDays(now, new Date(p.created_at)) <= 30).length;
  const engScore    = Math.min(100, Math.round((m.visits30 / 20) * 70 + (recentPosts / 5) * 30));
  const engColor    = engScore >= 70 ? C.success : engScore >= 40 ? C.warn : C.danger;

  return (
    <>
      <div style={{
        padding: '10px 16px', background: C.surfaceEl,
        borderBottom: `1px solid ${C.divider}`,
        display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {[
          { label: 'Total Visits', val: m.visitsTotal,         color: C.t1     },
          { label: 'This Month',   val: m.visits30,            color: C.t1     },
          { label: 'Last Month',   val: m.prevVisits30 ?? '—', color: C.t1     },
          { label: 'Eng. Score',   val: `${engScore}%`,        color: engColor },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, letterSpacing: '-0.03em' }}>{s.val}</div>
            <div style={{ fontSize: 9, color: C.t3, textTransform: 'uppercase', marginTop: 2, letterSpacing: '.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {m.user_email && (
        <div style={{ padding: '8px 16px', background: C.surfaceEl, borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.06em' }}>Email</span>
          <a href={`mailto:${m.user_email}`} style={{ fontSize: 12, fontWeight: 500, color: C.accent, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
            {m.user_email}
          </a>
        </div>
      )}
      {(() => {
        const wrap = node => <div style={{ padding: '8px 16px', borderBottom: `1px solid ${C.divider}` }}>{node}</div>;
        const fn = m.name.split(' ')[0];
        if (m.daysSince >= 21)
          return wrap(<StatNudge color={C.danger} icon={AlertTriangle} stat={`${m.daysSince} days since last visit.`} detail={`${fn} was visiting ${m.prevVisits30 > 0 ? `${m.prevVisits30}/mo before — now inactive.` : 'regularly before going quiet.'} This is the window to reach out.`} />);
        if (m.daysSince >= 14)
          return wrap(<StatNudge color={C.warn} icon={AlertTriangle} stat={`${m.daysSince} days away.`} detail={`${fn} is showing early churn signals. A quick check-in now is more effective than waiting.`} />);
        if (m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14 && m.visitsTotal < 2)
          return wrap(<StatNudge color={C.warn} icon={Zap} stat="New member — hasn't returned yet." detail={`${fn} joined ${m.joinedDaysAgo} day${m.joinedDaysAgo !== 1 ? 's' : ''} ago. A personal welcome message in the first two weeks makes a real difference.`} />);
        if (m.prevVisits30 >= 4 && m.visits30 <= m.prevVisits30 * 0.5)
          return wrap(<StatNudge color={C.warn} icon={TrendingDown} stat={`Visits down from ${m.prevVisits30} to ${m.visits30} this month.`} detail={`${fn}'s frequency has dropped noticeably — worth checking in before it falls further.`} />);
        if (m.streak >= 14)
          return wrap(<StatNudge color={C.success} icon={CheckCircle} stat={`${m.streak}-day streak.`} detail={`${fn} is highly consistent — a great candidate for a challenge or a referral ask.`} />);
        return null;
      })()}
      <MemberPushPanel member={m} gymName={gymName} gymId={gymId} onClose={onClose} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RIGHT SIDEBAR — ALERTS (redesigned to match screenshot)
   Each alert: colored left border, title, member names + avatar stack,
   dual buttons: "Message now" + "View"
══════════════════════════════════════════════════════════════════ */
function AlertsSidebar({ memberRows, atRisk, atRiskMembersList = [], setMemberFilter, setMemberSort, openModal, avatarMap = {}, nameMap = {} }) {
  const churnRisk      = memberRows.filter(m => m.risk === 'High' || m.risk === 'Medium').slice(0, 5);
  const newGoingQuiet  = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo >= 7 && m.joinedDaysAgo <= 21 && m.visitsTotal < 2).slice(0, 3);
  const freqDrop       = memberRows.filter(m => m.prevVisits30 >= 4 && m.visits30 <= m.prevVisits30 * 0.5).slice(0, 2);

  const alerts = [];
  if (churnRisk.length > 0) {
    alerts.push({
      color:   C.danger,
      icon:    AlertTriangle,
      title:   `${churnRisk.length} members likely to churn`,
      badge:   'Smart Action',
      badgeColor: C.danger,
      detail:  `Inactive 14+ days. Direct outreach is the most effective re-engagement method.`,
      members: churnRisk,
      cta1:    'Message now',
      fn1:     () => { setMemberFilter('atRisk'); setMemberSort('highRisk'); openModal('message'); },
      cta2:    'View',
      fn2:     () => { setMemberFilter('atRisk'); setMemberSort('highRisk'); },
    });
  }
  if (newGoingQuiet.length > 0) {
    alerts.push({
      color:   C.warn,
      icon:    UserPlus,
      title:   'New members going quiet',
      badge:   'Members 1pm',
      badgeColor: C.warn,
      detail:  'Number, 6-star local, bat rebar meeting dials, manchins.',
      members: newGoingQuiet,
      cta1:    'Follow up',
      fn1:     () => { setMemberFilter('new'); openModal('message'); },
      cta2:    'View',
      fn2:     () => setMemberFilter('new'),
    });
  }
  if (freqDrop.length > 0) {
    alerts.push({
      color:   C.accent,
      icon:    TrendingDown,
      title:   'Drop off patterns',
      badge:   null,
      detail:  'Members that are transition members type quots...',
      members: [],
      isDropoff: true,
      dropBuckets: [
        { label: 'Week 1', pct: 60 },
        { label: 'Week 2', pct: 66 },
        { label: 'Week 4', pct: 66 },
      ],
      cta1:    null,
      fn1:     null,
      cta2:    null,
      fn2:     null,
    });
  }

  return (
    <Card style={{ padding: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Alerts</span>
        <MoreHorizontal style={{ width: 14, height: 14, color: C.t3, cursor: 'pointer' }} />
      </div>

      {alerts.length === 0 ? (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.success}` }}>
            <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.t2 }}>All members are active</span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((alert, i) => {
            const Icon = alert.icon;
            return (
              <div key={i} style={{
                padding: '11px 12px', borderRadius: 9,
                background: C.surfaceEl, border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${alert.color}`,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                    <Icon style={{ width: 11, height: 11, color: alert.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, lineHeight: 1.3 }}>{alert.title}</span>
                  </div>
                  {alert.badge && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: alert.badgeColor,
                      background: `${alert.badgeColor}12`, border: `1px solid ${alert.badgeColor}24`,
                      borderRadius: 4, padding: '1px 6px', flexShrink: 0, marginLeft: 6,
                    }}>{alert.badge}</span>
                  )}
                </div>

                {/* Member avatar chips */}
                {alert.members.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                    {alert.members.slice(0, 2).map((m, mi) => {
                      const n = m.name || 'Member';
                      const parts = n.split(' ');
                      const short = `${parts[0]} ${parts[1]?.[0] || ''}.`;
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
                    {alert.members.length > 2 && (
                      <span style={{ fontSize: 10, color: C.t3 }}>+{alert.members.length - 2} impacting to member.</span>
                    )}
                  </div>
                )}

                {/* Drop-off funnel (special case) */}
                {alert.isDropoff && alert.dropBuckets && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: C.t3, marginBottom: 8, lineHeight: 1.4 }}>{alert.detail}</div>
                    {alert.dropBuckets.map((b, bi) => (
                      <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <span style={{ fontSize: 10, color: C.t3, minWidth: 44 }}>{b.label}</span>
                        <div style={{ flex: 1, height: 10, borderRadius: 4, background: C.divider, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${b.pct}%`,
                            borderRadius: 4,
                            background: bi === 0 ? C.danger : bi === 1 ? C.warn : C.accent,
                            opacity: 0.7,
                          }} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.t2, minWidth: 32, textAlign: 'right' }}>{b.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detail text */}
                {!alert.isDropoff && (
                  <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45, marginBottom: 8 }}>{alert.detail}</div>
                )}

                {/* Dual CTAs */}
                {(alert.cta1 || alert.cta2) && (
                  <div style={{ display: 'flex', gap: 5 }}>
                    {alert.cta1 && (
                      <button onClick={alert.fn1} style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6,
                        background: C.surface, border: `1px solid ${C.borderEl}`,
                        color: C.t1, fontSize: 10, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}>
                        <Send style={{ width: 8, height: 8 }} /> {alert.cta1}
                      </button>
                    )}
                    {alert.cta2 && (
                      <button onClick={alert.fn2} style={{
                        padding: '5px 10px', borderRadius: 6,
                        background: C.surface, border: `1px solid ${C.border}`,
                        color: C.t2, fontSize: 10, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Flag style={{ width: 8, height: 8 }} /> {alert.cta2}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Drop-off patterns extended */}
          <div style={{
            padding: '11px 12px', borderRadius: 9,
            background: C.surfaceEl, border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.t2, marginBottom: 4 }}>Drop off patterns</div>
            <div style={{ fontSize: 10, color: C.t3, marginBottom: 8, lineHeight: 1.4 }}>
              Worse when members shows to members to goes quiet...
            </div>
            {[
              { label: 'Week 1', pct: 60, color: C.danger  },
              { label: 'Week 2', pct: 45, color: C.warn    },
              { label: 'Week 4', pct: 30, color: C.accent  },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: C.t3, minWidth: 44 }}>{b.label}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.divider, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${b.pct}%`, borderRadius: 4, background: b.color, opacity: 0.65 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.t3, minWidth: 28, textAlign: 'right' }}>{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
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

  // Per-row action button label based on member state
  const rowActionLabel = (m) => {
    if (m.risk === 'High')   return 'Message now';
    if (m.risk === 'Medium') return 'Motivate';
    if (m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14) return 'Follow up';
    return 'Message';
  };

  const rowActionColor = (m) => {
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

  // Table column widths
  const COLS = '32px 2fr 1fr 1fr 1.2fr 1.3fr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Today's Focus */}
      {!isMobile && (
        <TodaysFocus
          memberRows={memberRows}
          openModal={openModal}
          setMemberFilter={handleFilter}
          setMemberSort={setMemberSort}
          now={now}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 272px', gap: 14, alignItems: 'start' }}>

        {/* ── Main member table ── */}
        <Card style={{ overflow: 'hidden' }}>

          {/* Filter bar */}
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
            position: 'sticky', top: 0, background: C.surface, zIndex: 10,
          }}>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {[
                { id: 'all',      label: 'All'           },
                { id: 'active',   label: 'Active'        },
                { id: 'inactive', label: 'Inactive', count: filterCounts.inactive, danger: false },
                { id: 'atRisk',   label: 'At Risk',  count: filterCounts.atRisk,   danger: true  },
                { id: 'new',      label: 'New',      count: filterCounts.new       },
              ].map(f => {
                const on = memberFilter === f.id;
                return (
                  <button key={f.id} onClick={() => handleFilter(f.id)} style={{
                    padding: '5px 10px', borderRadius: 7, fontSize: 11,
                    fontWeight: on ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                    background: on ? C.surfaceEl : 'transparent',
                    color: on ? (f.danger && filterCounts.atRisk > 0 ? C.danger : C.t1) : C.t3,
                    border: `1px solid ${on ? C.borderEl : 'transparent'}`,
                    display: 'flex', alignItems: 'center', gap: 4, transition: 'all .15s',
                  }}>
                    {f.label}
                    {f.count != null && f.count > 0 && (
                      <span style={{
                        fontSize: 9, fontWeight: 700,
                        color: on && f.danger ? C.danger : C.t3,
                        background: 'rgba(255,255,255,0.07)',
                        borderRadius: 99, padding: '0 5px', lineHeight: '16px',
                      }}>{f.count}</span>
                    )}
                  </button>
                );
              })}
              <button style={{ padding: '5px 8px', borderRadius: 7, background: 'transparent', border: `1px solid transparent`, color: C.t3, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>…</button>
            </div>

            <div style={{ flex: 1 }} />

            {/* Search with dropdown */}
            <div style={{ position: 'relative' }}>
              <select value={memberSort} onChange={e => setMemberSort(e.target.value)} style={{
                padding: '5px 9px', borderRadius: 7, background: C.surfaceEl,
                border: `1px solid ${C.border}`, color: C.t2, fontSize: 11,
                outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <option value="recentlyActive">Search members ▾</option>
                <option value="recentlyActive">Recently Active</option>
                <option value="mostVisits">Most Visits</option>
                <option value="newest">Newest First</option>
                <option value="highRisk">High Risk First</option>
                <option value="streak">Longest Streak</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>

            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.t3, pointerEvents: 'none' }} />
              <input
                placeholder="Search members"
                value={memberSearch}
                onChange={e => handleSearch(e.target.value)}
                style={{
                  padding: '6px 12px 6px 28px', borderRadius: 8,
                  background: C.surfaceEl, border: `1px solid ${C.border}`,
                  color: C.t1, fontSize: 12, outline: 'none', fontFamily: 'inherit',
                  width: 150, transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = C.borderEl}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            <button onClick={() => openModal('members')} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8,
              background: C.accent, color: '#fff', border: 'none',
              fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Plus style={{ width: 11, height: 11 }} /> Add Member
            </button>
          </div>

          {/* Bulk notification panel */}
          {showBulkPanel && selectedRows.size > 0 && (
            <BulkPushPanel
              selectedRows={selectedRows} memberRows={memberRows}
              gymName={gymName} gymId={selectedGym?.id}
              onClose={() => setShowBulkPanel(false)}
              onSuccess={() => setSelectedRows(new Set())}
            />
          )}

          {/* Column headers */}
          {!isMobile && (
            <div style={{
              display: 'grid', gridTemplateColumns: COLS, gap: 8,
              padding: '8px 16px', borderBottom: `1px solid ${C.border}`,
              background: 'rgba(255,255,255,0.015)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input type="checkbox" checked={paginated.length > 0 && selectedRows.size === paginated.length} onChange={toggleAll} style={{ width: 13, height: 13, accentColor: C.accent, cursor: 'pointer' }} />
              </div>
              {['MEMBER', 'TREND', 'RISK', 'VISITS / LAST SEEN', 'MEMBERSHIP'].map((col, i) => (
                <div key={i}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em' }}>{col}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rows */}
          <div style={{ minHeight: 240 }}>
            {paginated.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Empty icon={Users} label={memberSearch ? 'No members match your search' : 'No members in this filter'} />
              </div>
            ) : paginated.map((m, idx) => {
              const isExp = expandedMember === m.id;
              const isSel = selectedRows.has(m.id);
              const joinDisplay = m.join_date || m.created_date
                ? format(new Date(m.join_date || m.created_date), 'd MMM yyyy')
                : 'Active member';

              return (
                <div key={m.id || idx}>
                  <div
                    onClick={() => { setExpandedMember(isExp ? null : m.id); if (showBulkPanel) setShowBulkPanel(false); }}
                    style={{
                      display:             isMobile ? 'flex' : 'grid',
                      gridTemplateColumns: isMobile ? undefined : COLS,
                      gap:                 8,
                      padding:             '10px 16px',
                      borderBottom:        !isExp && idx < paginated.length - 1 ? `1px solid ${C.divider}` : 'none',
                      borderLeft:          isExp ? `3px solid ${C.accent}` : isSel ? `3px solid ${C.accent}40` : '3px solid transparent',
                      background:          isExp ? C.surfaceEl : isSel ? 'rgba(81,121,255,0.04)' : 'transparent',
                      cursor:              'pointer',
                      transition:          'background .1s, border-color .1s',
                      alignItems:          'center',
                    }}
                    onMouseEnter={e => { if (!isExp && !isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                    onMouseLeave={e => { if (!isExp && !isSel) e.currentTarget.style.background = isExp ? C.surfaceEl : isSel ? 'rgba(81,121,255,0.04)' : 'transparent'; }}
                  >
                    {/* Checkbox */}
                    <div
                      style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={e => { e.stopPropagation(); handleToggleRow(m.id); }}
                    >
                      <input type="checkbox" checked={isSel} onChange={() => handleToggleRow(m.id)} style={{ width: 13, height: 13, accentColor: C.accent, cursor: 'pointer' }} />
                    </div>

                    {/* MEMBER col */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
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
                            : `0 · 1D · ${m.visits30 > 0 ? `${m.visits30} visit/m/` : '3d'} visits`}
                        </div>
                      </div>
                    </div>

                    {/* TREND col */}
                    {!isMobile && (
                      <div onClick={e => e.stopPropagation()}>
                        <TrendChip m={m} />
                      </div>
                    )}

                    {/* RISK col */}
                    {!isMobile && (
                      <div onClick={e => e.stopPropagation()}>
                        <RiskBadge risk={m.risk} />
                      </div>
                    )}

                    {/* VISITS / LAST SEEN col */}
                    {!isMobile && (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: m.daysSince >= 14 ? C.danger : m.daysSince === 0 ? C.success : C.t1 }}>
                          {m.visits30 > 0 ? `${m.visits30} visits` : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{m.lastVisitDisplay}</div>
                        {m.daysSince >= 14 && (
                          <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{m.daysSince} days ago</div>
                        )}
                      </div>
                    )}

                    {/* MEMBERSHIP col */}
                    {!isMobile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: C.t1 }}>{m.plan}</div>
                          <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>
                            Value It ${m.monthlyValue}/month
                          </div>
                        </div>
                        <RowActionBtn
                          label={rowActionLabel(m)}
                          color={rowActionColor(m)}
                          onClick={() => openModal('message', m)}
                        />
                      </div>
                    )}
                  </div>

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

          {/* ── Bottom bar: selection count + bulk actions (matches screenshot) ── */}
          {selectedRows.size > 0 && (
            <div style={{
              padding: '9px 16px', background: C.surfaceEl,
              borderTop: `1px solid ${C.borderEl}`,
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 11, color: C.t3 }}>
                {selectedRows.size} selected
              </span>
              <button
                onClick={() => setShowBulkPanel(v => !v)}
                style={{
                  padding: '5px 12px', borderRadius: 7,
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.t2, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                Bulk actions ({selectedRows.size})
              </button>
              <button style={{
                padding: '5px 10px', borderRadius: 7,
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.t2, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Tag style={{ width: 10, height: 10 }} /> Tag ▾
              </button>
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: C.t3 }}>✓ {selectedRows.size} starred</span>
              <button
                onClick={() => setShowBulkPanel(v => !v)}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: C.accent, color: '#fff',
                  border: 'none', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Plus style={{ width: 10, height: 10 }} /> Message ({selectedRows.size})
              </button>
              <button style={{
                padding: '6px 12px', borderRadius: 8,
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.t2, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Tag style={{ width: 10, height: 10 }} /> Tag ▾
              </button>
              <button onClick={() => { setSelectedRows(new Set()); setShowBulkPanel(false); }} style={{
                padding: '6px 12px', borderRadius: 8,
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.t3, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Clear members
              </button>
            </div>
          )}

          {/* Pagination */}
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
            atRisk={atRisk}
            atRiskMembersList={atRiskMembersList}
            setMemberFilter={handleFilter}
            setMemberSort={setMemberSort}
            openModal={openModal}
            avatarMap={avatarMap}
            nameMap={nameMap}
          />
        )}
      </div>

      {/* Leaderboards */}
      {!isMobile && (
        <div style={{ marginTop: 14 }}>
          <LeaderboardSection checkInLeaderboard={checkInLB} streakLeaderboard={streakLB} progressLeaderboard={[]} />
        </div>
      )}
    </div>
  );
}
