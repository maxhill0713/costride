import React, { useMemo, useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  Plus, Search, ChevronDown, ChevronLeft, ChevronRight,
  Users, AlertTriangle, CheckCircle, TrendingUp,
  ArrowUpRight, UserPlus, QrCode, Trophy, Send, Bell, X, Check,
  Zap, Clock, Flame, Activity, Shield,
} from 'lucide-react';
import { Card, Avatar, StatusChip, FitnessScore, Empty } from './DashboardPrimitives';
import { base44 } from '@/api/base44Client';
import LeaderboardSection from '../leaderboard/LeaderboardSection';

// ── Design tokens (matches TabOverview) ───────────────────────────────────────
const T = {
  blue:    '#0ea5e9',
  green:   '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
  text1:   '#f0f4f8',
  text2:   '#94a3b8',
  text3:   '#475569',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120',
  divider: 'rgba(255,255,255,0.05)',
};

// ── Risk badge — two-tone only, no rainbow ────────────────────────────────────
const RiskBadge = ({ risk }) => {
  const map = {
    Low:    { color: T.green, bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)'  },
    Medium: { color: T.amber, bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
    High:   { color: T.red,   bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
  };
  const s = map[risk] || map.Low;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 7, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {risk}
    </span>
  );
};

const HealthScore = FitnessScore;

// ── Milestone tag — single neutral style, no per-milestone rainbow ─────────────
function MilestoneBadge({ visitsTotal, joinedDaysAgo }) {
  let label = null;
  if (visitsTotal === 1)   label = 'First visit';
  else if (visitsTotal === 10)  label = '10 visits';
  else if (visitsTotal === 25)  label = '25 visits';
  else if (visitsTotal === 50)  label = '50 visits';
  else if (visitsTotal === 100) label = '100 visits';
  else if (joinedDaysAgo !== null && joinedDaysAgo <= 7) label = 'New';
  if (!label) return null;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: T.text3, background: T.divider, border: `1px solid ${T.border}`, padding: '2px 6px', borderRadius: 5 }}>
      {label}
    </span>
  );
}

// ── Preset push messages ───────────────────────────────────────────────────────
const PRESET_MESSAGES = [
  { id: 'miss',      label: 'We miss you',       sublabel: 'Re-engagement',   body: (g, n) => `Hey ${n}, it's been a while since we've seen you at ${g}. Your progress is waiting — come back and pick up where you left off.` },
  { id: 'offer',     label: 'Bring a guest',      sublabel: 'Special offer',   body: (g, n) => `${n}, this week you can bring a guest to ${g} for free. A great time to train with someone you know.` },
  { id: 'challenge', label: 'New challenge',      sublabel: 'Motivation',      body: (g, n) => `${n}, a new challenge has just launched at ${g}. It's a great chance to push yourself and hit a new personal best.` },
  { id: 'nudge',     label: 'Friendly reminder',  sublabel: 'Check-in nudge',  body: (g, n) => `Just checking in, ${n}. Your spot at ${g} is ready whenever you are — consistency is everything.` },
  { id: 'streak',    label: 'Keep it going',      sublabel: 'Streak recovery', body: (g, n) => `${n}, don't break your streak! Pop in to ${g} today and keep the momentum alive.` },
  { id: 'welcome',   label: 'Welcome back',       sublabel: 'Week-1 follow-up',body: (g, n) => `Great to have you at ${g}, ${n}! How's everything going? We'd love to see you again this week.` },
];

