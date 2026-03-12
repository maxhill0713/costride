import React, { useState } from 'react';
import { Send, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRESET_MESSAGES = [
  { id: 'miss', label: 'We miss you', body: (gymName) => `Hey! We haven't seen you at ${gymName} in a while. Come back and keep your progress going — your gym family misses you.` },
  { id: 'offer', label: 'Special offer', body: (gymName) => `Good news from ${gymName}! Come in this week and bring a guest for free. We'd love to see you back.` },
  { id: 'challenge', label: 'New challenge', body: (gymName) => `${gymName} has a fresh challenge waiting for you. Join in, compete with your gym family, and hit a new PB.` },
  { id: 'nudge', label: 'Friendly nudge', body: (gymName) => `Just a friendly nudge from ${gymName} — it's been a while! Your spot's waiting whenever you're ready.` },
];

export default function PushNotificationPanel({ atRiskMembers = [], allMembers = [], selectedGym, memberLastCheckIn }) {
  const [mode, setMode] = useState('preset'); // 'preset' | 'custom'
  const [selectedPreset, setSelectedPreset] = useState('miss');
  const [customMsg, setCustomMsg] = useState('');
  const [target, setTarget] = useState('atRisk'); // 'atRisk' | 'all'
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);

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
      console.error("Failed to send notification:", error);
    } finally {
      setSending(false);
      setTimeout(() => setSent(null), 5000);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 400,
      borderRadius: 16,
      background: '#13161f', // Deep dark background
      border: '1px solid rgba(255,255,255,0.05)',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: '90vh',
    }}>
      <div style={{ padding: '24px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header Section */}
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>Push notifications</h2>
          {atRiskMembers.length > 0 && (
            <p style={{ margin: '6px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
              {atRiskMembers.length} members haven't checked in for 10+ days
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>{atRiskMembers.length}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>At-risk members</div>
          </div>
          <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>{allMembers.length}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Total active</div>
          </div>
        </div>

        {/* At-Risk Members List */}
        {atRiskMembers.length > 0 && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>At-Risk Members</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Inactive members requiring re-engagement</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {atRiskMembers.slice(0, 6).map((m, i) => {
                const last = memberLastCheckIn?.[m.user_id];
                const days = last ? Math.floor((now - new Date(last)) / 86400000) : (14 + i); // Fallback for UI mockup purposes
                const name = m.user_name || m.name || 'Member';
                const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#e2e8f0', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{name}</span>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{days}d ago</span>
                  </div>
                );
              })}
              {atRiskMembers.length > 6 && (
                <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 500, marginTop: 8, cursor: 'pointer' }}>
                  +{atRiskMembers.length - 6} more members
                </div>
              )}
            </div>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '0' }} />

        {/* Controls: Target & Mode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Target Toggle */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Send To</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'atRisk', label: `At-risk (${atRiskMembers.length})` },
                { id: 'all', label: `All members (${allMembers.length})` },
              ].map(opt => (
                <button key={opt.id} onClick={() => setTarget(opt.id)}
                  style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid',
                    borderColor: target === opt.id ? '#6366f1' : 'rgba(255,255,255,0.1)', 
                    background: target === opt.id ? 'rgba(99,102,241,0.1)' : 'transparent', 
                    color: target === opt.id ? '#818cf8' : '#cbd5e1', 
                    transition: 'all 0.2s' 
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Toggle */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Message</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'preset', label: 'Preset templates' },
                { id: 'custom', label: 'Write custom' },
              ].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid',
                    borderColor: mode === m.id ? '#6366f1' : 'rgba(255,255,255,0.1)', 
                    background: mode === m.id ? 'rgba(99,102,241,0.1)' : 'transparent', 
                    color: mode === m.id ? '#818cf8' : '#cbd5e1', 
                    transition: 'all 0.2s' 
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message Input Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'preset' ? (
            PRESET_MESSAGES.map(p => (
              <div key={p.id} onClick={() => setSelectedPreset(p.id)}
                style={{ padding: '14px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
                  borderColor: selectedPreset === p.id ? '#6366f1' : 'rgba(255,255,255,0.05)', 
                  background: selectedPreset === p.id ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)' 
                }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>{p.label}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{p.body(gymName)}</div>
              </div>
            ))
          ) : (
            <div>
              <textarea
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                placeholder="Write a personalised message to your members…"
                rows={4}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px', fontSize: 13, color: '#f8fafc', resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer / Send Action */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#13161f' }}>
        {sent ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <Check style={{ width: 16, height: 16, color: '#10b981' }}/>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#34d399' }}>Sent to {sent.count} member{sent.count !== 1 ? 's' : ''}!</span>
          </div>
        ) : (
          <button onClick={handleSend} disabled={!canSend}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: canSend ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              background: canSend ? '#6366f1' : 'rgba(255,255,255,0.05)',
              color: canSend ? '#ffffff' : '#475569',
              opacity: sending ? 0.7 : 1,
            }}>
            {sending ? 'Sending…' : `Send to ${targetCount} members`}
          </button>
        )}
      </div>
    </div>
  );
}