import React, { useState } from 'react';
import { Send, Check, Users, AlertTriangle, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PRESET_MESSAGES = [
  { id: 'miss',      label: 'We miss you',    body: (g) => `Hey! We haven't seen you at ${g} in a while. Come back and keep your progress going — your gym family misses you.` },
  { id: 'offer',     label: 'Special offer',  body: (g) => `Good news from ${g}! Come in this week and bring a guest for free. We'd love to see you back.` },
  { id: 'challenge', label: 'New challenge',  body: (g) => `${g} has a fresh challenge waiting for you. Join in, compete with your gym family, and hit a new PB.` },
  { id: 'nudge',     label: 'Friendly nudge', body: (g) => `Just a friendly nudge from ${g} — it's been a while! Your spot's waiting whenever you're ready.` },
];

const styles = {
  // Matches the dashboard card style exactly
  panel: {
    width: '100%',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e2e8f0',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px 20px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#f1f5f9',
    letterSpacing: '-0.01em',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  body: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflowY: 'auto',
    maxHeight: 'calc(90vh - 80px)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  statCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '12px 14px',
  },
  statNum: {
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#475569',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 8,
  },
  // Member list tabs — matches the 7D/30D/90D toggle style in dashboard
  tabRow: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 3,
    gap: 2,
    marginBottom: 10,
  },
  tab: (active) => ({
    flex: 1,
    padding: '6px 8px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'center',
    border: 'none',
    transition: 'all 0.15s',
    background: active ? 'rgba(20,184,166,0.15)' : 'transparent',
    color: active ? '#2dd4bf' : '#64748b',
  }),
  memberList: {
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    transition: 'background 0.1s',
    cursor: 'default',
  },
  avatar: (isRisk) => ({
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: isRisk ? 'rgba(239,68,68,0.12)' : 'rgba(20,184,166,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 600,
    color: isRisk ? '#f87171' : '#2dd4bf',
    flexShrink: 0,
  }),
  memberName: {
    flex: 1,
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: 500,
  },
  badge: (isRisk) => ({
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 20,
    fontWeight: 500,
    background: isRisk ? 'rgba(239,68,68,0.1)' : 'rgba(20,184,166,0.1)',
    color: isRisk ? '#f87171' : '#2dd4bf',
  }),
  divider: {
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    margin: '0',
  },
  // Pill toggles — match the teal active style used in dashboard
  chipRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: (active) => ({
    padding: '7px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(20,184,166,0.5)' : 'rgba(255,255,255,0.08)'}`,
    background: active ? 'rgba(20,184,166,0.1)' : 'transparent',
    color: active ? '#2dd4bf' : '#64748b',
    transition: 'all 0.15s',
  }),
  presetCard: (active) => ({
    padding: '12px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(20,184,166,0.4)' : 'rgba(255,255,255,0.06)'}`,
    background: active ? 'rgba(20,184,166,0.06)' : 'rgba(255,255,255,0.02)',
    transition: 'all 0.15s',
  }),
  presetTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#f1f5f9',
    marginBottom: 4,
  },
  presetBody: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 1.55,
  },
  textarea: {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 13,
    color: '#f1f5f9',
    resize: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: 1.5,
    fontFamily: 'inherit',
  },
  footer: {
    padding: '14px 20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  sendBtn: (canSend, sending) => ({
    width: '100%',
    padding: '12px',
    borderRadius: 10,
    border: 'none',
    cursor: canSend ? 'pointer' : 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.2s',
    background: canSend ? 'linear-gradient(135deg, #0d9488, #14b8a6)' : 'rgba(255,255,255,0.04)',
    color: canSend ? '#fff' : '#334155',
    opacity: sending ? 0.7 : 1,
    letterSpacing: '-0.01em',
  }),
  sentConfirm: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px',
    borderRadius: 10,
    background: 'rgba(20,184,166,0.08)',
    border: '1px solid rgba(20,184,166,0.2)',
    fontSize: 13,
    fontWeight: 600,
    color: '#2dd4bf',
  },
  moreLink: {
    fontSize: 12,
    color: '#2dd4bf',
    fontWeight: 500,
    padding: '8px 12px',
    cursor: 'pointer',
    textAlign: 'center',
  },
};

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
  const [showAllRisk, setShowAllRisk] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);

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

  // Render the member list for the current tab
  const renderMemberList = () => {
    const isRiskTab = memberTab === 'risk';
    const list = isRiskTab ? atRiskMembers : allMembers;
    const LIMIT = 5;
    const showAll = isRiskTab ? showAllRisk : showAllMembers;
    const displayed = showAll ? list : list.slice(0, LIMIT);
    const extra = list.length - LIMIT;

    if (!list.length) {
      return (
        <div style={{ padding: '14px', textAlign: 'center', fontSize: 13, color: '#475569' }}>
          No members found
        </div>
      );
    }

    return (
      <>
        <div style={styles.memberList}>
          {displayed.map((m, i) => {
            const last = memberLastCheckIn?.[m.user_id];
            const days = last ? Math.floor((now - new Date(last)) / 86400000) : null;
            const isRisk = isRiskTab || (days !== null && days >= 10);
            const name = m.user_name || m.name || 'Member';

            return (
              <div
                key={m.user_id || i}
                style={{
                  ...styles.memberRow,
                  borderBottom: i < displayed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <div style={styles.avatar(isRisk)}>{initials(name)}</div>
                <span style={styles.memberName}>{name}</span>
                <span style={styles.badge(isRisk)}>
                  {days !== null ? `${days}d ago` : isRisk ? 'At-risk' : 'Active'}
                </span>
              </div>
            );
          })}
        </div>
        {!showAll && extra > 0 && (
          <div
            style={styles.moreLink}
            onClick={() => isRiskTab ? setShowAllRisk(true) : setShowAllMembers(true)}
          >
            +{extra} more members <ChevronRight style={{ width: 12, height: 12, verticalAlign: 'middle' }} />
          </div>
        )}
      </>
    );
  };

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.cardTitle}>Push Notifications</div>
          {atRiskMembers.length > 0 && (
            <div style={styles.cardSubtitle}>
              <AlertTriangle style={{ width: 11, height: 11, verticalAlign: 'middle', color: '#f59e0b', marginRight: 4 }} />
              {atRiskMembers.length} members inactive 14+ days
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>

        {/* Stats */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNum, color: '#f87171' }}>{atRiskMembers.length}</div>
            <div style={styles.statLabel}>At-risk</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNum, color: '#2dd4bf' }}>{allMembers.length}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>

        {/* Member List */}
        <div>
          <div style={styles.sectionLabel}>Members</div>
          <div style={styles.tabRow}>
            <button style={styles.tab(memberTab === 'risk')} onClick={() => setMemberTab('risk')}>
              At-risk ({atRiskMembers.length})
            </button>
            <button style={styles.tab(memberTab === 'all')} onClick={() => setMemberTab('all')}>
              All ({allMembers.length})
            </button>
          </div>
          {renderMemberList()}
        </div>

        <hr style={styles.divider} />

        {/* Send To */}
        <div>
          <div style={styles.sectionLabel}>Send to</div>
          <div style={styles.chipRow}>
            {[
              { id: 'atRisk', label: `At-risk (${atRiskMembers.length})` },
              { id: 'all',    label: `All members (${allMembers.length})` },
            ].map(opt => (
              <button key={opt.id} style={styles.chip(target === opt.id)} onClick={() => setTarget(opt.id)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <div style={styles.sectionLabel}>Message</div>
          <div style={{ ...styles.chipRow, marginBottom: 12 }}>
            {[
              { id: 'preset', label: 'Preset templates' },
              { id: 'custom', label: 'Write custom' },
            ].map(m => (
              <button key={m.id} style={styles.chip(mode === m.id)} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'preset' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRESET_MESSAGES.map(p => (
                <div key={p.id} style={styles.presetCard(selectedPreset === p.id)} onClick={() => setSelectedPreset(p.id)}>
                  <div style={styles.presetTitle}>{p.label}</div>
                  <div style={styles.presetBody}>{p.body(gymName)}</div>
                </div>
              ))}
            </div>
          ) : (
            <textarea
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
              placeholder="Write a personalised message to your members…"
              rows={4}
              style={styles.textarea}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        {sent ? (
          <div style={styles.sentConfirm}>
            <Check style={{ width: 15, height: 15 }} />
            Sent to {sent.count} member{sent.count !== 1 ? 's' : ''}!
          </div>
        ) : (
          <button onClick={handleSend} disabled={!canSend} style={styles.sendBtn(canSend, sending)}>
            {sending ? (
              'Sending…'
            ) : (
              <>
                <Send style={{ width: 14, height: 14 }} />
                {canSend ? `Send to ${targetCount} members` : 'Select a message to send'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}