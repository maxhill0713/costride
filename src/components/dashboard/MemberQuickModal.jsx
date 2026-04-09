import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Send, Activity, Clock, MessageCircle, TrendingUp, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

function Avatar({ name = '', src = null, size = 44 }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const hue = (name.charCodeAt(0) || 72) % 360;
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},38%,16%)`, border: `2px solid hsl(${hue},38%,26%)`,
      color: `hsl(${hue},60%,65%)`, fontSize: size * 0.35, fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{initials}</div>
  );
}

export default function MemberQuickModal({ member, onClose, checkIns = [], avatarMap = {} }) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setSent(false);
    setMessage('');
  }, [member?.user_id]);

  const sendMutation = useMutation({
    mutationFn: (text) => base44.entities.Message.create({
      sender_id: 'gym_owner',
      sender_name: 'Gym Owner',
      receiver_id: member.user_id,
      receiver_name: member.user_name || 'Member',
      content: text,
    }),
    onSuccess: () => { setSent(true); setMessage(''); },
  });

  if (!member) return null;

  const memberCheckIns = checkIns
    .filter(c => c.user_id === member.user_id)
    .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));

  const lastCI = memberCheckIns[0];
  const daysSince = lastCI ? differenceInDays(new Date(), new Date(lastCI.check_in_date)) : null;
  const totalCheckIns = memberCheckIns.length;
  const last30 = memberCheckIns.filter(c => differenceInDays(new Date(), new Date(c.check_in_date)) <= 30).length;

  const statusColor = daysSince === null ? '#4b5578' : daysSince <= 3 ? '#10b981' : daysSince <= 7 ? '#f59e0b' : '#ef4444';
  const statusLabel = daysSince === null ? 'Never checked in' : daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, backdropFilter: 'blur(4px)' }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 9999, width: 420, maxWidth: 'calc(100vw - 32px)',
        background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={member.user_name || 'M'} src={avatarMap[member.user_id]} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#eef2ff', lineHeight: 1.2 }}>{member.user_name || 'Member'}</div>
            {member.user_email && <div style={{ fontSize: 11.5, color: '#4b5578', marginTop: 2 }}>{member.user_email}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={13} color="#4b5578" />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { Icon: Activity,   label: 'Total Check-ins', value: totalCheckIns },
            { Icon: TrendingUp, label: 'Last 30 Days',    value: last30        },
            { Icon: Calendar,   label: 'Member Since',    value: member.join_date ? format(new Date(member.join_date), 'MMM yy') : '—' },
          ].map(({ Icon, label, value }, i) => (
            <div key={i} style={{ padding: '14px 0', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <Icon size={12} color="#3b82f6" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#eef2ff', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 9.5, color: '#4b5578', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Recent check-ins */}
        <div style={{ padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
            <Clock size={11} color="#4b5578" />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#4b5578', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Check-ins</span>
          </div>
          {memberCheckIns.length === 0 ? (
            <div style={{ fontSize: 12, color: '#2d3f55', textAlign: 'center', padding: '8px 0' }}>No check-ins yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {memberCheckIns.slice(0, 5).map((ci, i) => {
                const d = differenceInDays(new Date(), new Date(ci.check_in_date));
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: 12, color: '#8b95b3' }}>{format(new Date(ci.check_in_date), 'EEE, MMM d')}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: d === 0 ? '#10b981' : '#4b5578' }}>
                      {d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d}d ago`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Send message */}
        <div style={{ padding: '13px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
            <MessageCircle size={11} color="#4b5578" />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#4b5578', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Send Message</span>
          </div>
          {sent ? (
            <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: '#10b981', textAlign: 'center' }}>
              ✓ Message sent!
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 7 }}>
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && message.trim()) sendMutation.mutate(message.trim()); }}
                placeholder={`Message ${member.user_name?.split(' ')[0] || 'member'}...`}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  color: '#eef2ff', fontSize: 12.5, outline: 'none',
                }}
              />
              <button
                onClick={() => { if (message.trim()) sendMutation.mutate(message.trim()); }}
                disabled={!message.trim() || sendMutation.isPending}
                style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: message.trim() ? '#3b82f6' : 'rgba(59,130,246,0.15)',
                  border: 'none', cursor: message.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                <Send size={13} color={message.trim() ? '#fff' : '#3b82f6'} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}