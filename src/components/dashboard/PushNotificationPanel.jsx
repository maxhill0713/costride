import React, { useState } from 'react';
import { Send, Check, AlertTriangle, ChevronRight, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRESET_MESSAGES = [
  { id: 'miss',      label: 'We miss you',    body: (g) => `Hey! We haven't seen you at ${g} in a while. Come back and keep your progress going — your gym family misses you.` },
  { id: 'offer',     label: 'Special offer',  body: (g) => `Good news from ${g}! Come in this week and bring a guest for free. We'd love to see you back.` },
  { id: 'challenge', label: 'New challenge',  body: (g) => `${g} has a fresh challenge waiting for you. Join in, compete with your gym family, and hit a new PB.` },
  { id: 'nudge',     label: 'Friendly nudge', body: (g) => `Just a friendly nudge from ${g} — it's been a while! Your spot's waiting whenever you're ready.` },
];

function initials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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
  const gymName = selectedGym?.name || 'Your Gym';
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
      borderRadius: 16,
      background: 'var(--card)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell style={{ width: 13, height: 13, color: 'var(--cyan)' }}/>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>Push Notifications</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle style={{ width: 9, height: 9, color: '#f87171' }}/>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#f87171' }}>{atRiskMembers.length} at-risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 7, background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8' }}>{allMembers.length} members</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Member list ── */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
            {[
              { id: 'risk', label: `At-risk (${atRiskMembers.length})` },
              { id: 'all',  label: `All (${allMembers.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setMemberTab(t.id)} style={{
                padding: '6px 14px', fontSize: 12, fontWeight: memberTab === t.id ? 700 : 500,
                cursor: 'pointer', border: 'none', background: 'none',
                borderBottom: memberTab === t.id ? '2px solid var(--cyan)' : '2px solid transparent',
                color: memberTab === t.id ? 'var(--text1)' : 'var(--text3)',
                marginBottom: -1, transition: 'all 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          {list.length === 0 ? (
            <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>No members found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {list.slice(0, 3).map((m, i) => {
                const last = memberLastCheckIn?.[m.user_id];
                const days = last ? Math.floor((now - new Date(last)) / 86400000) : null;
                const isRisk = memberTab === 'risk' || (days !== null && days >= 10);
                const name = m.user_name || m.name || 'Member';
                return (
                  <div key={m.user_id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: isRisk ? 'rgba(239,68,68,0.12)' : 'rgba(14,165,233,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800,
                      color: isRisk ? '#f87171' : '#38bdf8',
                    }}>{initials(name)}</div>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: isRisk ? 'rgba(239,68,68,0.1)' : 'rgba(14,165,233,0.1)',
                      color: isRisk ? '#f87171' : '#38bdf8',
                      border: `1px solid ${isRisk ? 'rgba(239,68,68,0.2)' : 'rgba(14,165,233,0.2)'}`,
                    }}>{days !== null ? `${days}d ago` : isRisk ? 'At-risk' : 'Active'}</span>
                  </div>
                );
              })}
              {list.length > 3 && (
                <div style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ChevronRight style={{ width: 11, height: 11 }}/> +{list.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Send to ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Send to</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'atRisk', label: `At-risk · ${atRiskMembers.length}` },
              { id: 'all',    label: `All members · ${allMembers.length}` },
            ].map(opt => (
              <button key={opt.id} onClick={() => setTarget(opt.id)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${target === opt.id ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                background: target === opt.id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                color: target === opt.id ? 'var(--cyan)' : 'var(--text3)',
                transition: 'all 0.15s',
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* ── Message ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Message</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {[{ id: 'preset', label: 'Preset' }, { id: 'custom', label: 'Custom' }].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${mode === m.id ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
                background: mode === m.id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                color: mode === m.id ? 'var(--cyan)' : 'var(--text3)',
                transition: 'all 0.15s',
              }}>{m.label}</button>
            ))}
          </div>

          {mode === 'preset' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PRESET_MESSAGES.map(p => (
                <div key={p.id} onClick={() => setSelectedPreset(p.id)} style={{
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${selectedPreset === p.id ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  background: selectedPreset === p.id ? 'rgba(0,212,255,0.07)' : 'rgba(255,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: selectedPreset === p.id ? 'var(--cyan)' : 'var(--text1)' }}>{p.label}</span>
                  {selectedPreset === p.id && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', flexShrink: 0 }}/>
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
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 10, padding: '10px 12px', fontSize: 12, fontWeight: 500,
                color: 'var(--text1)', resize: 'none', outline: 'none',
                lineHeight: 1.6, fontFamily: "'Outfit', sans-serif",
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.35)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid var(--border)' }}>
        {sent ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 12, fontWeight: 700, color: '#34d399' }}>
            <Check style={{ width: 13, height: 13 }}/> Sent to {sent.count} member{sent.count !== 1 ? 's' : ''}
          </div>
        ) : (
          <button onClick={handleSend} disabled={!canSend} style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none',
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em', transition: 'all 0.2s',
            background: canSend ? 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(14,165,233,0.25))' : 'rgba(255,255,255,0.04)',
            color: canSend ? 'var(--cyan)' : 'var(--text3)',
            border: `1px solid ${canSend ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
            opacity: sending ? 0.7 : 1,
          }}
            onMouseEnter={e => { if (canSend) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(14,165,233,0.35))'; }}
            onMouseLeave={e => { if (canSend) e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(14,165,233,0.25))'; }}
          >
            <Send style={{ width: 13, height: 13 }}/>
            {sending ? 'Sending…' : canSend ? `Send to ${targetCount} member${targetCount !== 1 ? 's' : ''}` : 'Select a message'}
          </button>
        )}
      </div>
    </div>
  );
}
