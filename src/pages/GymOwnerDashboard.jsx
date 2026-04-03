/**
 * TabMembers — coach dashboard card shell applied
 *
 * CARD SHELL CHANGES (identical to TabOverview update):
 *   background    → #0a0f1e  (T.surface)
 *   border        → rgba(255,255,255,.04)  (T.border)
 *   borderRadius  → 16px  (T.r3)
 *   boxShadow     → 0 4px 12px rgba(0,0,0,.25), 0 1px 4px rgba(0,0,0,.2)
 *   inner shimmer → CardShimmer top-gradient div
 *   inner surface → #0d1225
 *   divider       → rgba(255,255,255,.04)
 *
 * Coloured left-border strips on alert/signal blocks are preserved.
 * All logic, layout, and props are unchanged.
 */
import React, { useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  Plus, Search, ChevronLeft, ChevronRight,
  Users, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  UserPlus, Bell, X, Check,
  Zap, History, Flag,
  MoreHorizontal, Mail, GraduationCap, Copy,
  Flame, Send, Clock, Trophy,
} from 'lucide-react';
import { Avatar, FitnessScore, Empty } from './DashboardPrimitives';
import { base44 } from '@/api/base44Client';
import LeaderboardSection from '../leaderboard/LeaderboardSection';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

// ─── LOCAL CARD SHELL — matches TabCoachToday ─────────────────────────────────
const CARD_BG    = '#0a0f1e';
const CARD_BDR   = 'rgba(255,255,255,.04)';
const CARD_BDR_H = 'rgba(255,255,255,.07)';
const CARD_R     = 16;
const CARD_SH    = '0 4px 12px rgba(0,0,0,.25), 0 1px 4px rgba(0,0,0,.2)';
const INNER_BG   = '#0d1225';
const DIVIDER    = 'rgba(255,255,255,.04)';

function CardShimmer() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
      background: 'linear-gradient(180deg, rgba(255,255,255,.015) 0%, transparent 40%)',
    }} />
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      position:     'relative',
      background:   CARD_BG,
      border:       `1px solid ${CARD_BDR}`,
      borderRadius: CARD_R,
      boxShadow:    CARD_SH,
      overflow:     'hidden',
      ...style,
    }}>
      <CardShimmer />
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
   ACTIVITY CHIP
══════════════════════════════════════════════════════════════════ */
function ActivityChip({ m }) {
  let label, color, bg, border;
  if (m.isBanned || m.daysSince >= 14) {
    label  = m.isBanned ? 'Banned' : m.daysSince >= 999 ? 'No visits' : `${m.daysSince}d absent`;
    color  = C.danger; bg = C.dangerSub; border = C.dangerBrd;
  } else if (m.visits30 >= 15) {
    label  = `${m.visits30}/mo · high`;
    color  = C.success; bg = C.successSub; border = C.successBrd;
  } else if (m.visits30 >= 8) {
    label  = `${m.visits30}/mo · active`;
    color  = C.accent; bg = C.accentSub; border = C.accentBrd;
  } else if (m.visits30 >= 4) {
    label  = `${m.visits30}/mo`;
    color  = C.accent; bg = 'transparent'; border = CARD_BDR;
  } else if (m.visits30 >= 1) {
    label  = `${m.visits30}/mo · low`;
    color  = C.t2; bg = 'transparent'; border = CARD_BDR;
  } else if (m.joinedDaysAgo !== null && m.joinedDaysAgo <= 7) {
    label  = 'Just joined';
    color  = C.t2; bg = 'transparent'; border = CARD_BDR;
  } else {
    label  = 'No visits';
    color  = C.t3; bg = 'transparent'; border = CARD_BDR;
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 600, padding: '3px 8px',
      borderRadius: 6, background: bg, color, border: `1px solid ${border}`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
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
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 600, padding: '3px 8px',
      borderRadius: 6,
      background: isHigh ? C.dangerSub : C.warnSub,
      color:      isHigh ? C.danger    : C.warn,
      border:     `1px solid ${isHigh ? C.dangerBrd : C.warnBrd}`,
    }}>
      {risk}
    </span>
  );
}

const HealthScore = FitnessScore;

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

function FrequencyInsight({ m }) {
  const prev  = m.prevVisits30 || 0;
  const curr  = m.visits30;
  const hasComparison = prev >= 3;
  const pct   = hasComparison ? Math.round(((curr - prev) / prev) * 100) : 0;
  const dropped = hasComparison && pct <= -30;
  const surged  = hasComparison && pct >= 30 && pct <= 300;
  const valueColor = m.daysSince === 0 ? C.success : m.daysSince >= 14 ? C.danger : C.t1;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: valueColor }}>
          {curr > 0
            ? <>{curr} <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>visits</span></>
            : <span style={{ color: C.t4 }}>—</span>}
        </span>
        {dropped && <TrendingDown style={{ width: 10, height: 10, color: C.danger }} />}
        {surged  && <TrendingUp   style={{ width: 10, height: 10, color: C.success }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <span style={{ fontSize: 10, color: C.t3 }}>{m.lastVisitDisplay}</span>
        {dropped && (
          <span style={{ fontSize: 9, fontWeight: 600, color: C.danger, background: C.dangerSub, border: `1px solid ${C.dangerBrd}`, borderRadius: 4, padding: '1px 5px' }}>
            -{Math.abs(pct)}% vs usual
          </span>
        )}
        {surged && (
          <span style={{ fontSize: 9, fontWeight: 600, color: C.success, background: C.successSub, border: `1px solid ${C.successBrd}`, borderRadius: 4, padding: '1px 5px' }}>
            +{pct}% vs usual
          </span>
        )}
      </div>
    </div>
  );
}

