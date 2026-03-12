import React, { useState } from 'react';
import { Bell, AlertTriangle, Users, Send, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRESET_MESSAGES = [
  { id: 'miss', emoji: '💪', label: 'We miss you!', body: (gymName) => `Hey! We haven't seen you at ${gymName} in a while. Come back and keep your streak going!` },
  { id: 'offer', emoji: '🎁', label: 'Special offer', body: (gymName) => `Great news from ${gymName}! Come in this week for a complimentary guest pass. We'd love to see you!` },
  { id: 'challenge', emoji: '🏆', label: 'New challenge', body: (gymName) => `${gymName} has a new challenge waiting for you. Join in and compete with your gym family!` },
  { id: 'nudge', emoji: '🔔', label: 'Friendly nudge', body: (gymName) => `Just a friendly nudge from ${gymName} — it's been a while! Your gym family misses you.` },
];

export default function PushNotificationPanel({ atRiskMembers = [], allMembers = [], selectedGym, memberLastCheckIn }) {
  const [mode, setMode] = useState('preset'); // 'preset' | 'custom'
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [target, setTarget] = useState('atRisk'); // 'atRisk' | 'all'
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const now = new Date();
  const gymName = selectedGym?.name || 'your gym';
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
    await base44.functions.invoke('sendPushNotification', {
      gym_id: selectedGym?.id,
      gym_name: gymName,
      target,
      message: message.trim(),
      member_ids: memberIds,
    });
    setSent({ count: memberIds.length });
    setSending(false);
    setSelectedPreset(null);
    setCustomMsg('');
    setTimeout(() => setSent(null), 5000);
  };

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      background: 'linear-gradient(135deg,rgba(239,68,68,0.06) 0%,rgba(245,158,11,0.04) 100%)',
      border: '1px solid rgba(239,68,68,0.2)',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bell style={{ width: 15, height: 15, color: '#f87171' }}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Push Notifications</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
            {atRiskMembers.length > 0
              ? <span style={{ color: '#f87171' }}>{atRiskMembers.length} at-risk members</span>
              : <span style={{ color: '#34d399' }}>All members active</span>
            }
          </div>
        </div>
        {atRiskMembers.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 800, background: '#ef4444', color: '#fff', borderRadius: 99, padding: '2px 7px', flexShrink: 0 }}>
            {atRiskMembers.length}
          </span>
        )}
        {expanded
          ? <ChevronUp style={{ width: 14, height: 14, color: '#475569', flexShrink: 0 }}/>
          : <ChevronDown style={{ width: 14, height: 14, color: '#475569', flexShrink: 0 }}/>
        }
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* At-risk member list */}
          {atRiskMembers.length > 0 && (
            <div style={{ borderRadius: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle style={{ width: 11, height: 11, color: '#f59e0b' }}/>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>At-Risk Members ({atRiskMembers.length})</span>
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto' }}>
                {atRiskMembers.slice(0, 8).map((m, i) => {
                  const last = memberLastCheckIn?.[m.user_id];
                  const days = last ? Math.floor((now - new Date(last)) / 86400000) : null;
                  return (
                    <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: i < Math.min(atRiskMembers.length, 8) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#ef4444,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {(m.user_name || m.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.user_name || m.name || 'Member'}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: days >= 21 ? '#f87171' : '#fbbf24', flexShrink: 0 }}>
                        {days !== null ? `${days}d ago` : 'Never'}
                      </span>
                    </div>
                  );
                })}
                {atRiskMembers.length > 8 && (
                  <div style={{ padding: '6px 10px', fontSize: 10, color: '#475569', fontWeight: 600 }}>
                    +{atRiskMembers.length - 8} more members
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Target selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'atRisk', label: `At-Risk (${atRiskMembers.length})`, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
              { id: 'all',    label: `All (${allMembers.length})`,         color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.3)' },
            ].map(opt => (
              <button key={opt.id} onClick={() => setTarget(opt.id)}
                style={{ flex: 1, padding: '7px 4px', borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${target === opt.id ? opt.border : 'rgba(255,255,255,0.08)'}`, background: target === opt.id ? opt.bg : 'rgba(255,255,255,0.04)', color: target === opt.id ? opt.color : '#475569', transition: 'all 0.15s' }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 5, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 3 }}>
            {[
              { id: 'preset', label: '⚡ Preset', },
              { id: 'custom', label: '✏️ Custom', },
            ].map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{ flex: 1, padding: '6px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: mode === m.id ? 'rgba(255,255,255,0.1)' : 'transparent', color: mode === m.id ? '#f1f5f9' : '#475569', transition: 'all 0.15s' }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Preset messages */}
          {mode === 'preset' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PRESET_MESSAGES.map(p => (
                <button key={p.id} onClick={() => setSelectedPreset(selectedPreset === p.id ? null : p.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 10px', borderRadius: 10, border: `1px solid ${selectedPreset === p.id ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.07)'}`, background: selectedPreset === p.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{p.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: selectedPreset === p.id ? '#a78bfa' : '#94a3b8', marginBottom: 2 }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {p.body(gymName)}
                    </div>
                  </div>
                  {selectedPreset === p.id && (
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check style={{ width: 9, height: 9, color: '#fff' }}/>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Custom message */}
          {mode === 'custom' && (
            <div>
              <textarea
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                placeholder={`Write a personalised message to your members…`}
                rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 11px', fontSize: 12, color: '#e2e8f0', resize: 'none', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
              />
              <div style={{ fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'right' }}>{customMsg.length}/160</div>
            </div>
          )}

          {/* Send button / success */}
          {sent ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Check style={{ width: 14, height: 14, color: '#10b981' }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Sent to {sent.count} member{sent.count !== 1 ? 's' : ''}!</span>
            </div>
          ) : (
            <button onClick={handleSend} disabled={!canSend}
              style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', cursor: canSend ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12, fontWeight: 800, transition: 'all 0.15s',
                background: canSend ? 'linear-gradient(135deg,rgba(239,68,68,0.9),rgba(245,158,11,0.85))' : 'rgba(255,255,255,0.05)',
                color: canSend ? '#fff' : '#475569',
                opacity: sending ? 0.7 : 1,
              }}>
              {sending ? (
                <><span style={{ fontSize: 11 }}>Sending…</span></>
              ) : (
                <><Send style={{ width: 13, height: 13 }}/> Send to {targetCount} member{targetCount !== 1 ? 's' : ''}</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}