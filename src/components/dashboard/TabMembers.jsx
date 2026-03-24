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

/* ── Design tokens — matches Engagement tab exactly ──────────────────────── */
const C = {
  bg:        '#080e18',
  surface:   '#0c1422',
  surfaceHi: '#101929',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.12)',
  blue:      '#3b82f6',
  blueDim:   'rgba(59,130,246,0.12)',
  blueBrd:   'rgba(59,130,246,0.24)',
  red:       '#ef4444',
  redDim:    'rgba(239,68,68,0.10)',
  redBrd:    'rgba(239,68,68,0.25)',
  amber:     '#f59e0b',
  amberDim:  'rgba(245,158,11,0.10)',
  amberBrd:  'rgba(245,158,11,0.25)',
  green:     '#10b981',
  greenDim:  'rgba(16,185,129,0.10)',
  greenBrd:  'rgba(16,185,129,0.22)',
  purple:    '#8b5cf6',
  purpleDim: 'rgba(139,92,246,0.12)',
  purpleBrd: 'rgba(139,92,246,0.28)',
  t1:        '#f1f5f9',
  t2:        '#94a3b8',
  t3:        '#475569',
  t4:        '#2d3f55',
  divider:   'rgba(255,255,255,0.05)',
};

/* ── Shared primitives ───────────────────────────────────────────────────── */

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)`,
      overflow: 'hidden',
      position: 'relative',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 8 }}>
      {children}
    </div>
  );
}

/* ── Activity chip ───────────────────────────────────────────────────────── */
function ActivityChip({ m }) {
  let label, color, bg, border;
  if (m.isBanned) {
    label = 'Banned';         color = C.red;   bg = C.redDim;   border = C.redBrd;
  } else if (m.daysSince >= 14) {
    label = `${m.daysSince}d absent`; color = C.red; bg = C.redDim; border = C.redBrd;
  } else if (m.visits30 >= 15) {
    label = `${m.visits30}/mo · high`;     color = C.green;  bg = C.greenDim;  border = C.greenBrd;
  } else if (m.visits30 >= 8) {
    label = `${m.visits30}/mo · active`;   color = C.blue;   bg = C.blueDim;   border = C.blueBrd;
  } else if (m.visits30 >= 4) {
    label = `${m.visits30}/mo · moderate`; color = C.amber;  bg = C.amberDim;  border = C.amberBrd;
  } else if (m.visits30 >= 1) {
    label = `${m.visits30}/mo · low`;      color = C.amber;  bg = 'rgba(245,158,11,0.06)'; border = 'rgba(245,158,11,0.18)';
  } else if (m.joinedDaysAgo !== null && m.joinedDaysAgo <= 7) {
    label = 'Just joined';   color = C.purple; bg = C.purpleDim; border = C.purpleBrd;
  } else {
    label = 'No visits';     color = C.t3;     bg = C.divider;   border = C.border;
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 7,
      background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function RiskBadge({ risk }) {
  const map = {
    Low:    { color: C.green,  bg: C.greenDim,  border: C.greenBrd  },
    Medium: { color: C.amber,  bg: C.amberDim,  border: C.amberBrd  },
    High:   { color: C.red,    bg: C.redDim,    border: C.redBrd    },
  };
  const s = map[risk] || map.Low;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 7,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {risk}
    </span>
  );
}

const HealthScore = FitnessScore;

function MilestoneBadge({ visitsTotal, joinedDaysAgo }) {
  let label = null;
  if      (visitsTotal === 1)                           label = '1st visit';
  else if (visitsTotal === 10)                          label = '10 visits';
  else if (visitsTotal === 25)                          label = '25 visits';
  else if (visitsTotal === 50)                          label = '50 visits';
  else if (visitsTotal === 100)                         label = '100 visits';
  else if (joinedDaysAgo !== null && joinedDaysAgo <= 7) label = 'New';
  if (!label) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color: C.amber,
      background: C.amberDim, border: `1px solid ${C.amberBrd}`,
      padding: '2px 6px', borderRadius: 5,
    }}>
      {label}
    </span>
  );
}

function FrequencyInsight({ m }) {
  const prev = m.prevVisits30 || 0;
  const curr = m.visits30;
  const hasComparison = prev > 0;
  const pct     = hasComparison ? Math.round(((curr - prev) / prev) * 100) : 0;
  const dropped = hasComparison && pct <= -30;
  const surged  = hasComparison && pct >= 30;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: m.daysSince === 0 ? C.green : m.daysSince >= 14 ? C.red : C.t1 }}>
          {curr > 0
            ? <>{curr} <span style={{ fontWeight: 400, fontSize: 11, color: C.t3 }}>visits</span></>
            : '—'}
        </span>
        {dropped && <TrendingDown style={{ width: 10, height: 10, color: C.red }} />}
        {surged  && <TrendingUp   style={{ width: 10, height: 10, color: C.green }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <span style={{ fontSize: 10, color: C.t3 }}>{m.lastVisitDisplay}</span>
        {dropped && <span style={{ fontSize: 9, fontWeight: 700, color: C.red,   background: C.redDim,   borderRadius: 4, padding: '1px 5px' }}>-{Math.abs(pct)}% vs usual</span>}
        {surged  && <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: C.greenDim, borderRadius: 4, padding: '1px 5px' }}>+{pct}% vs usual</span>}
      </div>
    </div>
  );
}

/* ── Row action menu ─────────────────────────────────────────────────────── */
function RowActions({ m, gymName, gymId, openModal, onMarkAtRisk }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={e => { e.stopPropagation(); openModal('message', m); }}
        title="Send notification"
        style={{
          width: 26, height: 26, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
          cursor: 'pointer', flexShrink: 0,
        }}>
        <Bell style={{ width: 11, height: 11, color: C.t3 }} />
      </button>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        title="More actions"
        style={{
          width: 26, height: 26, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
          cursor: 'pointer', flexShrink: 0,
        }}>
        <MoreHorizontal style={{ width: 11, height: 11, color: C.t3 }} />
      </button>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', right: 0, top: 30, zIndex: 999,
          background: '#0d1528', border: `1px solid ${C.borderHi}`,
          borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.6)',
          minWidth: 160, overflow: 'hidden',
        }}>
          {[
            { icon: History, label: 'Check-in history', color: C.blue,  fn: () => { openModal('memberHistory', m); setOpen(false); } },
            { icon: Flag,    label: 'Mark at risk',     color: C.amber, fn: () => { onMarkAtRisk(m); setOpen(false); } },
          ].map((a, i) => (
            <button key={i} onClick={a.fn}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 14px', fontSize: 12, fontWeight: 600, color: a.color,
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${a.color}12`}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <a.icon style={{ width: 12, height: 12 }} /> {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Message templates & send button ────────────────────────────────────── */
const PRESET_MESSAGES = [
  { id: 'miss',      label: 'We miss you',       sublabel: 'Re-engagement',    body: (g, n) => `Hey ${n}, it's been a while since we've seen you at ${g}. Your progress is waiting — come back and pick up where you left off.` },
  { id: 'offer',     label: 'Bring a guest',      sublabel: 'Special offer',    body: (g, n) => `${n}, this week you can bring a guest to ${g} for free. A great time to train with someone you know.` },
  { id: 'challenge', label: 'New challenge',      sublabel: 'Motivation',       body: (g, n) => `${n}, a new challenge has just launched at ${g}. It's a great chance to push yourself and hit a new personal best.` },
  { id: 'nudge',     label: 'Friendly reminder',  sublabel: 'Check-in nudge',   body: (g, n) => `Just checking in, ${n}. Your spot at ${g} is ready whenever you are — consistency is everything.` },
  { id: 'streak',    label: 'Keep it going',      sublabel: 'Streak recovery',  body: (g, n) => `${n}, don't break your streak! Pop in to ${g} today and keep the momentum alive.` },
  { id: 'welcome',   label: 'Welcome back',       sublabel: 'Week-1 follow-up', body: (g, n) => `Great to have you at ${g}, ${n}! How's everything going? We'd love to see you again this week.` },
];

function ModeToggle({ mode, setMode }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: C.divider, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 12 }}>
      {[{ id: 'preset', label: 'Templates' }, { id: 'custom', label: 'Custom' }].map(m => (
        <button key={m.id} onClick={() => setMode(m.id)}
          style={{
            padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: mode === m.id ? C.blueDim : 'transparent',
            border: `1px solid ${mode === m.id ? C.blueBrd : 'transparent'}`,
            color: mode === m.id ? C.blue : C.t3, fontFamily: 'inherit', transition: 'all 0.12s',
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
        <button key={p.id} onClick={() => setPreset(p.id)}
          style={{
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
            background: preset === p.id ? C.blueDim : 'rgba(255,255,255,0.03)',
            border: `1px solid ${preset === p.id ? C.blueBrd : C.border}`,
            transition: 'all 0.12s', fontFamily: 'inherit',
          }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: preset === p.id ? C.blue : C.t1, marginBottom: 2 }}>{p.label}</div>
          <div style={{ fontSize: 9, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.sublabel}</div>
        </button>
      ))}
    </div>
  );
}