function RowActions({ m, gymName, gymId, openModal, onMarkAtRisk }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={e => { e.stopPropagation(); openModal('message', m); }}
        style={{
          width: 26, height: 26, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: `1px solid ${CARD_BDR}`,
          cursor: 'pointer', flexShrink: 0, transition: 'border-color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = CARD_BDR_H}
        onMouseLeave={e => e.currentTarget.style.borderColor = CARD_BDR}
      >
        <Bell style={{ width: 11, height: 11, color: C.accent }} />
      </button>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        style={{
          width: 26, height: 26, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: `1px solid ${CARD_BDR}`,
          cursor: 'pointer', flexShrink: 0, transition: 'border-color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = CARD_BDR_H}
        onMouseLeave={e => e.currentTarget.style.borderColor = CARD_BDR}
      >
        <MoreHorizontal style={{ width: 11, height: 11, color: C.t3 }} />
      </button>
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', right: 0, top: 30, zIndex: 999,
            background: CARD_BG, border: `1px solid ${CARD_BDR_H}`,
            borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
            minWidth: 152, overflow: 'hidden',
          }}
        >
          {[
            { icon: History, label: 'Check-in history', fn: () => { openModal('memberHistory', m); setOpen(false); } },
            { icon: Flag,    label: 'Mark at risk',     fn: () => { onMarkAtRisk(m); setOpen(false); } },
          ].map((a, i) => (
            <button
              key={i} onClick={a.fn}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 14px', fontSize: 12, fontWeight: 500, color: C.t2,
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit', transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = INNER_BG}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <a.icon style={{ width: 12, height: 12, color: C.t3 }} /> {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
    <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: INNER_BG, borderRadius: 8, border: `1px solid ${CARD_BDR}`, marginBottom: 12 }}>
      {[{ id: 'preset', label: 'Templates' }, { id: 'custom', label: 'Custom' }].map(m => (
        <button key={m.id} onClick={() => setMode(m.id)} style={{
          padding: '4px 12px', borderRadius: 6, fontSize: 11,
          fontWeight: mode === m.id ? 600 : 400, cursor: 'pointer',
          background: mode === m.id ? CARD_BG : 'transparent',
          border: `1px solid ${mode === m.id ? CARD_BDR_H : 'transparent'}`,
          color: mode === m.id ? C.t1 : C.t3,
          fontFamily: 'inherit', transition: 'all .15s',
        }}>
          {m.label}
        </button>
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
          background: preset === p.id ? INNER_BG : 'transparent',
          border: `1px solid ${preset === p.id ? CARD_BDR_H : CARD_BDR}`,
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
      border: `1px solid ${sent ? C.successBrd : ready ? C.accentBrd : CARD_BDR}`,
      cursor: ready ? 'pointer' : 'default',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontSize: 12, fontWeight: 600,
      background: sent ? C.successSub : ready ? C.accentSub : 'transparent',
      color:      sent ? C.success    : ready ? C.accent    : C.t3,
      transition: 'all .15s', fontFamily: 'inherit',
    }}>
      {sent ? <><Check style={{ width: 12, height: 12 }} /> Sent</>
        : sending ? 'Sending…'
        : <><Send style={{ width: 12, height: 12 }} /> {label}</>}
    </button>
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
      background: INNER_BG,
      border: `1px solid ${CARD_BDR}`,
      borderLeft: `2px solid ${color}`,
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
   MEMBER PUSH PANEL
══════════════════════════════════════════════════════════════════ */
function MemberPushPanel({ member, gymName, gymId, onClose }) {
  const [preset,  setPreset]  = useState('miss');
  const [custom,  setCustom]  = useState('');
  const [mode,    setMode]    = useState('preset');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const firstName = member.name.split(' ')[0];
  const message   = mode === 'preset' ? PRESET_MESSAGES.find(p => p.id === preset)?.body(gymName, firstName) || '' : custom;
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
      padding: '14px 16px 16px',
      background: INNER_BG,
      borderBottom: `1px solid ${DIVIDER}`,
      borderLeft: `3px solid ${C.accent}`,
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
          background: 'transparent', border: `1px solid ${CARD_BDR}`, cursor: 'pointer',
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
            background: CARD_BG, border: `1px solid ${CARD_BDR}`,
            borderRadius: 8, padding: '8px 10px', fontSize: 11,
            color: C.t1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
          }}
          onFocus={e => e.target.style.borderColor = C.accentBrd}
          onBlur={e => e.target.style.borderColor = CARD_BDR}
        />
      )}
      {message && (
        <div style={{
          margin: '10px 0', padding: '9px 11px', borderRadius: 8,
          background: CARD_BG, border: `1px solid ${CARD_BDR}`,
          borderLeft: `2px solid ${C.accent}`,
          fontSize: 11, color: C.t2, lineHeight: 1.6,
        }}>
          {message}
        </div>
      )}
      <SendBtn onClick={handleSend} disabled={!message.trim()} sending={sending} sent={sent} label={`Send to ${firstName}`} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BULK PUSH PANEL
══════════════════════════════════════════════════════════════════ */
function BulkPushPanel({ selectedRows, memberRows, gymName, gymId, onClose, onSuccess }) {
  const [preset,  setPreset]  = useState('miss');
  const [custom,  setCustom]  = useState('');
  const [mode,    setMode]    = useState('preset');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
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
      padding: '14px 16px 16px',
      background: INNER_BG,
      borderBottom: `1px solid ${DIVIDER}`,
      borderLeft: `3px solid ${C.accent}`,
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
              <div key={m.id} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 4 - i, border: `2px solid ${CARD_BG}`, borderRadius: '50%' }}>
                <Avatar name={m.name} size={20} src={m.avatar_url} />
              </div>
            ))}
            {memberCount > 4 && (
              <div style={{
                marginLeft: -6, width: 20, height: 20, borderRadius: '50%',
                background: INNER_BG, border: `2px solid ${CARD_BG}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: C.t2 }}>+{memberCount - 4}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 24, height: 24, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: `1px solid ${CARD_BDR}`, cursor: 'pointer',
          }}>
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
              style={{
                width: '100%', boxSizing: 'border-box',
                background: CARD_BG, border: `1px solid ${CARD_BDR}`,
                borderRadius: 8, padding: '8px 10px', fontSize: 11,
                color: C.t1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
              }}
              onFocus={e => e.target.style.borderColor = C.accentBrd}
              onBlur={e => e.target.style.borderColor = CARD_BDR}
            />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SectionLabel>Preview</SectionLabel>
          <div style={{
            flex: 1, padding: '9px 11px', borderRadius: 8,
            background: CARD_BG, border: `1px solid ${CARD_BDR}`,
            borderLeft: `2px solid ${preview ? C.accent : CARD_BDR}`,
            fontSize: 11, color: preview ? C.t2 : C.t3,
            lineHeight: 1.6, fontStyle: preview ? 'normal' : 'italic',
          }}>
            {preview || 'Select a template…'}
          </div>
          <SendBtn onClick={handleSend} disabled={!preview.trim()} sending={sending} sent={sent} label={`Send to ${memberCount}`} />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SEGMENT SUMMARY CARDS
══════════════════════════════════════════════════════════════════ */
function SegmentSummary({ memberRows, setMemberFilter, activeFilter }) {
  const segs = useMemo(() => {
    const superActive = memberRows.filter(m => m.visits30 >= 15).length;
    const active      = memberRows.filter(m => m.visits30 >= 4 && m.visits30 < 15 && m.daysSince < 14).length;
    const casual      = memberRows.filter(m => m.visits30 >= 1 && m.visits30 < 4  && m.daysSince < 14).length;
    const atRisk      = memberRows.filter(m => m.risk !== 'Low').length;
    const newM        = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 30).length;
    return [
      { id: 'superActive', label: 'Super Active', val: superActive, sub: '15+ visits/mo',  filter: 'active' },
      { id: 'active',      label: 'Active',        val: active,      sub: '4–14 visits/mo', filter: 'active' },
      { id: 'casual',      label: 'Casual',        val: casual,      sub: '1–3 visits/mo',  filter: 'active' },
      { id: 'atRisk',      label: 'At Risk',        val: atRisk,      sub: '14+ days out',   filter: 'atRisk' },
      { id: 'new',         label: 'New',            val: newM,        sub: 'Last 30 days',   filter: 'new'    },
    ];
  }, [memberRows]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
      {segs.map(s => {
        const selected = activeFilter === s.filter;
        return (
          <div
            key={s.id}
            onClick={() => setMemberFilter(selected ? 'all' : s.filter)}
            style={{
              position: 'relative', overflow: 'hidden',
              padding: '14px 14px', borderRadius: CARD_R, cursor: 'pointer',
              background: CARD_BG,
              border: `1px solid ${selected ? CARD_BDR_H : CARD_BDR}`,
              boxShadow: CARD_SH, transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = CARD_BDR_H; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = selected ? CARD_BDR_H : CARD_BDR; e.currentTarget.style.transform = ''; }}
          >
            <CardShimmer />
            <SectionLabel>{s.label}</SectionLabel>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.val > 0 ? C.t1 : C.t4, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>
              {s.val}
            </div>
            <div style={{ fontSize: 11, color: C.t3 }}>{s.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ALERTS PANEL
══════════════════════════════════════════════════════════════════ */
function AlertsPanel({ memberRows, atRisk, atRiskMembersList = [], setMemberFilter, setMemberSort, openModal }) {
  const criticalMembers = memberRows.filter(m => m.risk === 'High').length > 0
    ? memberRows.filter(m => m.risk === 'High').slice(0, 3)
    : (atRiskMembersList || []).slice(0, 3).map(m => ({
        name: m.user_name || m.name,
        daysSince: m.days_since || m.daysSince || 14,
        risk: 'High',
      }));
  const earlyDroppers     = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14 && m.daysSince >= 7).slice(0, 2);
  const frequencyDroppers = memberRows.filter(m => m.prevVisits30 >= 4 && m.visits30 <= m.prevVisits30 * 0.5 && m.visits30 < 4).slice(0, 2);
  const noAlerts          = criticalMembers.length === 0 && earlyDroppers.length === 0 && frequencyDroppers.length === 0;
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Alerts</div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{noAlerts ? 'All clear' : 'Members needing attention'}</div>
      </div>
      {noAlerts && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          borderRadius: 8, background: INNER_BG, border: `1px solid ${CARD_BDR}`,
          borderLeft: `3px solid ${C.success}`,
        }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t2 }}>All members are active</span>
        </div>
      )}
      {criticalMembers.length > 0 && (
        <div style={{
          padding: '10px 12px', borderRadius: 9,
          background: INNER_BG, border: `1px solid ${CARD_BDR}`,
          borderLeft: `3px solid ${C.danger}`, marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <AlertTriangle style={{ width: 11, height: 11, color: C.danger, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{atRisk} members inactive 14+ days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {criticalMembers.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: C.t2 }}>{m.name}</span>
                <span style={{ fontSize: 10, color: C.danger, fontWeight: 600 }}>{m.daysSince}d absent</span>
              </div>
            ))}
            {atRisk > 3 && <div style={{ fontSize: 10, color: C.t3 }}>+{atRisk - 3} more</div>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => { setMemberFilter('atRisk'); setMemberSort('highRisk'); }}
              style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: 'transparent', color: C.t2, border: `1px solid ${CARD_BDR}`, fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = CARD_BDR_H}
              onMouseLeave={e => e.currentTarget.style.borderColor = CARD_BDR}
            >
              View all
            </button>
            <button
              onClick={() => openModal('post')}
              style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: 'transparent', color: C.warn, border: `1px solid ${C.warnBrd}`, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Message them
            </button>
          </div>
        </div>
      )}
      {earlyDroppers.length > 0 && (
        <div style={{
          padding: '10px 12px', borderRadius: 9,
          background: INNER_BG, border: `1px solid ${CARD_BDR}`,
          borderLeft: `3px solid ${C.warn}`, marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Zap style={{ width: 11, height: 11, color: C.warn, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>New members going quiet</span>
          </div>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 8, lineHeight: 1.5 }}>
            {earlyDroppers.map(m => m.name.split(' ')[0]).join(', ')} {earlyDroppers.length === 1 ? 'is' : 'are'} in the typical 7-day drop-off window.
          </div>
          <button
            onClick={() => setMemberFilter('new')}
            style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: `${C.warn}10`, color: C.warn, border: `1px solid ${C.warnBrd}`, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            View new members
          </button>
        </div>
      )}
      {frequencyDroppers.length > 0 && (
        <div style={{
          padding: '10px 12px', borderRadius: 9,
          background: INNER_BG, border: `1px solid ${CARD_BDR}`,
          borderLeft: `3px solid ${C.warn}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <TrendingDown style={{ width: 11, height: 11, color: C.warn, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Frequency dropping</span>
          </div>
          {frequencyDroppers.map((m, i) => (
            <div key={i} style={{ fontSize: 11, color: C.t3, marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: C.t2 }}>{m.name}</span> — was {m.prevVisits30}/mo, now {m.visits30}/mo
            </div>
          ))}
          <StatNudge color={C.warn} icon={TrendingDown}
            stat={`${frequencyDroppers.length} member${frequencyDroppers.length > 1 ? 's' : ''} visited much less than usual.`}
            detail="A drop in frequency is an early churn signal — reaching out now is more effective than waiting."
            action="Message them →" onAction={() => openModal('message')}
          />
        </div>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DROP-OFF WIDGET
══════════════════════════════════════════════════════════════════ */
function DropOffWidget({ memberRows, setMemberFilter, setMemberSort }) {
  const buckets = useMemo(() => {
    const w1  = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14  && m.daysSince >= 7).length;
    const w2  = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 14   && m.joinedDaysAgo <= 30  && m.daysSince >= 7).length;
    const m2  = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 30   && m.joinedDaysAgo <= 90  && m.daysSince >= 14).length;
    const old = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 90   && m.daysSince >= 21).length;
    return [
      { label: 'Week 1 gone quiet',  sub: 'No return after joining', val: w1,  barColor: C.danger,        valueColor: w1  > 0 ? C.danger : C.t4 },
      { label: 'Month 1 drift',      sub: 'Slipped in first month',  val: w2,  barColor: `${C.accent}55`, valueColor: w2  > 0 ? C.t2    : C.t4 },
      { label: 'Month 2–3 slip',     sub: 'Common churn window',     val: m2,  barColor: `${C.accent}44`, valueColor: m2  > 0 ? C.t2    : C.t4 },
      { label: 'Long-term inactive', sub: '90+ day members, quiet',  val: old, barColor: `${C.accent}28`, valueColor: old > 0 ? C.t3    : C.t4 },
    ];
  }, [memberRows]);
  const total = buckets.reduce((a, b) => a + b.val, 0);
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Drop-off Patterns</div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Where members typically go quiet</div>
      </div>
      {total === 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
          borderRadius: 8, background: INNER_BG, border: `1px solid ${CARD_BDR}`,
          borderLeft: `3px solid ${C.success}`,
        }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t2 }}>No drop-off patterns detected</span>
        </div>
      ) : (
        <>
          {buckets.map((b, i) => (
            <div key={i} style={{ marginBottom: i < buckets.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: b.val > 0 ? C.t1 : C.t3 }}>{b.label}</span>
                  <span style={{ fontSize: 10, color: C.t3, marginLeft: 7 }}>{b.sub}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: b.valueColor }}>{b.val}</span>
              </div>
              <div style={{ height: 2, borderRadius: 99, background: DIVIDER, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: total > 0 ? `${(b.val / total) * 100}%` : '0%',
                  background: b.barColor, borderRadius: 99, transition: 'width .7s ease',
                }} />
              </div>
            </div>
          ))}
          <button
            onClick={() => { setMemberFilter('atRisk'); setMemberSort('highRisk'); }}
            style={{
              marginTop: 12, width: '100%', fontSize: 11, fontWeight: 600, color: C.danger,
              background: 'transparent', border: `1px solid ${C.dangerBrd}`,
              padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            View all at-risk members <ChevronRight style={{ width: 10, height: 10 }} />
          </button>
        </>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   WEEK-ONE FOLLOW-UP
══════════════════════════════════════════════════════════════════ */
function WeekOneFollowUp({ memberRows, setMemberFilter }) {
  const { returned, didnt, names } = useMemo(() => {
    const newish = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo >= 7 && m.joinedDaysAgo <= 21);
    let returned = 0, didnt = 0;
    const names = [];
    newish.forEach(m => {
      if (m.visitsTotal >= 2) returned++;
      else { didnt++; if (names.length < 3) names.push(m.name.split(' ')[0]); }
    });
    return { returned, didnt, names };
  }, [memberRows]);
  const total = returned + didnt;
  const pct   = total > 0 ? Math.round((returned / total) * 100) : 0;
  const pctColor = total === 0 ? C.t3 : pct >= 60 ? C.success : pct >= 40 ? C.t1 : C.danger;
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Week-1 Return Rate</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>New members (joined 1–3 weeks ago) who returned</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: pctColor, letterSpacing: '-0.04em', lineHeight: 1, flexShrink: 0 }}>
          {total === 0 ? '—' : `${pct}%`}
        </div>
      </div>
      {total === 0 ? (
        <p style={{ fontSize: 12, color: C.t3, margin: '10px 0 0' }}>No members in this window yet.</p>
      ) : (
        <>
          <div style={{ height: 2, borderRadius: 99, background: DIVIDER, overflow: 'hidden', margin: '12px 0' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pctColor === C.t1 ? C.accent : pctColor, borderRadius: 99, transition: 'width .7s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { count: returned, label: 'Returned',      color: returned > 0 ? C.success : C.t4 },
              { count: didnt,    label: "Didn't return", color: didnt > 0    ? C.danger  : C.t4 },
            ].map((cell, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: INNER_BG, border: `1px solid ${CARD_BDR}`, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: cell.color, letterSpacing: '-0.03em' }}>{cell.count}</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{cell.label}</div>
              </div>
            ))}
          </div>
          {didnt > 0 && names.length > 0 && (
            <div style={{
              marginTop: 10, padding: '9px 11px', borderRadius: 8,
              background: INNER_BG, border: `1px solid ${CARD_BDR}`,
              borderLeft: `3px solid ${C.danger}`,
            }}>
              <div style={{ fontSize: 11, color: C.t2, marginBottom: 5, lineHeight: 1.5 }}>
                {names.join(', ')}{didnt > 3 ? ` +${didnt - 3} more` : ''} — no return visit yet
              </div>
              <button
                onClick={() => setMemberFilter('new')}
                style={{ fontSize: 11, fontWeight: 600, color: C.warn, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}
              >
                View new members <ChevronRight style={{ width: 10, height: 10 }} />
              </button>
            </div>
          )}
          <StatNudge
            color={pctColor === C.t1 ? C.accent : pctColor}
            icon={pct >= 60 ? CheckCircle : AlertTriangle}
            stat={pct >= 60 ? `${returned} of ${total} new members came back.` : didnt === 1 ? `${names[0] || '1 member'} hasn't returned yet.` : `${didnt} new members haven't come back yet.`}
            detail={pct >= 60 ? 'Good retention in week 1. Keep engaging them — the habit takes a few weeks to stick.' : pct >= 40 ? "A direct message to those who haven't returned is worth the effort — they're still in the decision window." : 'Week 1 is the highest-leverage moment to reach out. The longer you wait, the harder it is.'}
            action={didnt > 0 ? 'Message them' : undefined}
            onAction={didnt > 0 ? () => setMemberFilter('new') : undefined}
          />
        </>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   INVITE STAFF PANEL
══════════════════════════════════════════════════════════════════ */
function InviteStaffPanel({ gym }) {
  const [email,   setEmail]   = useState('');
  const [role,    setRole]    = useState('coach');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);
  const handleInvite = async () => {
    if (!email.trim() || sending) return;
    setSending(true); setError('');
    try {
      await base44.users.inviteUser(email.trim(), 'user');
      setSent(true); setEmail('');
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      setError(e?.message || 'Failed to send invite');
    } finally { setSending(false); }
  };
  const joinUrl = gym?.join_code ? `${window.location.origin}/GymSignup?code=${gym.join_code}` : null;
  const handleCopy = () => {
    if (joinUrl) { navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <GraduationCap style={{ width: 13, height: 13, color: C.t3 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Invite Staff</div>
          <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Add coaches and employees</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, padding: 3, background: INNER_BG, borderRadius: 8, border: `1px solid ${CARD_BDR}`, marginBottom: 12 }}>
        {[{ id: 'coach', label: 'Coach' }, { id: 'staff', label: 'Staff' }].map(r => (
          <button key={r.id} onClick={() => setRole(r.id)} style={{
            flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 11,
            fontWeight: role === r.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
            background: role === r.id ? CARD_BG : 'transparent',
            color: role === r.id ? C.t1 : C.t3,
            border: `1px solid ${role === r.id ? CARD_BDR_H : 'transparent'}`,
            transition: 'all .15s',
          }}>
            {r.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: error ? 6 : 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Mail style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 11, height: 11, color: C.t3, pointerEvents: 'none' }} />
          <input value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="Email address"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 28px',
              borderRadius: 8, background: INNER_BG,
              border: `1px solid ${error ? C.dangerBrd : CARD_BDR}`,
              color: C.t1, fontSize: 12, outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = CARD_BDR_H}
            onBlur={e => e.target.style.borderColor = error ? C.dangerBrd : CARD_BDR}
          />
        </div>
        <button onClick={handleInvite} disabled={!email.trim() || sending || sent} style={{
          padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: !email.trim() || sending || sent ? 'default' : 'pointer', fontFamily: 'inherit',
          border: `1px solid ${sent ? C.successBrd : C.accentBrd}`,
          background: sent ? C.successSub : C.accentSub,
          color: sent ? C.success : C.accent,
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, transition: 'all .15s',
        }}>
          {sent ? <><Check style={{ width: 11, height: 11 }} /> Sent</> : sending ? '…' : <><Send style={{ width: 11, height: 11 }} /> Send</>}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: C.danger, marginBottom: 8 }}>{error}</div>}
      <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.5, marginBottom: joinUrl ? 10 : 0 }}>
        They'll receive an email invite and be added as a <span style={{ fontWeight: 600, color: C.t2 }}>{role}</span>.
      </div>
      {joinUrl && (
        <>
          <div style={{ height: 1, background: DIVIDER, margin: '10px 0' }} />
          <SectionLabel>Or share gym link</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: INNER_BG, border: `1px solid ${CARD_BDR}` }}>
            <span style={{ flex: 1, fontSize: 10, color: C.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{joinUrl}</span>
            <button onClick={handleCopy} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5,
              background: copied ? C.successSub : 'transparent',
              color: copied ? C.success : C.t2,
              border: `1px solid ${copied ? C.successBrd : CARD_BDR}`,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}>
              {copied ? <><Check style={{ width: 9, height: 9 }} /> Copied</> : <><Copy style={{ width: 9, height: 9 }} /> Copy</>}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   EXPANDED MEMBER DETAIL
══════════════════════════════════════════════════════════════════ */
function ExpandedMemberDetail({ m, gymName, gymId, checkIns, posts, now, onClose }) {
  const recentPosts = (posts || []).filter(p => p.user_id === m.user_id && differenceInDays(now, new Date(p.created_at)) <= 30).length;
  const engScore    = Math.min(100, Math.round((m.visits30 / 20) * 70 + (recentPosts / 5) * 30));
  const engColor    = engScore >= 70 ? C.success : engScore >= 40 ? C.warn : C.danger;
  return (
    <>
      <div style={{
        padding: '10px 16px', background: INNER_BG,
        borderBottom: `1px solid ${DIVIDER}`,
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
        <div style={{ padding: '8px 16px', background: INNER_BG, borderBottom: `1px solid ${DIVIDER}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.06em' }}>Email</span>
          <a href={`mailto:${m.user_email}`} style={{ fontSize: 12, fontWeight: 500, color: C.accent, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
            {m.user_email}
          </a>
        </div>
      )}
      {(() => {
        const wrap = node => <div style={{ padding: '8px 16px', borderBottom: `1px solid ${DIVIDER}` }}>{node}</div>;
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
        if (m.visitsTotal === 1)
          return wrap(<StatNudge color={C.warn} icon={Zap} stat="Only 1 visit so far." detail={`First impressions matter — reach out to ${fn} to make sure their experience was good.`} />);
        return null;
      })()}
      <MemberPushPanel member={m} gymName={gymName} gymId={gymId} onClose={onClose} />
    </>
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
        if      (daysSince === 0)  lastVisitDisplay = 'Today';
        else if (daysSince === 1)  lastVisitDisplay = '1 day ago';
        else if (daysSince < 7)   lastVisitDisplay = `${daysSince} days ago`;
        else if (daysSince < 14)  lastVisitDisplay = '1 week ago';
        else if (daysSince < 30)  lastVisitDisplay = `${Math.floor(daysSince / 7)} weeks ago`;
        else                      lastVisitDisplay = format(new Date(lastVisit), 'd MMM');
      }
      return {
        ...m, name,
        visits30: m.ci30Count || 0, prevVisits30: m.prevCi30Count || 0,
        visitsTotal: m.visitsTotal || 0,
        lastVisit, daysSince, risk, lastVisitDisplay,
        plan: m.plan || m.membership_type || m.type || 'Standard',
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
  const handleMarkAtRisk = m  => openModal('message', m);
  const weekAgo   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCI  = checkIns.filter(c => new Date(c.check_in_date) >= weekAgo);
  const checkInLB = Object.values(weeklyCI.reduce((acc, c) => {
    if (!acc[c.user_id]) acc[c.user_id] = { userId: c.user_id, userName: c.user_name, userAvatar: avatarMap[c.user_id] || null, count: 0 };
    acc[c.user_id].count++;
    return acc;
  }, {})).sort((a, b) => b.count - a.count).slice(0, 10);
  const streakLB = memberRows.map(m => ({ userId: m.user_id, userName: m.name, userAvatar: m.avatar_url, streak: m.streak })).sort((a, b) => b.streak - a.streak).slice(0, 10);
  const COLS = '32px 2.2fr 1.1fr 1fr 1fr 1fr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!isMobile && <SegmentSummary memberRows={memberRows} setMemberFilter={handleFilter} activeFilter={memberFilter} />}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 272px', gap: 14, alignItems: 'start' }}>
        {/* ── Main member table ── */}
        <Card style={{ overflow: 'hidden' }}>
          {/* Filter bar */}
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${CARD_BDR}`,
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            position: 'sticky', top: 0, background: CARD_BG, zIndex: 10,
          }}>
            <button onClick={() => openModal('members')} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: C.accent, color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
            }}>
              <Plus style={{ width: 12, height: 12 }} /> Add Member
            </button>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: 'all',      label: 'All',      count: filterCounts.all      },
                { id: 'active',   label: 'Active',   count: filterCounts.active   },
                { id: 'inactive', label: 'Inactive', count: filterCounts.inactive },
                { id: 'atRisk',   label: 'At Risk',  count: filterCounts.atRisk, isDanger: true },
                { id: 'new',      label: 'New',      count: filterCounts.new      },
              ].map(f => {
                const on = memberFilter === f.id;
                return (
                  <button key={f.id} onClick={() => handleFilter(f.id)} style={{
                    padding: '5px 11px', borderRadius: 8, fontSize: 11,
                    fontWeight: on ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit',
                    background: on ? INNER_BG : 'transparent',
                    color: on ? (f.isDanger && filterCounts.atRisk > 0 ? C.danger : C.t1) : C.t3,
                    border: `1px solid ${on ? CARD_BDR_H : 'transparent'}`,
                    transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {f.label}
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: on && f.isDanger && filterCounts.atRisk > 0 ? C.danger : C.t3,
                      background: 'rgba(255,255,255,0.07)',
                      borderRadius: 99, padding: '0 5px', lineHeight: '16px',
                    }}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1 }} />
            <select value={memberSort} onChange={e => setMemberSort(e.target.value)} style={{
              padding: '5px 9px', borderRadius: 7,
              background: INNER_BG, border: `1px solid ${CARD_BDR}`,
              color: C.t2, fontSize: 11, outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <option value="recentlyActive">Recently Active</option>
              <option value="mostVisits">Most Visits</option>
              <option value="newest">Newest First</option>
              <option value="highRisk">High Risk First</option>
              <option value="streak">Longest Streak</option>
              <option value="name">Name A–Z</option>
            </select>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: C.t3, pointerEvents: 'none' }} />
              <input placeholder="Search members" value={memberSearch} onChange={e => handleSearch(e.target.value)} style={{
                padding: '6px 12px 6px 28px', borderRadius: 8,
                background: INNER_BG, border: `1px solid ${CARD_BDR}`,
                color: C.t1, fontSize: 12, outline: 'none', fontFamily: 'inherit',
                width: 160, transition: 'border-color .15s',
              }}
                onFocus={e => e.target.style.borderColor = CARD_BDR_H}
                onBlur={e => e.target.style.borderColor = CARD_BDR}
              />
            </div>
          </div>

          {/* Bulk selection bar */}
          {selectedRows.size > 0 && (
            <div style={{
              padding: '9px 16px', background: INNER_BG,
              borderBottom: `1px solid ${CARD_BDR_H}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ display: 'flex' }}>
                {memberRows.filter(m => selectedRows.has(m.id)).slice(0, 3).map((m, i) => (
                  <div key={m.id} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 3 - i, border: `2px solid ${CARD_BG}`, borderRadius: '50%' }}>
                    <Avatar name={m.name} size={20} src={m.avatar_url} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>
                {selectedRows.size} {selectedRows.size === 1 ? 'member' : 'members'} selected
              </span>
              <div style={{ flex: 1 }} />
              <button onClick={() => { setSelectedRows(new Set()); setShowBulkPanel(false); }} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: 'transparent', border: `1px solid ${CARD_BDR}`, color: C.t3, fontFamily: 'inherit' }}>
                Clear
              </button>
              <button onClick={() => setShowBulkPanel(v => !v)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                background: showBulkPanel ? C.accentSub : 'transparent',
                border: `1px solid ${showBulkPanel ? C.accentBrd : CARD_BDR}`,
                color: showBulkPanel ? C.accent : C.t2,
                fontFamily: 'inherit', transition: 'all .15s',
              }}>
                <Bell style={{ width: 10, height: 10 }} />
                {showBulkPanel ? 'Hide panel' : `Notify ${selectedRows.size}`}
              </button>
            </div>
          )}
          {showBulkPanel && selectedRows.size > 0 && (
            <BulkPushPanel selectedRows={selectedRows} memberRows={memberRows} gymName={gymName} gymId={selectedGym?.id} onClose={() => setShowBulkPanel(false)} onSuccess={() => setSelectedRows(new Set())} />
          )}

          {/* Column headers */}
          {!isMobile && (
            <div style={{
              display: 'grid', gridTemplateColumns: COLS, gap: 8,
              padding: '8px 16px', borderBottom: `1px solid ${CARD_BDR}`,
              background: 'rgba(255,255,255,0.015)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input type="checkbox" checked={paginated.length > 0 && selectedRows.size === paginated.length} onChange={toggleAll} style={{ width: 13, height: 13, accentColor: C.accent, cursor: 'pointer' }} />
              </div>
              {['Member', 'Activity', 'Visits / Last seen', 'Membership', 'Risk'].map((col, i) => (
                <div key={i}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em' }}>{col}</span>
                </div>
              ))}
            </div>
          )}

          {/* Rows */}
          <div style={{ minHeight: 280 }}>
            {paginated.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Empty icon={Users} label={memberSearch ? 'No members match your search' : 'No members in this filter'} />
              </div>
            ) : paginated.map((m, idx) => {
              const isExp = expandedMember === m.id;
              const isSel = selectedRows.has(m.id);
              return (
                <div key={m.id || idx}>
                  <div
                    onClick={() => { setExpandedMember(isExp ? null : m.id); if (showBulkPanel) setShowBulkPanel(false); }}
                    style={{
                      display: isMobile ? 'block' : 'grid',
                      gridTemplateColumns: isMobile ? undefined : COLS,
                      gap: 8, padding: isMobile ? '10px 12px' : '11px 16px',
                      borderBottom: !isExp && idx < paginated.length - 1 ? `1px solid ${DIVIDER}` : 'none',
                      borderLeft: isExp ? `3px solid ${C.accent}` : isSel ? `3px solid ${C.accent}40` : '3px solid transparent',
                      background: isExp ? INNER_BG : isSel ? 'rgba(81,121,255,0.04)' : 'transparent',
                      cursor: 'pointer', transition: 'background .1s, border-color .1s', alignItems: 'center',
                    }}
                    onMouseEnter={e => { if (!isExp && !isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                    onMouseLeave={e => { if (!isExp && !isSel) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={e => { e.stopPropagation(); handleToggleRow(m.id); }}>
                      <input type="checkbox" checked={isSel} onChange={() => handleToggleRow(m.id)} style={{ width: 13, height: 13, accentColor: C.accent, cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, marginBottom: isMobile ? 8 : 0 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar name={m.name} size={32} src={m.avatar_url} />
                        {m.daysSince >= 14 && (
                          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: C.danger, border: `2px solid ${CARD_BG}` }} />
                        )}
                        {m.streak >= 7 && (
                          <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: '50%', background: INNER_BG, border: `1px solid ${CARD_BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Flame style={{ width: 7, height: 7, color: C.warn }} />
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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
                            : m.plan}
                        </div>
                      </div>
                    </div>
                    <div onClick={e => e.stopPropagation()}><ActivityChip m={m} /></div>
                    {!isMobile && <div onClick={e => e.stopPropagation()}><FrequencyInsight m={m} /></div>}
                    {!isMobile && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.plan}</div>
                        <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>
                          {m.join_date ? `Joined ${format(new Date(m.join_date), 'MMM d, yyyy')}`
                            : m.created_date ? `Joined ${format(new Date(m.created_date), 'MMM d, yyyy')}`
                            : 'Active member'}
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <RiskBadge risk={m.risk} />
                      <RowActions m={m} gymName={gymName} gymId={selectedGym?.id} openModal={openModal} onMarkAtRisk={handleMarkAtRisk} />
                    </div>
                  </div>
                  {isExp && (
                    <ExpandedMemberDetail m={m} gymName={gymName} gymId={selectedGym?.id} checkIns={checkIns} posts={posts} now={now} onClose={() => setExpandedMember(null)} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${CARD_BDR}`, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[
                { icon: ChevronLeft,  disabled: memberPage <= 1,         action: () => setMemberPage(p => Math.max(1, p - 1)) },
                { icon: ChevronRight, disabled: memberPage >= totalPages, action: () => setMemberPage(p => Math.min(totalPages, p + 1)) },
              ].map(({ icon: Icon, disabled, action }, i) => (
                <button key={i} disabled={disabled} onClick={action} style={{
                  width: 28, height: 28, borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: `1px solid ${CARD_BDR}`,
                  color: disabled ? C.t4 : C.t2,
                  cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
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
                  background: isCurrent ? INNER_BG : 'transparent',
                  border: `1px solid ${isCurrent ? CARD_BDR_H : 'transparent'}`,
                  color: isCurrent ? C.t1 : C.t3,
                  fontSize: 12, fontWeight: isCurrent ? 700 : 400,
                  cursor: 'pointer', fontFamily: 'inherit',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AlertsPanel memberRows={memberRows} atRisk={atRisk} atRiskMembersList={atRiskMembersList} setMemberFilter={handleFilter} setMemberSort={setMemberSort} openModal={openModal} />
            <DropOffWidget memberRows={memberRows} setMemberFilter={handleFilter} setMemberSort={setMemberSort} />
            <WeekOneFollowUp memberRows={memberRows} setMemberFilter={handleFilter} />
          </div>
        )}
      </div>

      {/* ── Leaderboards ── */}
      {!isMobile && (
        <LeaderboardSection checkInLeaderboard={checkInLB} streakLeaderboard={streakLB} progressLeaderboard={[]} />
      )}
    </div>
  );
}