// ── Single member push panel ───────────────────────────────────────────────────
function MemberPushPanel({ member, gymName, gymId, onClose }) {
  const [preset, setPreset] = useState('miss');
  const [custom, setCustom] = useState('');
  const [mode,   setMode]   = useState('preset');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const message = mode === 'preset'
    ? PRESET_MESSAGES.find(p => p.id === preset)?.body(gymName, member.name.split(' ')[0]) || ''
    : custom;

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
    <div style={{ padding: '14px 16px 16px', background: `${T.blue}06`, borderBottom: `1px solid ${T.divider}`, borderLeft: `3px solid ${T.blue}60` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell style={{ width: 13, height: 13, color: T.blue }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>Push Notification</div>
            <div style={{ fontSize: 10, color: T.text3 }}>Sending to {member.name.split(' ')[0]}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.divider, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
          <X style={{ width: 11, height: 11, color: T.text3 }} />
        </button>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 12, padding: 3, background: T.divider, borderRadius: 8, border: `1px solid ${T.border}`, width: 'fit-content' }}>
        {[{ id: 'preset', label: 'Templates' }, { id: 'custom', label: 'Custom' }].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: mode === m.id ? `${T.blue}18` : 'transparent', border: `1px solid ${mode === m.id ? T.blue + '35' : 'transparent'}`, color: mode === m.id ? T.blue : T.text3, fontFamily: 'inherit', transition: 'all 0.12s' }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'preset' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 12 }}>
          {PRESET_MESSAGES.map(p => (
            <button key={p.id} onClick={() => setPreset(p.id)} style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', background: preset === p.id ? `${T.blue}12` : T.divider, border: `1px solid ${preset === p.id ? T.blue + '40' : T.border}`, transition: 'all 0.12s', fontFamily: 'inherit' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: preset === p.id ? T.blue : T.text1, marginBottom: 2 }}>{p.label}</div>
              <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.sublabel}</div>
            </button>
          ))}
        </div>
      ) : (
        <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder={`Write a message to ${member.name.split(' ')[0]}…`} rows={3}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12, background: T.divider, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 11, color: T.text1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
          onFocus={e => e.target.style.borderColor = `${T.blue}50`} onBlur={e => e.target.style.borderColor = T.border} />
      )}

      {message && (
        <div style={{ marginBottom: 12, padding: '9px 11px', borderRadius: 8, background: T.divider, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.blue}60`, fontSize: 11, color: T.text2, lineHeight: 1.6 }}>
          {message}
        </div>
      )}

      <button onClick={handleSend} disabled={!message.trim() || sending || sent}
        style={{ width: '100%', padding: '9px', borderRadius: 8, border: `1px solid ${sent ? T.green + '40' : message.trim() ? T.blue + '40' : T.border}`, cursor: message.trim() && !sending && !sent ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: sent ? `${T.green}10` : message.trim() ? `${T.blue}12` : T.divider, color: sent ? T.green : message.trim() ? T.blue : T.text3, transition: 'all 0.15s', fontFamily: 'inherit' }}>
        {sent ? <><Check style={{ width: 12, height: 12 }} /> Sent</> : sending ? 'Sending…' : <><Send style={{ width: 12, height: 12 }} /> Send to {member.name.split(' ')[0]}</>}
      </button>
    </div>
  );
}

// ── Bulk push panel ────────────────────────────────────────────────────────────
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
        await Promise.all(members.map(m => base44.functions.invoke('sendPushNotification', { gym_id: gymId, gym_name: gymName, target: 'specific', message: buildMsg(preset, m.name.split(' ')[0]), member_ids: [m.user_id] })));
      } else {
        await base44.functions.invoke('sendPushNotification', { gym_id: gymId, gym_name: gymName, target: 'specific', message: preview.trim(), member_ids: members.map(m => m.user_id) });
      }
      setSent(true);
      setTimeout(() => { setSent(false); onSuccess(); onClose(); }, 2200);
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  return (
    <div style={{ padding: '14px 16px 16px', background: `${T.blue}06`, borderBottom: `1px solid ${T.divider}`, borderLeft: `3px solid ${T.blue}60` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users style={{ width: 13, height: 13, color: T.blue }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>Bulk Push Notification</div>
            <div style={{ fontSize: 10, color: T.text3 }}>{memberCount} {memberCount === 1 ? 'member' : 'members'} selected{mode === 'preset' && ' · personalised per name'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex' }}>
            {members.slice(0, 4).map((m, i) => (
              <div key={m.id} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 4 - i, border: '2px solid var(--card)', borderRadius: '50%' }}>
                <Avatar name={m.name} size={20} src={m.avatar_url || m.member_avatar} />
              </div>
            ))}
            {memberCount > 4 && (
              <div style={{ marginLeft: -6, width: 20, height: 20, borderRadius: '50%', background: T.divider, border: '2px solid var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: T.text2 }}>+{memberCount - 4}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.divider, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
            <X style={{ width: 11, height: 11, color: T.text3 }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 10, padding: 3, background: T.divider, borderRadius: 8, border: `1px solid ${T.border}`, width: 'fit-content' }}>
            {[{ id: 'preset', label: 'Templates' }, { id: 'custom', label: 'Custom' }].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: mode === m.id ? `${T.blue}18` : 'transparent', border: `1px solid ${mode === m.id ? T.blue + '35' : 'transparent'}`, color: mode === m.id ? T.blue : T.text3, fontFamily: 'inherit', transition: 'all 0.12s' }}>
                {m.label}
              </button>
            ))}
          </div>
          {mode === 'preset' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {PRESET_MESSAGES.map(p => (
                <button key={p.id} onClick={() => setPreset(p.id)} style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', background: preset === p.id ? `${T.blue}12` : T.divider, border: `1px solid ${preset === p.id ? T.blue + '40' : T.border}`, transition: 'all 0.12s', fontFamily: 'inherit' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: preset === p.id ? T.blue : T.text1, marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.sublabel}</div>
                </button>
              ))}
            </div>
          ) : (
            <textarea value={custom} onChange={e => setCustom(e.target.value)} placeholder={`Write a message to all ${memberCount} members…`} rows={4}
              style={{ width: '100%', boxSizing: 'border-box', background: T.divider, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 11, color: T.text1, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = `${T.blue}50`} onBlur={e => e.target.style.borderColor = T.border} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preview</div>
          <div style={{ flex: 1, padding: '9px 11px', borderRadius: 8, background: T.divider, border: `1px solid ${T.border}`, borderLeft: `3px solid ${preview ? T.blue + '60' : T.border}`, fontSize: 11, color: preview ? T.text2 : T.text3, lineHeight: 1.6, fontStyle: preview ? 'normal' : 'italic' }}>
            {preview || 'Select a template or write a message…'}
          </div>
          <button onClick={handleSend} disabled={!preview.trim() || sending || sent}
            style={{ width: '100%', padding: '9px', borderRadius: 8, border: `1px solid ${sent ? T.green + '40' : preview.trim() ? T.blue + '40' : T.border}`, cursor: preview.trim() && !sending && !sent ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 700, background: sent ? `${T.green}10` : preview.trim() ? `${T.blue}12` : T.divider, color: sent ? T.green : preview.trim() ? T.blue : T.text3, transition: 'all 0.15s', fontFamily: 'inherit' }}>
            {sent ? <><Check style={{ width: 13, height: 13 }} /> Sent to {memberCount}</> : sending ? `Sending…` : <><Send style={{ width: 13, height: 13 }} /> Send to {memberCount}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Segment summary — simplified, single-blue accent ─────────────────────────
function SegmentSummary({ memberRows, totalMembers, setMemberFilter, activeFilter }) {
  const segs = useMemo(() => {
    const superActive = memberRows.filter(m => m.visits30 >= 15).length;
    const active      = memberRows.filter(m => m.visits30 >= 4 && m.visits30 < 15 && m.daysSince < 14).length;
    const casual      = memberRows.filter(m => m.visits30 >= 1 && m.visits30 < 4 && m.daysSince < 14).length;
    const atRisk      = memberRows.filter(m => m.risk !== 'Low').length;
    const newM        = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 30).length;
    return [
      { id: 'superActive', label: 'Super Active', val: superActive, sub: '15+ visits/mo', color: T.green, filter: 'active'  },
      { id: 'active',      label: 'Active',        val: active,      sub: '4–14/mo',      color: T.blue,  filter: 'active'  },
      { id: 'casual',      label: 'Casual',        val: casual,      sub: '1–3/mo',       color: T.amber, filter: 'active'  },
      { id: 'atRisk',      label: 'At Risk',        val: atRisk,      sub: '14+ days',     color: T.red,   filter: 'atRisk'  },
      { id: 'new',         label: 'New',            val: newM,        sub: 'Last 30 days', color: T.text2, filter: 'new'     },
    ];
  }, [memberRows]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
      {segs.map(s => {
        const isActive = activeFilter === s.filter;
        return (
          <button key={s.id} onClick={() => setMemberFilter(isActive ? 'all' : s.filter)}
            style={{ padding: '14px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'center', background: T.card, border: `1px solid ${isActive ? s.color + '40' : T.border}`, transition: 'all 0.15s', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${s.color}40`}
            onMouseLeave={e => e.currentTarget.style.borderColor = isActive ? `${s.color}40` : T.border}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.val > 0 ? s.color : T.text3, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.val > 0 ? T.text1 : T.text3 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>{s.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

// ── Drop-off analysis ─────────────────────────────────────────────────────────
function DropOffWidget({ memberRows, setMemberFilter, setMemberSort }) {
  const buckets = useMemo(() => {
    const w1 = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo <= 14 && m.daysSince >= 7).length;
    const w2  = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 14 && m.joinedDaysAgo <= 30 && m.daysSince >= 7).length;
    const m2  = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 30 && m.joinedDaysAgo <= 90 && m.daysSince >= 14).length;
    const old = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo > 90 && m.daysSince >= 21).length;
    return [
      { label: 'Week 1 gone quiet', sub: 'Never came back after joining', val: w1,  color: T.red   },
      { label: 'Month 1 drift',      sub: 'Slipped in their first month',  val: w2,  color: T.amber },
      { label: 'Month 2–3 slip',     sub: 'Common churn window',           val: m2,  color: T.amber },
      { label: 'Long-term inactive', sub: '90+ day members, now quiet',    val: old, color: T.text3 },
    ];
  }, [memberRows]);
  const total = buckets.reduce((a, b) => a + b.val, 0);

  return (
    <div style={{ padding: 18, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>Drop-off Patterns</div>
      <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>When members typically go inactive</div>
      {total === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: `${T.green}0a`, border: `1px solid ${T.green}18` }}>
          <CheckCircle style={{ width: 13, height: 13, color: T.green, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: T.text2 }}>No drop-off patterns detected</span>
        </div>
      ) : (
        <>
          {buckets.map((b, i) => (
            <div key={i} style={{ marginBottom: i < buckets.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: b.val > 0 ? T.text1 : T.text3 }}>{b.label}</span>
                  <span style={{ fontSize: 10, color: T.text3, marginLeft: 7 }}>{b.sub}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: b.val > 0 ? b.color : T.text3 }}>{b.val}</span>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: total > 0 ? `${(b.val / total) * 100}%` : '0%', background: b.color, borderRadius: 99, opacity: b.val > 0 ? 1 : 0.2, transition: 'width 0.7s ease' }} />
              </div>
            </div>
          ))}
          <button onClick={() => { setMemberFilter('atRisk'); setMemberSort('highRisk'); }}
            style={{ marginTop: 12, width: '100%', fontSize: 11, fontWeight: 600, color: T.red, background: `${T.red}0a`, border: `1px solid ${T.red}20`, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            View all at-risk members <ChevronRight style={{ width: 11, height: 11 }} />
          </button>
        </>
      )}
    </div>
  );
}