function SendBtn({ onClick, disabled, sending, sent, label }) {
  const ready = !disabled && !sending && !sent;
  return (
    <button onClick={onClick} disabled={disabled || sending || sent}
      style={{
        width: '100%', padding: '9px', borderRadius: 8,
        border: `1px solid ${sent ? C.greenBrd : ready ? C.blueBrd : C.border}`,
        cursor: ready ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontSize: 12, fontWeight: 700,
        background: sent ? C.greenDim : ready ? C.blueDim : 'rgba(255,255,255,0.03)',
        color: sent ? C.green : ready ? C.blue : C.t3,
        transition: 'all 0.15s', fontFamily: 'inherit',
      }}>
      {sent
        ? <><Check style={{ width: 12, height: 12 }} /> Sent</>
        : sending ? 'Sending…'
        : <><Send style={{ width: 12, height: 12 }} /> {label}</>}
    </button>
  );
}

/* ── Contextual nudge strip ──────────────────────────────────────────────── */
function StatNudge({ color = C.blue, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{
      marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '9px 11px', borderRadius: 8,
      background: `${color}08`, border: `1px solid ${color}1a`,
    }}>
      {Icon && <Icon style={{ width: 12, height: 12, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>{stat} </span>
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={e => { e.stopPropagation(); onAction(); }}
          style={{
            flexShrink: 0, fontSize: 10, fontWeight: 700, color,
            background: `${color}12`, border: `1px solid ${color}28`,
            borderRadius: 5, padding: '2px 8px', cursor: 'pointer',
            fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ── Individual push panel ───────────────────────────────────────────────── */
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
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  return (
    <div style={{
      padding: '14px 16px 16px',
      background: C.blueDim,
      borderBottom: `1px solid ${C.divider}`,
      borderLeft: `3px solid ${C.blue}50`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell style={{ width: 13, height: 13, color: C.blue }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Push Notification</div>
            <div style={{ fontSize: 10, color: C.t3 }}>Sending to {firstName}</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          width: 24, height: 24, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, cursor: 'pointer',
        }}>
          <X style={{ width: 11, height: 11, color: C.t3 }} />
        </button>
      </div>
      <ModeToggle mode={mode} setMode={setMode} />
      {mode === 'preset' ? <PresetGrid preset={preset} setPreset={setPreset} /> : (
        <textarea
          value={custom} onChange={e => setCustom(e.target.value)}
          placeholder={`Write a message to ${firstName}…`} rows={3}
          style={{
            width: '100%', boxSizing: 'border-box', marginBottom: 10,
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '8px 10px', fontSize: 11,
            color: C.t1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
          }}
          onFocus={e => e.target.style.borderColor = C.blueBrd}
          onBlur={e => e.target.style.borderColor = C.border}
        />
      )}
      {message && (
        <div style={{
          margin: '10px 0', padding: '9px 11px', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${C.blue}60`,
          fontSize: 11, color: C.t2, lineHeight: 1.6,
        }}>
          {message}
        </div>
      )}
      <SendBtn onClick={handleSend} disabled={!message.trim()} sending={sending} sent={sent} label={`Send to ${firstName}`} />
    </div>
  );
}

/* ── Bulk push panel ─────────────────────────────────────────────────────── */
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
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  return (
    <div style={{
      padding: '14px 16px 16px',
      background: C.blueDim,
      borderBottom: `1px solid ${C.divider}`,
      borderLeft: `3px solid ${C.blue}50`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users style={{ width: 13, height: 13, color: C.blue }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Bulk Notification</div>
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
              <div style={{
                marginLeft: -6, width: 20, height: 20, borderRadius: '50%',
                background: C.divider, border: `2px solid ${C.surface}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: C.t2 }}>+{memberCount - 4}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 24, height: 24, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, cursor: 'pointer',
          }}>
            <X style={{ width: 11, height: 11, color: C.t3 }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <ModeToggle mode={mode} setMode={setMode} />
          {mode === 'preset' ? <PresetGrid preset={preset} setPreset={setPreset} /> : (
            <textarea
              value={custom} onChange={e => setCustom(e.target.value)}
              placeholder={`Write a message to all ${memberCount} members…`} rows={4}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                borderRadius: 8, padding: '8px 10px', fontSize: 11,
                color: C.t1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
              }}
              onFocus={e => e.target.style.borderColor = C.blueBrd}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label>Preview</Label>
          <div style={{
            flex: 1, padding: '9px 11px', borderRadius: 8,
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${preview ? C.blue + '60' : C.border}`,
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

/* ── Segment summary cards ───────────────────────────────────────────────── */
function SegmentSummary({ memberRows, setMemberFilter, activeFilter }) {
  const segs = useMemo(() => {
    const superActive = memberRows.filter(m => m.visits30 >= 15).length;
    const active      = memberRows.filter(m => m.visits30 >= 4 && m.visits30 < 15 && m.daysSince < 14).length;
    const casual      = memberRows.filter(m => m.visits30 >= 1 && m.visits30 < 4 && m.daysSince < 14).length;
    const atRisk      = memberRows.filter(m => m.risk !== 'Low').length;
    const newM        = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 30).length;
    return [
      { id: 'superActive', label: 'Super Active', val: superActive, sub: '15+ visits/mo',  color: C.green,  filter: 'active' },
      { id: 'active',      label: 'Active',        val: active,      sub: '4–14 visits/mo', color: C.blue,   filter: 'active' },
      { id: 'casual',      label: 'Casual',        val: casual,      sub: '1–3 visits/mo',  color: C.amber,  filter: 'active' },
      { id: 'atRisk',      label: 'At Risk',        val: atRisk,      sub: '14+ days out',   color: C.red,    filter: 'atRisk' },
      { id: 'new',         label: 'New Members',    val: newM,        sub: 'Last 30 days',   color: C.purple, filter: 'new'    },
    ];
  }, [memberRows]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
      {segs.map(s => {
        const isActive = activeFilter === s.filter;
        return (
          <div key={s.id}
            onClick={() => setMemberFilter(isActive ? 'all' : s.filter)}
            style={{
              padding: '16px 14px', borderRadius: 13, cursor: 'pointer',
              background: C.surface,
              border: `1px solid ${isActive ? s.color + '45' : C.border}`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
              transition: 'all 0.15s', position: 'relative', overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${s.color}40`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isActive ? `${s.color}45` : C.border; e.currentTarget.style.transform = ''; }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
              background: `linear-gradient(90deg, ${s.color}70 0%, ${s.color}18 60%, transparent 100%)`,
              pointerEvents: 'none',
            }} />
            <Label>{s.label}</Label>
            <div style={{
              fontSize: 30, fontWeight: 800, color: s.val > 0 ? s.color : C.t3,
              letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 5,
            }}>
              {s.val}
            </div>
            <div style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>{s.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Alerts panel ────────────────────────────────────────────────────────── */
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
      {/* Top accent strip — red if alerts, green if clear */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
        background: noAlerts
          ? `linear-gradient(90deg,${C.green}60 0%,${C.green}18 60%,transparent 100%)`
          : `linear-gradient(90deg,${C.red}60 0%,${C.red}18 60%,transparent 100%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Alerts</div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{noAlerts ? 'All clear' : 'Members needing attention'}</div>
      </div>

      {noAlerts && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: C.greenDim, border: `1px solid ${C.greenBrd}` }}>
          <CheckCircle style={{ width: 13, height: 13, color: C.green, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>All members are active</span>
        </div>
      )}

      {criticalMembers.length > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: 9, background: C.redDim, border: `1px solid ${C.redBrd}`, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <AlertTriangle style={{ width: 12, height: 12, color: C.red, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{atRisk} members inactive 14+ days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
            {criticalMembers.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.t2 }}>{m.name}</span>
                <span style={{ fontSize: 10, color: C.red, fontWeight: 700 }}>{m.daysSince}d absent</span>
              </div>
            ))}
            {atRisk > 3 && <div style={{ fontSize: 10, color: C.t3 }}>+{atRisk - 3} more</div>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setMemberFilter('atRisk'); setMemberSort('highRisk'); }}
              style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: 'rgba(255,255,255,0.04)', color: C.t2, border: `1px solid ${C.border}`, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              View all
            </button>
            <button onClick={() => openModal('post')}
              style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: C.redDim, color: C.red, border: `1px solid ${C.redBrd}`, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Message them
            </button>
          </div>
        </div>
      )}

      {earlyDroppers.length > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: 9, background: C.amberDim, border: `1px solid ${C.amberBrd}`, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Zap style={{ width: 12, height: 12, color: C.amber, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>New members going quiet</span>
          </div>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 8, lineHeight: 1.5 }}>
            {earlyDroppers.map(m => m.name.split(' ')[0]).join(', ')} {earlyDroppers.length === 1 ? 'is' : 'are'} in the typical 7-day drop-off window.
          </div>
          <button onClick={() => setMemberFilter('new')}
            style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: C.amberDim, color: C.amber, border: `1px solid ${C.amberBrd}`, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            View new members
          </button>
        </div>
      )}

      {frequencyDroppers.length > 0 && (
        <div style={{ padding: '10px 12px', borderRadius: 9, background: C.amberDim, border: `1px solid ${C.amberBrd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <TrendingDown style={{ width: 12, height: 12, color: C.amber, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Frequency dropping</span>
          </div>
          {frequencyDroppers.map((m, i) => (
            <div key={i} style={{ fontSize: 11, color: C.t3, marginBottom: 3 }}>
              <span style={{ fontWeight: 600, color: C.t2 }}>{m.name}</span> — was {m.prevVisits30}/mo, now {m.visits30}/mo
            </div>
          ))}
          <StatNudge
            color={C.amber} icon={TrendingDown}
            stat={`${frequencyDroppers.length} member${frequencyDroppers.length > 1 ? 's' : ''} visited much less than usual.`}
            detail="A drop in frequency is an early churn signal — reaching out now is more effective than waiting."
            action="Message them"
            onAction={() => openModal('message')}
          />
        </div>
      )}
    </Card>
  );
}

/* ── Drop-off widget ─────────────────────────────────────────────────────── */
function DropOffWidget({ memberRows, setMemberFilter, setMemberSort }) {
  const buckets = useMemo(() => {
    const w1  = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14  && m.daysSince >= 7).length;
    const w2  = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 14   && m.joinedDaysAgo <= 30  && m.daysSince >= 7).length;
    const m2  = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 30   && m.joinedDaysAgo <= 90  && m.daysSince >= 14).length;
    const old = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 90   && m.daysSince >= 21).length;
    return [
      { label: 'Week 1 gone quiet',   sub: 'No return after joining',  val: w1,  color: C.red   },
      { label: 'Month 1 drift',       sub: 'Slipped in first month',   val: w2,  color: C.amber },
      { label: 'Month 2–3 slip',      sub: 'Common churn window',      val: m2,  color: C.amber },
      { label: 'Long-term inactive',  sub: '90+ day members, quiet',   val: old, color: C.t3    },
    ];
  }, [memberRows]);
  const total = buckets.reduce((a, b) => a + b.val, 0);

  return (
    <Card style={{ padding: 18 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Drop-off Patterns</div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Where members typically go quiet</div>
      </div>

      {total === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: C.greenDim, border: `1px solid ${C.greenBrd}` }}>
          <CheckCircle style={{ width: 13, height: 13, color: C.green, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>No drop-off patterns detected</span>
        </div>
      ) : (
        <>
          {buckets.map((b, i) => (
            <div key={i} style={{ marginBottom: i < buckets.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: b.val > 0 ? C.t1 : C.t3 }}>{b.label}</span>
                  <span style={{ fontSize: 10, color: C.t3, marginLeft: 7 }}>{b.sub}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: b.val > 0 ? b.color : C.t3 }}>{b.val}</span>
              </div>
              <div style={{ height: 2.5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: total > 0 ? `${(b.val / total) * 100}%` : '0%',
                  background: b.color, borderRadius: 99,
                  opacity: b.val > 0 ? 1 : 0.2,
                  transition: 'width 0.7s ease',
                }} />
              </div>
            </div>
          ))}
          <button onClick={() => { setMemberFilter('atRisk'); setMemberSort('highRisk'); }}
            style={{
              marginTop: 12, width: '100%', fontSize: 11, fontWeight: 600,
              color: C.red, background: C.redDim, border: `1px solid ${C.redBrd}`,
              padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
            View all at-risk members <ChevronRight style={{ width: 11, height: 11 }} />
          </button>
        </>
      )}
    </Card>
  );
}

/* ── Week-one return rate ─────────────────────────────────────────────────── */
function WeekOneFollowUp({ memberRows, setMemberFilter }) {
  const { returned, didnt, names } = useMemo(() => {
    const newish = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo >= 7 && m.joinedDaysAgo <= 21);
    let returned = 0, didnt = 0; const names = [];
    newish.forEach(m => { if (m.visitsTotal >= 2) returned++; else { didnt++; if (names.length < 3) names.push(m.name.split(' ')[0]); } });
    return { returned, didnt, names };
  }, [memberRows]);

  const total = returned + didnt;
  const pct   = total > 0 ? Math.round((returned / total) * 100) : 0;
  const color = total === 0 ? C.t3 : pct >= 60 ? C.green : pct >= 40 ? C.amber : C.red;

  return (
    <Card style={{ padding: 18 }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
        background: `linear-gradient(90deg,${color}60 0%,${color}18 60%,transparent 100%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Week-1 Return Rate</div>
        <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {total === 0 ? '—' : `${pct}%`}
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 12 }}>New members (joined 1–3 weeks ago) who returned</div>

      {total === 0 ? (
        <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>No members in this window yet.</p>
      ) : (
        <>
          <div style={{ height: 2.5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.7s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: C.greenDim, border: `1px solid ${C.greenBrd}`, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.green, letterSpacing: '-0.03em' }}>{returned}</div>
              <div style={{ fontSize: 10, color: C.t3, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Returned</div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: didnt > 0 ? C.redDim : 'rgba(255,255,255,0.03)', border: `1px solid ${didnt > 0 ? C.redBrd : C.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: didnt > 0 ? C.red : C.t3, letterSpacing: '-0.03em' }}>{didnt}</div>
              <div style={{ fontSize: 10, color: C.t3, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Didn't return</div>
            </div>
          </div>
          {didnt > 0 && names.length > 0 && (
            <div style={{ marginTop: 10, padding: '9px 11px', borderRadius: 8, background: C.redDim, border: `1px solid ${C.redBrd}` }}>
              <div style={{ fontSize: 11, color: C.t2, marginBottom: 6, lineHeight: 1.5 }}>
                {names.join(', ')}{didnt > 3 ? ` +${didnt - 3} more` : ''} — no return visit yet
              </div>
              <button onClick={() => setMemberFilter('new')}
                style={{ fontSize: 11, fontWeight: 600, color: C.red, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                View new members <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>
          )}
          <StatNudge
            color={color}
            icon={pct >= 60 ? CheckCircle : AlertTriangle}
            stat={pct >= 60
              ? `${returned} of ${total} new members came back.`
              : didnt === 1 ? `${names[0] || '1 member'} hasn't returned yet.`
              : `${didnt} new members haven't come back yet.`}
            detail={pct >= 60
              ? 'Good retention in week 1. Keep engaging them — the habit takes a few weeks to stick.'
              : pct >= 40
              ? 'A direct message to those who haven\'t returned is worth the effort — they\'re still in the decision window.'
              : 'Week 1 is the highest-leverage moment to reach out. The longer you wait, the harder it is.'}
            action={didnt > 0 ? 'Message them' : undefined}
            onAction={didnt > 0 ? () => setMemberFilter('new') : undefined}
          />
        </>
      )}
    </Card>
  );
}

/* ── Invite staff panel ──────────────────────────────────────────────────── */
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
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
        background: `linear-gradient(90deg,${C.purple}60 0%,${C.purple}18 60%,transparent 100%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: C.purpleDim, border: `1px solid ${C.purpleBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <GraduationCap style={{ width: 13, height: 13, color: C.purple }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Invite Staff</div>
          <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>Add coaches and employees</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[{ id: 'coach', label: 'Coach' }, { id: 'staff', label: 'Staff' }].map(r => (
          <button key={r.id} onClick={() => setRole(r.id)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              background: role === r.id ? C.purpleDim : 'rgba(255,255,255,0.03)',
              color: role === r.id ? C.purple : C.t3,
              border: `1px solid ${role === r.id ? C.purpleBrd : C.border}`,
              transition: 'all 0.12s',
            }}>
            {r.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: error ? 6 : 10 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Mail style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 11, height: 11, color: C.t3, pointerEvents: 'none' }} />
          <input
            value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="Email address"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 28px',
              borderRadius: 8, background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${error ? C.red + '50' : C.border}`,
              color: C.t1, fontSize: 12, outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = C.purpleBrd}
            onBlur={e => e.target.style.borderColor = error ? `${C.red}50` : C.border}
          />
        </div>
        <button onClick={handleInvite} disabled={!email.trim() || sending || sent}
          style={{
            padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: !email.trim() || sending || sent ? 'default' : 'pointer', fontFamily: 'inherit',
            border: `1px solid ${sent ? C.greenBrd : C.purpleBrd}`,
            background: sent ? C.greenDim : C.purpleDim,
            color: sent ? C.green : C.purple,
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, transition: 'all 0.15s',
          }}>
          {sent ? <><Check style={{ width: 11, height: 11 }} /> Sent</> : sending ? '…' : <><Send style={{ width: 11, height: 11 }} /> Send</>}
        </button>
      </div>

      {error && <div style={{ fontSize: 11, color: C.red, marginBottom: 8 }}>{error}</div>}
      <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.5, marginBottom: joinUrl ? 10 : 0 }}>
        They'll receive an email invite and be added as a <span style={{ fontWeight: 700, color: C.purple }}>{role}</span>.
      </div>

      {joinUrl && (
        <>
          <div style={{ height: 1, background: C.divider, margin: '10px 0' }} />
          <Label>Or share gym link</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
            <span style={{ flex: 1, fontSize: 10, color: C.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{joinUrl}</span>
            <button onClick={handleCopy}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                background: copied ? C.greenDim : C.purpleDim,
                color: copied ? C.green : C.purple,
                border: `1px solid ${copied ? C.greenBrd : C.purpleBrd}`,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {copied ? <><Check style={{ width: 9, height: 9 }} /> Copied</> : <><Copy style={{ width: 9, height: 9 }} /> Copy</>}
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

/* ── Expanded member detail ───────────────────────────────────────────────── */
function ExpandedMemberDetail({ m, gymName, gymId, checkIns, posts, now, onClose }) {
  const recentPosts = (posts || []).filter(p => p.user_id === m.user_id && differenceInDays(now, new Date(p.created_at)) <= 30).length;
  const engScore    = Math.min(100, Math.round((m.visits30 / 20) * 70 + (recentPosts / 5) * 30));
  const engColor    = engScore >= 70 ? C.green : engScore >= 40 ? C.amber : C.red;

  return (
    <>
      {/* Stats strip */}
      <div style={{
        padding: '10px 16px', background: 'rgba(255,255,255,0.02)',
        borderBottom: `1px solid ${C.divider}`,
        display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {[
          { label: 'Total Visits', val: m.visitsTotal,          color: C.blue     },
          { label: 'This Month',   val: m.visits30,             color: C.green    },
          { label: 'Last Month',   val: m.prevVisits30 ?? '—',  color: C.t2       },
          { label: 'Eng. Score',   val: `${engScore}%`,         color: engColor   },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.val}</div>
            <div style={{ fontSize: 9, color: C.t3, fontWeight: 700, textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Email */}
      {m.user_email && (
        <div style={{ padding: '8px 16px', background: C.blueDim, borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</span>
          <a href={`mailto:${m.user_email}`} style={{ fontSize: 12, fontWeight: 600, color: C.blue, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{m.user_email}</a>
        </div>
      )}

      {/* Contextual nudge */}
      {(() => {
        const nudgeWrap = (node) => (
          <div style={{ padding: '8px 16px', borderBottom: `1px solid ${C.divider}` }}>{node}</div>
        );
        const fn = m.name.split(' ')[0];
        if (m.daysSince >= 21)
          return nudgeWrap(<StatNudge color={C.red} icon={AlertTriangle} stat={`${m.daysSince} days since last visit.`} detail={`${fn} was visiting ${m.prevVisits30 > 0 ? `${m.prevVisits30}/mo before — now inactive.` : 'regularly before going quiet.'} This is the window to reach out.`} />);
        if (m.daysSince >= 14)
          return nudgeWrap(<StatNudge color={C.amber} icon={AlertTriangle} stat={`${m.daysSince} days away.`} detail={`${fn} is showing early churn signals. A quick check-in now is more effective than waiting.`} />);
        if (m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14 && m.visitsTotal < 2)
          return nudgeWrap(<StatNudge color={C.amber} icon={Zap} stat="New member — hasn't returned yet." detail={`${fn} joined ${m.joinedDaysAgo} day${m.joinedDaysAgo !== 1 ? 's' : ''} ago. A personal welcome message in the first two weeks makes a real difference.`} />);
        if (m.prevVisits30 >= 4 && m.visits30 <= m.prevVisits30 * 0.5)
          return nudgeWrap(<StatNudge color={C.amber} icon={TrendingDown} stat={`Visits down from ${m.prevVisits30} to ${m.visits30} this month.`} detail={`${fn}'s frequency has dropped noticeably — worth checking in before it falls further.`} />);
        if (m.streak >= 14)
          return nudgeWrap(<StatNudge color={C.green} icon={CheckCircle} stat={`${m.streak}-day streak.`} detail={`${fn} is highly consistent — a great candidate for a challenge or a referral ask.`} />);
        if (m.visitsTotal === 1)
          return nudgeWrap(<StatNudge color={C.amber} icon={Zap} stat="Only 1 visit so far." detail={`First impressions matter — reach out to ${fn} to make sure their experience was good.`} />);
        return null;
      })()}

      <MemberPushPanel member={m} gymName={gymName} gymId={gymId} onClose={onClose} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function TabMembers({
  allMemberships, checkIns, ci30, memberLastCheckIn, selectedGym,
  atRisk, atRiskMembersList, retentionRate, totalMembers, activeThisWeek, newSignUps, weeklyChangePct,
  avatarMap, posts,
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
      const name          = m.user_name || 'Member';
      const joinDate      = m.join_date || m.created_date || m.created_at;
      const joinedDaysAgo = joinDate ? Math.floor((now - new Date(joinDate)) / 86400000) : null;
      let risk = 'Low';
      if (daysSince >= 21) risk = 'High'; else if (daysSince >= 14) risk = 'Medium';
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
        visits30:     m.ci30Count     || 0,
        prevVisits30: m.prevCi30Count || 0,
        visitsTotal:  m.visitsTotal   || 0,
        lastVisit, daysSince, risk, lastVisitDisplay,
        plan: m.plan || m.membership_type || m.type || 'Standard',
        isBanned, avatar_url: avatarMap[m.user_id] || null,
        joinedDaysAgo, streak: m.streak || 0,
      };
    });
  }, [allMemberships, selectedGym?.banned_members, avatarMap, now]);

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
  const gymHealthScore = Math.min(100, Math.max(0, Math.round(retentionRate * 0.6 + (100 - Math.min(100, (atRisk / Math.max(totalMembers, 1)) * 100)) * 0.4)));

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

  const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCI = checkIns.filter(c => new Date(c.check_in_date) >= weekAgo);
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

        {/* ── Main member table ─────────────────────────────────────── */}
        <Card style={{ overflow: 'hidden' }}>

          {/* Filter bar */}
          <div style={{
            padding: '14px 16px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            position: 'sticky', top: 0, background: C.surface, zIndex: 10,
          }}>
            <button onClick={() => openModal('members')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                background: C.blue, color: '#fff', border: 'none',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
              }}>
              <Plus style={{ width: 12, height: 12 }} /> Add Member
            </button>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: 'all',      label: 'All',      count: filterCounts.all      },
                { id: 'active',   label: 'Active',   count: filterCounts.active   },
                { id: 'inactive', label: 'Inactive', count: filterCounts.inactive },
                { id: 'atRisk',   label: 'At Risk',  count: filterCounts.atRisk, danger: true },
                { id: 'new',      label: 'New',      count: filterCounts.new      },
              ].map(f => {
                const on = memberFilter === f.id;
                return (
                  <button key={f.id} onClick={() => handleFilter(f.id)}
                    style={{
                      padding: '5px 11px', borderRadius: 8, fontSize: 11,
                      fontWeight: on ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit',
                      background: on ? (f.danger ? C.redDim : C.blueDim) : 'rgba(255,255,255,0.03)',
                      color: on ? (f.danger ? C.red : C.blue) : C.t2,
                      border: `1px solid ${on ? (f.danger ? C.redBrd : C.blueBrd) : C.border}`,
                      transition: 'all 0.12s', display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                    {f.label}
                    <span style={{
                      fontSize: 9, fontWeight: 800,
                      color: on ? (f.danger ? C.red : C.blue) : C.t3,
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

            <select value={memberSort} onChange={e => setMemberSort(e.target.value)}
              style={{
                padding: '5px 9px', borderRadius: 7,
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
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
              <input placeholder="Search members" value={memberSearch} onChange={e => handleSearch(e.target.value)}
                style={{
                  padding: '6px 12px 6px 28px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                  color: C.t1, fontSize: 12, outline: 'none', fontFamily: 'inherit', width: 160,
                }}
                onFocus={e => e.target.style.borderColor = C.blueBrd}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>
          </div>

          {/* Bulk selection bar */}
          {selectedRows.size > 0 && (
            <div style={{ padding: '10px 16px', background: C.blueDim, borderBottom: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>
                {memberRows.filter(m => selectedRows.has(m.id)).slice(0, 3).map((m, i) => (
                  <div key={m.id} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 3 - i, border: `2px solid ${C.surface}`, borderRadius: '50%' }}>
                    <Avatar name={m.name} size={20} src={m.avatar_url} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>{selectedRows.size} {selectedRows.size === 1 ? 'member' : 'members'} selected</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => { setSelectedRows(new Set()); setShowBulkPanel(false); }}
                style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.t3, fontFamily: 'inherit' }}>
                Clear
              </button>
              <button onClick={() => setShowBulkPanel(v => !v)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: showBulkPanel ? 'rgba(59,130,246,0.20)' : C.blueDim,
                  border: `1px solid ${C.blueBrd}`, color: C.blue, fontFamily: 'inherit',
                }}>
                <Bell style={{ width: 11, height: 11 }} />
                {showBulkPanel ? 'Hide panel' : `Notify ${selectedRows.size}`}
              </button>
            </div>
          )}
          {showBulkPanel && selectedRows.size > 0 && (
            <BulkPushPanel selectedRows={selectedRows} memberRows={memberRows} gymName={gymName} gymId={selectedGym?.id} onClose={() => setShowBulkPanel(false)} onSuccess={() => setSelectedRows(new Set())} />
          )}

          {/* Column headers */}
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: 8, padding: '8px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input type="checkbox" checked={paginated.length > 0 && selectedRows.size === paginated.length} onChange={toggleAll} style={{ width: 13, height: 13, accentColor: C.blue, cursor: 'pointer' }} />
              </div>
              {['Member', 'Activity', 'Visits / Last seen', 'Membership', 'Actions'].map((col, i) => (
                <div key={i}><span style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col}</span></div>
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
                      gap: 8,
                      padding: isMobile ? '10px 12px' : '11px 16px',
                      borderBottom: !isExp && idx < paginated.length - 1 ? `1px solid ${C.divider}` : 'none',
                      borderLeft: isExp ? `3px solid ${C.blue}` : isSel ? `3px solid ${C.blue}40` : '3px solid transparent',
                      background: isExp ? C.blueDim : isSel ? 'rgba(59,130,246,0.04)' : 'transparent',
                      cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s', alignItems: 'center',
                    }}
                    onMouseEnter={e => { if (!isExp && !isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { if (!isExp && !isSel) e.currentTarget.style.background = 'transparent'; }}>

                    {/* Checkbox */}
                    <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={e => { e.stopPropagation(); handleToggleRow(m.id); }}>
                      <input type="checkbox" checked={isSel} onChange={() => handleToggleRow(m.id)} style={{ width: 13, height: 13, accentColor: C.blue, cursor: 'pointer' }} />
                    </div>

                    {/* Member name + avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, marginBottom: isMobile ? 8 : 0 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar name={m.name} size={32} src={m.avatar_url} />
                        {m.daysSince >= 14 && (
                          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: C.red, border: `2px solid ${C.surface}` }} />
                        )}
                        {m.streak >= 7 && (
                          <div style={{ position: 'absolute', top: -3, right: -3, width: 12, height: 12, borderRadius: '50%', background: C.amberDim, border: `1px solid ${C.amberBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Flame style={{ width: 7, height: 7, color: C.amber }} />
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isExp ? C.blue : C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>{m.name}</span>
                          <MilestoneBadge visitsTotal={m.visitsTotal} joinedDaysAgo={m.joinedDaysAgo} />
                        </div>
                        <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>
                          {m.streak > 1
                            ? <span style={{ color: C.amber, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Flame style={{ width: 9, height: 9 }} />{m.streak}-day streak</span>
                            : m.plan}
                        </div>
                      </div>
                    </div>

                    <div onClick={e => e.stopPropagation()}><ActivityChip m={m} /></div>

                    {!isMobile && <div onClick={e => e.stopPropagation()}><FrequencyInsight m={m} /></div>}

                    {!isMobile && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.plan}</div>
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
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {[
                { icon: ChevronLeft,  disabled: memberPage <= 1,          action: () => setMemberPage(p => Math.max(1, p - 1)) },
                { icon: ChevronRight, disabled: memberPage >= totalPages,  action: () => setMemberPage(p => Math.min(totalPages, p + 1)) },
              ].map(({ icon: Icon, disabled, action }, i) => (
                <button key={i} disabled={disabled} onClick={action}
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`,
                    color: disabled ? C.t4 : C.t2, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
                  }}>
                  <Icon style={{ width: 12, height: 12 }} />
                </button>
              ))}
            </div>
            {!isMobile && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) {
                if      (memberPage <= 3)               page = i + 1;
                else if (memberPage >= totalPages - 2)  page = totalPages - 4 + i;
                else                                    page = memberPage - 2 + i;
              }
              return (
                <button key={page} onClick={() => setMemberPage(page)}
                  style={{
                    width: 28, height: 28, borderRadius: 7,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: memberPage === page ? C.blueDim : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${memberPage === page ? C.blueBrd : C.border}`,
                    color: memberPage === page ? C.blue : C.t2,
                    fontSize: 12, fontWeight: memberPage === page ? 700 : 500,
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

        {/* ── Right sidebar ─────────────────────────────────────────── */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AlertsPanel
              memberRows={memberRows} atRisk={atRisk} atRiskMembersList={atRiskMembersList}
              setMemberFilter={handleFilter} setMemberSort={setMemberSort} openModal={openModal}
            />
            <DropOffWidget memberRows={memberRows} setMemberFilter={handleFilter} setMemberSort={setMemberSort} />
            <WeekOneFollowUp memberRows={memberRows} setMemberFilter={handleFilter} />
          </div>
        )}
      </div>

      {/* ── Growth + Leaderboards ─────────────────────────────────── */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Growth</div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Overall gym performance</div>
              </div>
              <HealthScore score={gymHealthScore} label="Gym Health" sub={gymHealthScore >= 75 ? 'Strong' : gymHealthScore >= 50 ? 'Steady' : 'Needs attention'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[
                { label: 'Retention',     value: `${retentionRate}%`, color: retentionRate >= 70 ? C.green : retentionRate >= 50 ? C.amber : C.red },
                { label: 'Active / week', value: activeThisWeek,      color: C.blue  },
                { label: 'New members',   value: newSignUps,           color: newSignUps > 0 ? C.green : C.t1 },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`,
                  textAlign: 'center',
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)`,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 5 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: C.t3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{ minWidth: 0 }}>
            <LeaderboardSection checkInLeaderboard={checkInLB} streakLeaderboard={streakLB} progressLeaderboard={[]} />
          </div>
        </div>
      )}
    </div>
  );
}
