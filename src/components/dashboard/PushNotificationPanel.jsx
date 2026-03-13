import React, { useState } from 'react';
import { Send, Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRESET_MESSAGES = [
  { id: 'miss',      label: 'We miss you',    body: (g) => `Hey! We haven't seen you at ${g} in a while. Come back and keep your progress going — your gym family misses you.` },
  { id: 'offer',     label: 'Special offer',  body: (g) => `Good news from ${g}! Come in this week and bring a guest for free. We'd love to see you back.` },
  { id: 'challenge', label: 'New challenge',  body: (g) => `${g} has a fresh challenge waiting for you. Join in, compete with your gym family, and hit a new PB.` },
  { id: 'nudge',     label: 'Friendly nudge', body: (g) => `Just a friendly nudge from ${g} — it's been a while! Your spot's waiting whenever you're ready.` },
];

function initials(name) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function PushNotificationPanel({
  atRiskMembers = [],
  allMembers = [],
  selectedGym,
  memberLastCheckIn,
}) {
  const [mode, setMode] = useState('preset');
  const [selectedPreset, setSelectedPreset] = useState('miss');
  const [customMsg, setCustomMsg] = useState('');
  const [target, setTarget] = useState('atRisk');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [memberTab, setMemberTab] = useState('risk');

  const now = new Date();
  const gymName = selectedGym?.name || 'Iron Peak Fitness';
  const targetCount = target === 'atRisk' ? atRiskMembers.length : allMembers.length;
  const message = mode === 'preset' && selectedPreset
    ? PRESET_MESSAGES.find(p => p.id === selectedPreset)?.body(gymName) || ''
    : customMsg;
  const canSend = message.trim().length > 0 && targetCount > 0 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    const memberIds = target === 'atRisk'
      ? atRiskMembers.map(m => m.user_id)
      : allMembers.map(m => m.user_id);
    try {
      await base44.functions.invoke('sendPushNotification', {
        gym_id: selectedGym?.id,
        gym_name: gymName,
        target,
        message: message.trim(),
        member_ids: memberIds,
      });
      setSent({ count: memberIds.length });
    } catch (error) {
      console.error('Failed to send notification:', error);
    } finally {
      setSending(false);
      setTimeout(() => setSent(null), 5000);
    }
  };

  const list = memberTab === 'risk' ? atRiskMembers : allMembers;

  return (
    <div style={{
      width: '100%',
      borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      color: '#e2e8f0',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Push Notifications</div>
        {/* Inline stats — saves a whole row vs separate cards */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#f87171', fontWeight: 700 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>{atRiskMembers.length}</span> at-risk
          </span>
          <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }}/>
          <span style={{ fontSize: 11, color: '#2dd4bf', fontWeight: 700 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>{allMembers.length}</span> active
          </span>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Member tabs + compact list ── */}
        <div>
          {/* Tab row */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 7, padding: 3, gap: 2, marginBottom: 8 }}>
            {[
              { id: 'risk', label: `At-risk (${atRiskMembers.length})` },
              { id: 'all',  label: `All (${allMembers.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setMemberTab(t.id)} style={{
                flex: 1, padding: '5px 6px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: memberTab === t.id ? 'rgba(20,184,166,0.15)' : 'transparent',
                color: memberTab === t.id ? '#2dd4bf' : '#64748b',
              }}>{t.label}</button>
            ))}
          </div>
          {/* Show max 3 members to keep height tight */}
          {list.length === 0 ? (
            <div style={{ padding: '8px 0', textAlign: 'center', fontSize: 12, color: '#475569' }}>No members found</div>
          ) : (
            <div style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              {list.slice(0, 3).map((m, i) => {
                const last = memberLastCheckIn?.[m.user_id];
                const days = last ? Math.floor((now - new Date(last)) / 86400000) : null;
                const isRisk = memberTab === 'risk' || (days !== null && days >= 10);
                const name = m.user_name || m.name || 'Member';
                return (
                  <div key={m.user_id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                    borderBottom: i < Math.min(list.length, 3) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: isRisk ? 'rgba(239,68,68,0.12)' : 'rgba(20,184,166,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700,
                      color: isRisk ? '#f87171' : '#2dd4bf',
                    }}>{initials(name)}</div>
                    <span style={{ flex: 1, fontSize: 12, color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
                      background: isRisk ? 'rgba(239,68,68,0.1)' : 'rgba(20,184,166,0.1)',
                      color: isRisk ? '#f87171' : '#2dd4bf',
                    }}>{days !== null ? `${days}d` : isRisk ? 'At-risk' : 'Active'}</span>
                  </div>
                );
              })}
              {list.length > 3 && (
                <div style={{ padding: '6px 10px', fontSize: 11, color: '#2dd4bf', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                  +{list.length - 3} more <ChevronRight style={{ width: 10, height: 10, verticalAlign: 'middle' }}/>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Send to chips ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Send to</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'atRisk', label: `At-risk (${atRiskMembers.length})` },
              { id: 'all',    label: `All (${allMembers.length})` },
            ].map(opt => (
              <button key={opt.id} onClick={() => setTarget(opt.id)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${target === opt.id ? 'rgba(20,184,166,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: target === opt.id ? 'rgba(20,184,166,0.1)' : 'transparent',
                color: target === opt.id ? '#2dd4bf' : '#64748b',
                transition: 'all 0.15s',
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* ── Message mode chips ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Message</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[{ id: 'preset', label: 'Preset' }, { id: 'custom', label: 'Custom' }].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${mode === m.id ? 'rgba(20,184,166,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: mode === m.id ? 'rgba(20,184,166,0.1)' : 'transparent',
                color: mode === m.id ? '#2dd4bf' : '#64748b',
                transition: 'all 0.15s',
              }}>{m.label}</button>
            ))}
          </div>

          {mode === 'preset' ? (
            /* Compact preset list — label only, no body preview */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {PRESET_MESSAGES.map(p => (
                <div key={p.id} onClick={() => setSelectedPreset(p.id)} style={{
                  padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
                  border: `1px solid ${selectedPreset === p.id ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  background: selectedPreset === p.id ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: selectedPreset === p.id ? '#2dd4bf' : '#f1f5f9' }}>{p.label}</span>
                  {selectedPreset === p.id && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dd4bf', flexShrink: 0 }}/>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <textarea
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
              placeholder="Write a message…"
              rows={3}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#f1f5f9',
                resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5, fontFamily: 'inherit',
              }}
            />
          )}
        </div>
      </div>

      {/* ── Footer / Send button ── */}
      <div style={{ padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {sent ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)', fontSize: 12, fontWeight: 600, color: '#2dd4bf' }}>
            <Check style={{ width: 13, height: 13 }}/> Sent to {sent.count} member{sent.count !== 1 ? 's' : ''}!
          </div>
        ) : (
          <button onClick={handleSend} disabled={!canSend} style={{
            width: '100%', padding: '10px', borderRadius: 10, border: 'none',
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
            background: canSend ? 'linear-gradient(135deg,#0d9488,#14b8a6)' : 'rgba(255,255,255,0.04)',
            color: canSend ? '#fff' : '#334155',
            opacity: sending ? 0.7 : 1,
          }}>
            {sending ? 'Sending…' : (
              <><Send style={{ width: 13, height: 13 }}/>{canSend ? `Send to ${targetCount} members` : 'Select a message'}</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