// ── Week-1 follow-up ───────────────────────────────────────────────────────────
function WeekOneFollowUp({ memberRows, setMemberFilter }) {
  const { returned, didnt, names } = useMemo(() => {
    const newish = memberRows.filter(m => m.joinedDaysAgo !== null && m.joinedDaysAgo >= 7 && m.joinedDaysAgo <= 21);
    let returned = 0, didnt = 0; const names = [];
    newish.forEach(m => {
      if (m.visitsTotal >= 2) returned++;
      else { didnt++; if (names.length < 3) names.push(m.name.split(' ')[0]); }
    });
    return { returned, didnt, names };
  }, [memberRows]);
  const total = returned + didnt;
  const pct   = total > 0 ? Math.round((returned / total) * 100) : 0;
  const color = total === 0 ? T.text3 : pct >= 60 ? T.green : pct >= 40 ? T.amber : T.red;

  return (
    <div style={{ padding: 18, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Week-1 Return Rate</div>
        <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {total === 0 ? '—' : `${pct}%`}
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.text3, marginBottom: 12 }}>New members (joined 1–3 weeks ago) who returned</div>
      {total === 0 ? (
        <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>No members in this window yet.</p>
      ) : (
        <>
          <div style={{ height: 4, borderRadius: 99, background: T.divider, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.7s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: `${T.green}0a`, border: `1px solid ${T.green}18`, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{returned}</div>
              <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Came back</div>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 8, background: `${T.red}0a`, border: `1px solid ${didnt > 0 ? T.red + '18' : T.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: didnt > 0 ? T.red : T.text3 }}>{didnt}</div>
              <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Didn't return</div>
            </div>
          </div>
          {didnt > 0 && names.length > 0 && (
            <div style={{ marginTop: 10, padding: '9px 11px', borderRadius: 8, background: `${T.red}07`, border: `1px solid ${T.red}18` }}>
              <div style={{ fontSize: 11, color: T.text2, marginBottom: 5, lineHeight: 1.5 }}>{names.join(', ')}{didnt > 3 ? ` +${didnt - 3} more` : ''} — no return visit yet</div>
              <button onClick={() => setMemberFilter('new')} style={{ fontSize: 11, fontWeight: 600, color: T.red, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                View new members <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Expanded member detail ─────────────────────────────────────────────────────
function ExpandedMemberDetail({ m, gymName, gymId, checkIns, posts, now, onClose }) {
  const classLoyalty = useMemo(() => {
    const cc = {};
    checkIns.filter(c => c.user_id === m.user_id && c.class_id).forEach(c => { cc[c.class_id] = (cc[c.class_id] || 0) + 1; });
    const entries = Object.entries(cc);
    if (!entries.length) return null;
    const total = entries.reduce((a, [, v]) => a + v, 0);
    const [topId, topCount] = entries.sort((a, b) => b[1] - a[1])[0];
    if (total >= 4 && topCount / total >= 0.8) return { className: m.topClassName || `Class #${topId}`, pct: Math.round((topCount / total) * 100) };
    return null;
  }, [m, checkIns]);

  const recentPosts = (posts || []).filter(p => p.user_id === m.user_id && differenceInDays(now, new Date(p.created_at)) <= 30).length;
  const engScore    = Math.min(100, Math.round((m.visits30 / 20) * 70 + (recentPosts / 5) * 30));

  return (
    <>
      {/* Stats strip */}
      <div style={{ padding: '10px 16px', background: T.divider, borderBottom: `1px solid ${T.divider}`, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Visits', val: m.visitsTotal,        color: T.blue  },
          { label: 'This Month',   val: m.visits30,            color: T.green },
          { label: 'Posts (30d)',  val: recentPosts,           color: T.text2 },
          { label: 'Eng. Score',   val: `${engScore}%`,        color: engScore >= 70 ? T.green : engScore >= 40 ? T.amber : T.red },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.val}</div>
            <div style={{ fontSize: 9, color: T.text3, fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
        {classLoyalty && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 7, background: `${T.amber}0a`, border: `1px solid ${T.amber}20` }}>
            <Shield style={{ width: 10, height: 10, color: T.amber }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: T.amber }}>{classLoyalty.pct}% in one class — dependency risk</span>
          </div>
        )}
      </div>
      {m.user_email && (
        <div style={{ padding: '8px 16px', background: `${T.blue}06`, borderBottom: `1px solid ${T.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</span>
          <a href={`mailto:${m.user_email}`} style={{ fontSize: 12, fontWeight: 600, color: T.blue, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{m.user_email}</a>
        </div>
      )}
      <MemberPushPanel member={m} gymName={gymName} gymId={gymId} onClose={onClose} />
    </>
  );
}

// ── Stat row helper ────────────────────────────────────────────────────────────
function StatRow({ label, value, valueColor, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}` }}>
      <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || T.text1 }}>{value}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
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

  // ── Build member rows ────────────────────────────────────────────────────────
  const memberRows = useMemo(() => allMemberships.map(m => {
    const userCI     = checkIns.filter(c => c.user_id === m.user_id);
    const visits30   = ci30.filter(c => c.user_id === m.user_id).length;
    const lastVisit  = memberLastCheckIn[m.user_id];
    const daysSince  = lastVisit ? Math.floor((now - new Date(lastVisit)) / 86400000) : 999;
    const isBanned   = (selectedGym?.banned_members || []).includes(m.user_id);
    const name       = userCI[0]?.user_name || m.user_name || 'Member';
    const joinDate   = m.join_date || m.created_date || m.created_at;
    const joinedDaysAgo = joinDate ? differenceInDays(now, new Date(joinDate)) : null;

    let tier = 'New';
    if (visits30 >= 15) tier = 'Super Active'; else if (visits30 >= 8) tier = 'Active'; else if (visits30 >= 1) tier = 'Casual';
    let risk = 'Low';
    if (daysSince >= 21) risk = 'High'; else if (daysSince >= 14) risk = 'Medium';
    let statusTag = tier === 'Super Active' || tier === 'Active' ? 'Engaged' : tier === 'New' ? 'New' : 'Casual';
    if (daysSince >= 14) statusTag = 'At Risk';
    if (isBanned) statusTag = 'Banned';

    let lastVisitDisplay = 'Never';
    if (lastVisit) {
      if (daysSince === 0)     lastVisitDisplay = 'Today';
      else if (daysSince === 1)lastVisitDisplay = '1 day ago';
      else if (daysSince < 7)  lastVisitDisplay = `${daysSince} days ago`;
      else if (daysSince < 14) lastVisitDisplay = '1 week ago';
      else if (daysSince < 30) lastVisitDisplay = `${Math.floor(daysSince / 7)} weeks ago`;
      else                     lastVisitDisplay = format(new Date(lastVisit), 'd MMM');
    }

    const sortedCI = userCI.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
    let streak = sortedCI.length > 0 ? 1 : 0;
    let cur = sortedCI.length > 0 ? new Date(sortedCI[0].check_in_date) : null;
    if (cur) {
      cur.setHours(0, 0, 0, 0);
      for (let i = 1; i < sortedCI.length; i++) {
        const d = new Date(sortedCI[i].check_in_date); d.setHours(0, 0, 0, 0);
        const diff = Math.floor((cur - d) / 86400000);
        if (diff === 1) { streak++; cur = d; } else if (diff > 1) break;
      }
    }

    return {
      ...m, name, visits30, visitsTotal: userCI.length, lastVisit, daysSince,
      tier, risk, statusTag, lastVisitDisplay,
      plan: m.plan || m.membership_type || m.type || 'Standard',
      isBanned, avatar_url: avatarMap[m.user_id] || null, joinedDaysAgo, streak,
    };
  }), [allMemberships, checkIns, ci30, memberLastCheckIn, selectedGym?.banned_members, avatarMap, now]);

  // ── Filtering & sorting ──────────────────────────────────────────────────────
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
  const handleToggleRow = (id) => { const s = new Set(selectedRows); s.has(id) ? s.delete(id) : s.add(id); setSelectedRows(s); if (s.size === 0) setShowBulkPanel(false); };
  const handleFilter    = (f)  => { setMemberFilter(f); setMemberPage(1); };
  const handleSearch    = (v)  => { setMemberSearch(v); setMemberPage(1); };

  // Leaderboards
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyCI = checkIns.filter(c => new Date(c.check_in_date) >= weekAgo);
  const checkInLB = Object.values(weeklyCI.reduce((acc, c) => {
    if (!acc[c.user_id]) acc[c.user_id] = { userId: c.user_id, userName: c.user_name, userAvatar: avatarMap[c.user_id] || null, count: 0 };
    acc[c.user_id].count++;
    return acc;
  }, {})).sort((a, b) => b.count - a.count).slice(0, 10);

  const streakLB = memberRows.map(m => ({ userId: m.user_id, userName: m.name, userAvatar: m.avatar_url, streak: m.streak }))
    .sort((a, b) => b.streak - a.streak).slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Segment summary */}
      {!isMobile && (
        <SegmentSummary memberRows={memberRows} totalMembers={totalMembers} setMemberFilter={handleFilter} activeFilter={memberFilter} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 268px', gap: 16, alignItems: 'start' }}>

        {/* ── Member Table ── */}
        <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, overflow: 'hidden' }}>

          {/* Filter bar */}
          <div style={{ padding: isMobile ? '12px 12px 10px' : '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => openModal('members')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: T.blue, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
              <Plus style={{ width: 12, height: 12 }} /> Add Member
            </button>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {[
                { id: 'all',      label: 'All',      count: filterCounts.all      },
                { id: 'active',   label: 'Active',   count: filterCounts.active   },
                { id: 'inactive', label: 'Inactive', count: filterCounts.inactive },
                { id: 'atRisk',   label: 'At Risk',  count: filterCounts.atRisk,  danger: true },
                { id: 'new',      label: 'New',      count: filterCounts.new      },
              ].map(f => (
                <button key={f.id} onClick={() => handleFilter(f.id)}
                  style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: memberFilter === f.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit', background: memberFilter === f.id ? (f.danger ? `${T.red}14` : `${T.blue}14`) : 'transparent', color: memberFilter === f.id ? (f.danger ? T.red : T.blue) : T.text3, border: `1px solid ${memberFilter === f.id ? (f.danger ? T.red + '30' : T.blue + '30') : 'transparent'}`, transition: 'all 0.12s' }}>
                  {f.label}
                  {f.danger && f.count > 0 && <span style={{ marginLeft: 4, background: T.red, color: '#fff', borderRadius: 99, padding: '0 5px', fontSize: 9, fontWeight: 800 }}>{f.count}</span>}
                </button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: T.text3 }} />
              <input placeholder="Search members…" value={memberSearch} onChange={e => handleSearch(e.target.value)}
                style={{ padding: '7px 12px 7px 28px', borderRadius: 8, background: T.divider, border: `1px solid ${T.border}`, color: T.text1, fontSize: 12, outline: 'none', fontFamily: 'inherit', width: 180 }} />
            </div>
          </div>

          {/* Sort + hint bar */}
          <div style={{ padding: '8px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>Sort</span>
            <select value={memberSort} onChange={e => setMemberSort(e.target.value)}
              style={{ padding: '5px 9px', borderRadius: 7, background: T.divider, border: `1px solid ${T.border}`, color: T.text2, fontSize: 11, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <option value="recentlyActive">Recently Active</option>
              <option value="mostVisits">Most Visits</option>
              <option value="newest">Newest First</option>
              <option value="highRisk">High Risk First</option>
              <option value="streak">Longest Streak</option>
              <option value="name">Name A–Z</option>
            </select>
            <div style={{ flex: 1 }} />
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.text3 }}>
                <Bell style={{ width: 10, height: 10 }} />
                <span>Click a member row to send a notification</span>
              </div>
            )}
          </div>

          {/* Bulk selection bar */}
          {selectedRows.size > 0 && (
            <div style={{ padding: '10px 16px', background: `${T.blue}08`, borderBottom: `1px solid ${T.blue}20`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>
                {memberRows.filter(m => selectedRows.has(m.id)).slice(0, 3).map((m, i) => (
                  <div key={m.id} style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 3 - i, border: '2px solid var(--card)', borderRadius: '50%' }}>
                    <Avatar name={m.name} size={20} src={m.avatar_url || m.member_avatar} />
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>{selectedRows.size} {selectedRows.size === 1 ? 'member' : 'members'} selected</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => { setSelectedRows(new Set()); setShowBulkPanel(false); }} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: T.divider, border: `1px solid ${T.border}`, color: T.text3, fontFamily: 'inherit' }}>Clear</button>
              <button onClick={() => setShowBulkPanel(v => !v)}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: showBulkPanel ? `${T.blue}20` : `${T.blue}12`, border: `1px solid ${T.blue}40`, color: T.blue, fontFamily: 'inherit', transition: 'all 0.12s' }}>
                <Bell style={{ width: 11, height: 11 }} />
                {showBulkPanel ? 'Hide panel' : `Notify ${selectedRows.size}`}
              </button>
            </div>
          )}

          {/* Bulk push */}
          {showBulkPanel && selectedRows.size > 0 && (
            <BulkPushPanel selectedRows={selectedRows} memberRows={memberRows} gymName={gymName} gymId={selectedGym?.id} onClose={() => setShowBulkPanel(false)} onSuccess={() => setSelectedRows(new Set())} />
          )}

          {/* Table header */}
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '32px 2.5fr 1fr 1fr 1fr 1fr', gap: 8, padding: '8px 16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input type="checkbox" checked={paginated.length > 0 && selectedRows.size === paginated.length} onChange={toggleAll} style={{ width: 13, height: 13, accentColor: T.blue, cursor: 'pointer' }} />
              </div>
              {['Member', 'Status', 'Last Visit', 'Membership', 'Risk'].map((col, i) => (
                <div key={i}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{col}</span>
                </div>
              ))}
            </div>
          )}

          {/* Table body */}
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
                  <div onClick={() => { setExpandedMember(isExp ? null : m.id); if (showBulkPanel) setShowBulkPanel(false); }}
                    style={{
                      display: isMobile ? 'block' : 'grid',
                      gridTemplateColumns: isMobile ? undefined : '32px 2.5fr 1fr 1fr 1fr 1fr',
                      gap: 8, padding: isMobile ? '10px 12px' : '12px 16px',
                      borderBottom: !isExp && idx < paginated.length - 1 ? `1px solid ${T.divider}` : 'none',
                      borderLeft: isExp ? `3px solid ${T.blue}60` : isSel ? `3px solid ${T.blue}35` : '3px solid transparent',
                      background: isSel && !isExp ? `${T.blue}05` : 'transparent',
                      cursor: 'pointer', transition: 'background 0.12s, border-color 0.12s',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => { if (!isExp && !isSel) e.currentTarget.style.background = T.divider; }}
                    onMouseLeave={e => { if (!isExp && !isSel) e.currentTarget.style.background = 'transparent'; }}>

                    {/* Checkbox */}
                    <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { e.stopPropagation(); handleToggleRow(m.id); }}>
                      <input type="checkbox" checked={isSel} onChange={() => handleToggleRow(m.id)} style={{ width: 13, height: 13, accentColor: T.blue, cursor: 'pointer' }} />
                    </div>

                    {/* Member name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, marginBottom: isMobile ? 8 : 0 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar name={m.name} size={32} src={m.avatar_url || m.member_avatar} />
                        {m.daysSince >= 14 && (
                          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: T.red, border: '2px solid var(--card)' }} />
                        )}
                        {m.streak >= 7 && (
                          <div style={{ position: 'absolute', top: -3, right: -3, fontSize: 9, lineHeight: 1 }}>🔥</div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: isExp ? T.blue : T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>{m.name}</span>
                          <MilestoneBadge visitsTotal={m.visitsTotal} joinedDaysAgo={m.joinedDaysAgo} />
                        </div>
                        <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>
                          {m.streak > 1
                            ? <span style={{ color: T.amber, fontWeight: 600 }}>🔥 {m.streak}-day streak</span>
                            : m.visits30 > 0
                              ? <span>{m.tier}</span>
                              : 'No visits this month'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div><StatusChip status={m.statusTag} /></div>

                    {/* Last visit */}
                    {!isMobile && (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: m.daysSince === 0 ? T.green : m.daysSince >= 14 ? T.red : T.text1 }}>
                          {m.visits30 > 0 ? <><span style={{ fontWeight: 800 }}>{m.visits30}</span> <span style={{ fontWeight: 400, fontSize: 11, color: T.text3 }}>visits</span></> : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{m.lastVisitDisplay}</div>
                      </div>
                    )}

                    {/* Membership */}
                    {!isMobile && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.plan}</div>
                        <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>
                          {m.join_date ? `Joined ${format(new Date(m.join_date), 'MMM d, yyyy')}` : m.created_date ? `Joined ${format(new Date(m.created_date), 'MMM d, yyyy')}` : 'Active member'}
                        </div>
                      </div>
                    )}

                    {/* Risk + notify icon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <RiskBadge risk={m.risk} />
                      <div style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isExp ? `${T.blue}18` : T.divider, border: `1px solid ${isExp ? T.blue + '40' : T.border}`, transition: 'all 0.15s', flexShrink: 0 }}>
                        <Bell style={{ width: 11, height: 11, color: isExp ? T.blue : T.text3 }} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExp && (
                    <ExpandedMemberDetail m={m} gymName={gymName} gymId={selectedGym?.id} checkIns={checkIns} posts={posts} now={now} onClose={() => setExpandedMember(null)} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 3 }}>
              <button disabled={memberPage <= 1} onClick={() => setMemberPage(p => Math.max(1, p - 1))}
                style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.divider, border: `1px solid ${T.border}`, color: memberPage <= 1 ? T.text3 : T.text2, cursor: memberPage <= 1 ? 'default' : 'pointer' }}>
                <ChevronLeft style={{ width: 12, height: 12 }} />
              </button>
              <button disabled={memberPage >= totalPages} onClick={() => setMemberPage(p => Math.min(totalPages, p + 1))}
                style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.divider, border: `1px solid ${T.border}`, color: memberPage >= totalPages ? T.text3 : T.text2, cursor: memberPage >= totalPages ? 'default' : 'pointer' }}>
                <ChevronRight style={{ width: 12, height: 12 }} />
              </button>
            </div>
            {!isMobile && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) {
                if (memberPage <= 3) page = i + 1;
                else if (memberPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = memberPage - 2 + i;
              }
              return (
                <button key={page} onClick={() => setMemberPage(page)}
                  style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: memberPage === page ? `${T.blue}18` : T.divider, border: `1px solid ${memberPage === page ? T.blue + '40' : T.border}`, color: memberPage === page ? T.blue : T.text2, fontSize: 12, fontWeight: memberPage === page ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {page}
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: T.text3 }}>{sorted.length} members · Page {memberPage} of {totalPages}</span>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Alerts */}
            <div style={{ padding: 18, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Alerts</div>
              {atRisk > 0 ? (
                <div style={{ padding: '12px', borderRadius: 9, background: `${T.red}08`, border: `1px solid ${T.red}20`, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <AlertTriangle style={{ width: 13, height: 13, color: T.red, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{atRisk} Members At Risk</div>
                      <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>Haven't visited in 14+ days</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleFilter('atRisk')} style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>View</button>
                    <button onClick={() => openModal('post')} style={{ flex: 1, padding: '6px 0', borderRadius: 7, background: `${T.red}14`, color: T.red, border: `1px solid ${T.red}30`, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Message</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: `${T.green}0a`, border: `1px solid ${T.green}18` }}>
                  <CheckCircle style={{ width: 13, height: 13, color: T.green, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: T.text2 }}>All members are active</span>
                </div>
              )}
              {memberRows.filter(m => m.risk === 'High').length > 0 && (
                <div style={{ padding: '12px', borderRadius: 9, background: `${T.amber}08`, border: `1px solid ${T.amber}20` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Zap style={{ width: 13, height: 13, color: T.amber, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{memberRows.filter(m => m.risk === 'High').length} High-Risk Members</div>
                      <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{memberRows.filter(m => m.risk === 'High').slice(0, 2).map(m => m.name).join(', ')}</div>
                    </div>
                  </div>
                  <button onClick={() => { handleFilter('atRisk'); setMemberSort('highRisk'); }}
                    style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: `${T.amber}12`, color: T.amber, border: `1px solid ${T.amber}30`, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    View & resolve
                  </button>
                </div>
              )}
            </div>

            {/* Drop-off patterns */}
            <DropOffWidget memberRows={memberRows} setMemberFilter={handleFilter} setMemberSort={setMemberSort} />

            {/* Week-1 follow-up */}
            <WeekOneFollowUp memberRows={memberRows} setMemberFilter={handleFilter} />

            {/* Growth snapshot */}
            <div style={{ padding: 18, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Growth</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <StatRow label="Retention"    value={`${retentionRate}%`}  valueColor={retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red} />
                  <StatRow label="Active / week" value={activeThisWeek}       valueColor={T.blue} />
                  <StatRow label="New this month" value={newSignUps}          valueColor={newSignUps > 0 ? T.green : T.text1} last />
                </div>
                <HealthScore score={gymHealthScore} label="Gym Health" sub={gymHealthScore >= 75 ? 'Great!' : gymHealthScore >= 50 ? 'Keep going' : 'Needs work'} />
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ padding: 18, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 12 }}>Quick Actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { icon: UserPlus, label: 'Add Member',    fn: () => openModal('members')   },
                  { icon: QrCode,   label: 'Scan Check-in', fn: () => openModal('qrScanner') },
                  { icon: Trophy,   label: 'New Challenge', fn: () => openModal('challenge') },
                  { icon: Send,     label: 'Send Message',  fn: () => openModal('post')       },
                ].map(({ icon: Icon, label, fn }, i) => {
                  const [hov, setHov] = useState(false);
                  return (
                    <button key={i} onClick={fn} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', borderRadius: 8, background: hov ? `${T.blue}10` : T.divider, border: `1px solid ${hov ? T.blue + '30' : T.border}`, cursor: 'pointer', transition: 'all 0.12s', fontSize: 11, fontWeight: 600, color: hov ? T.text1 : T.text2, fontFamily: 'inherit' }}>
                      <Icon style={{ width: 12, height: 12, color: T.blue, flexShrink: 0 }} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Leaderboard */}
            <LeaderboardSection checkInLeaderboard={checkInLB} streakLeaderboard={streakLB} progressLeaderboard={[]} />
          </div>
        )}
      </div>
    </div>
  );
}
