import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Send, Search, MessageCircle, ChevronLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const D = {
  bgBase:    '#080e18',
  bgSurface: '#0c1422',
  bgSidebar: '#070c16',
  surfaceEl: '#101929',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.12)',
  blue:      '#3b82f6',
  blueDim:   'rgba(59,130,246,0.10)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569', t4: '#2d3f55',
};

function Avatar({ name, src, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: src ? 'transparent' : 'rgba(255,255,255,0.08)',
      border: `1.5px solid ${D.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: D.t2, overflow: 'hidden',
    }}>
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name || '?').charAt(0).toUpperCase()
      }
    </div>
  );
}

export default function MemberChatPanel({ open, onClose, allMemberships = [], currentUser, avatarMap = {} }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [search, setSearch]     = useState('');
  const [text, setText]         = useState('');
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  // Fetch messages for the selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['dashMessages', currentUser?.id, selectedMember?.user_id],
    queryFn: () => base44.entities.Message.filter({
      $or: [
        { sender_id: currentUser.id, receiver_id: selectedMember.user_id },
        { sender_id: selectedMember.user_id, receiver_id: currentUser.id },
      ]
    }, 'created_date', 100),
    enabled: !!currentUser && !!selectedMember,
    refetchInterval: 5000,
  });

  const sendM = useMutation({
    mutationFn: content => base44.entities.Message.create({
      sender_id:     currentUser.id,
      sender_name:   currentUser.full_name || currentUser.email,
      sender_avatar: currentUser.avatar_url || currentUser.logo_url || null,
      receiver_id:   selectedMember.user_id,
      receiver_name: selectedMember.user_name,
      content,
      read: false,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashMessages', currentUser?.id, selectedMember?.user_id] });
      setText('');
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter members by search
  const filtered = useMemo(() =>
    allMemberships.filter(m =>
      !search || (m.user_name || '').toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50)
  , [allMemberships, search]);

  if (!open) return null;

  const handleSend = () => {
    if (!text.trim() || !selectedMember) return;
    sendM.mutate(text.trim());
  };

  return (
    <div style={{
      position: 'fixed', top: 60, right: 12, bottom: 12, zIndex: 200,
      width: 380, display: 'flex', flexDirection: 'column',
      background: D.bgSurface, border: `1px solid ${D.borderHi}`,
      borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {selectedMember && (
          <button onClick={() => setSelectedMember(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: D.t3, display: 'flex' }}>
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>
        )}
        <MessageCircle style={{ width: 15, height: 15, color: D.blue }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: D.t1 }}>
            {selectedMember ? selectedMember.user_name : 'Messages'}
          </div>
          {!selectedMember && (
            <div style={{ fontSize: 10, color: D.t3 }}>{allMemberships.length} members</div>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: D.t3, display: 'flex', borderRadius: 6 }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {!selectedMember ? (
        /* Member list */
        <>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}` }}>
              <Search style={{ width: 12, height: 12, color: D.t3, flexShrink: 0 }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search members…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: D.t1, fontSize: 12, fontFamily: 'inherit' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: D.t3, fontSize: 12 }}>No members found</div>
            ) : filtered.map((m, i) => (
              <button key={m.user_id || i}
                onClick={() => setSelectedMember(m)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', border: 'none', background: 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.1s',
                  borderBottom: `1px solid rgba(255,255,255,0.04)`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Avatar name={m.user_name} src={avatarMap[m.user_id]} size={34} />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: D.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                  <div style={{ fontSize: 10, color: D.t3, marginTop: 1 }}>
                    {m.daysSince != null ? (m.daysSince === 0 ? 'Checked in today' : `${m.daysSince}d ago`) : 'No check-ins'}
                  </div>
                </div>
                <MessageCircle style={{ width: 13, height: 13, color: D.t4 }} />
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Conversation view */
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MessageCircle style={{ width: 28, height: 28, color: D.t4 }} />
                <div style={{ fontSize: 12, color: D.t3, textAlign: 'center' }}>Start a conversation with {selectedMember.user_name}</div>
              </div>
            ) : messages.map((msg, i) => {
              const isMe = msg.sender_id === currentUser?.id;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '78%', padding: '8px 12px', borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: isMe ? D.blue : 'rgba(255,255,255,0.07)',
                    fontSize: 12, color: isMe ? '#fff' : D.t1, lineHeight: 1.5,
                  }}>
                    {msg.content}
                    <div style={{ fontSize: 9, color: isMe ? 'rgba(255,255,255,0.6)' : D.t3, marginTop: 3, textAlign: 'right' }}>
                      {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${D.border}`, display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`Message ${selectedMember.user_name}…`}
              rows={1}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}`,
                borderRadius: 9, padding: '8px 11px', color: D.t1, fontSize: 12,
                resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                maxHeight: 96, overflowY: 'auto',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.4)'}
              onBlur={e => e.target.style.borderColor = D.border}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sendM.isPending}
              style={{
                width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: text.trim() ? D.blue : 'rgba(255,255,255,0.06)',
                border: 'none', cursor: text.trim() ? 'pointer' : 'default',
                transition: 'background 0.15s', flexShrink: 0,
              }}
            >
              <Send style={{ width: 13, height: 13, color: text.trim() ? '#fff' : D.t3 }} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}