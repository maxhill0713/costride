import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, User, Send, ChevronRight, CheckCircle, X, BadgeCheck } from 'lucide-react';

function CoachMessages({ currentUser }) {
  const [openThread, setOpenThread] = useState(null);
  const [replyText, setReplyText]   = useState('');
  const bottomRef = useRef(null);
  const qc = useQueryClient();

  const { data: received = [], isLoading } = useQuery({ queryKey: ['coachMessages', currentUser?.id], queryFn: () => base44.entities.Message.filter({ receiver_id: currentUser.id }, 'created_date', 200), enabled: !!currentUser, staleTime: 15 * 1000, refetchInterval: 15 * 1000 });
  const { data: sent = [] } = useQuery({ queryKey: ['coachMessagesSent', currentUser?.id], queryFn: () => base44.entities.Message.filter({ sender_id: currentUser.id }, 'created_date', 200), enabled: !!currentUser, staleTime: 15 * 1000, refetchInterval: 15 * 1000 });

  const sendReply = useMutation({
    mutationFn: content => base44.entities.Message.create({ sender_id: currentUser.id, sender_name: currentUser.full_name || currentUser.email, sender_avatar: currentUser.avatar_url || null, receiver_id: openThread, receiver_name: threads.find(t => t.sender_id === openThread)?.name || 'Coach', content, read: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coachMessages', currentUser?.id] }); qc.invalidateQueries({ queryKey: ['coachMessagesSent', currentUser?.id] }); qc.invalidateQueries({ queryKey: ['dashMessages'] }); setReplyText(''); },
  });

  const threads = useMemo(() => {
    const map = {};
    received.forEach(msg => { const otherId = msg.sender_id; if (!map[otherId]) map[otherId] = { sender_id: otherId, name: msg.sender_name || 'Coach', avatar: msg.sender_avatar || null, messages: [] }; map[otherId].messages.push(msg); });
    sent.forEach(msg => { const otherId = msg.receiver_id; if (map[otherId]) map[otherId].messages.push(msg); });
    Object.values(map).forEach(t => { const seen = new Set(); t.messages = t.messages.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; }); t.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)); });
    return Object.values(map).sort((a, b) => { const la = a.messages[a.messages.length - 1]?.created_date || 0; const lb = b.messages[b.messages.length - 1]?.created_date || 0; return new Date(lb) - new Date(la); });
  }, [received, sent]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [openThread, received, sent]);

  const activeThread = threads.find(t => t.sender_id === openThread);
  const fmtTime = (date) => { if (!date) return ''; const d = new Date(date); const now = new Date(); const diffDays = Math.floor((now - d) / 86400000); if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); if (diffDays === 1) return 'Yesterday'; if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' }); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); };

  if (activeThread) {
    const handleSend = () => { if (!replyText.trim()) return; sendReply.mutate(replyText.trim()); };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '72vh', background: 'linear-gradient(135deg, rgba(10,14,30,0.98) 0%, rgba(5,8,20,1) 100%)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(255,255,255,0.02)' }}>
          <button onClick={() => setOpenThread(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}>
            <ChevronRight style={{ width: 20, height: 20, transform: 'rotate(180deg)' }} />
          </button>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #3b82f6', boxShadow: '0 0 10px rgba(59,130,246,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: activeThread.avatar ? 'transparent' : 'rgba(59,130,246,0.15)', fontSize: 15, fontWeight: 800, color: '#3b82f6' }}>
              {activeThread.avatar ? <img src={activeThread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (activeThread.name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#10b981', border: '2px solid #080e18' }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{activeThread.name}</p>
            <p style={{ fontSize: 11, color: '#475569', margin: '1px 0 0' }}>Coach · Tap to reply</p>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeThread.messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser?.id;
            const prevMsg = activeThread.messages[i - 1];
            const showAvatar = !isMe && (i === 0 || prevMsg?.sender_id !== msg.sender_id);
            return (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
                {!isMe && (
                  <div style={{ width: 28, flexShrink: 0 }}>
                    {showAvatar && <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: '2px solid #3b82f6', background: activeThread.avatar ? 'transparent' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#3b82f6' }}>{activeThread.avatar ? <img src={activeThread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (activeThread.name || '?').charAt(0).toUpperCase()}</div>}
                  </div>
                )}
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {showAvatar && <span style={{ fontSize: 10, color: '#475569', fontWeight: 600, paddingLeft: 4 }}>{activeThread.name}</span>}
                  <div style={{ padding: '10px 14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMe ? '#3b82f6' : 'rgba(255,255,255,0.08)', border: isMe ? 'none' : '1px solid rgba(255,255,255,0.06)', fontSize: 14, color: '#e2e8f0', lineHeight: 1.5 }}>{msg.content}</div>
                  <span style={{ fontSize: 10, color: '#334155', paddingLeft: 4, paddingRight: 4 }}>{fmtTime(msg.created_date)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0, background: 'rgba(255,255,255,0.01)' }}>
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={`Reply to ${activeThread.name}…`} rows={1} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 96, overflowY: 'auto' }} onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          <button onClick={handleSend} disabled={!replyText.trim() || sendReply.isPending} style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: replyText.trim() ? '#3b82f6' : 'rgba(255,255,255,0.06)', border: 'none', cursor: replyText.trim() ? 'pointer' : 'default', transition: 'background 0.15s', flexShrink: 0, boxShadow: replyText.trim() ? '0 0 12px rgba(59,130,246,0.4)' : 'none' }}>
            <Send style={{ width: 16, height: 16, color: replyText.trim() ? '#fff' : '#334155' }} />
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) return (
    <div className="space-y-2">
      {[1,2,3].map(i => <div key={i} style={{ height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  );

  if (threads.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <User style={{ width: 26, height: 26, color: '#a78bfa' }} />
      </div>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>No messages yet</p>
      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, maxWidth: 240, margin: 0 }}>When a coach or gym owner messages you, it will appear here.</p>
    </div>
  );

  return (
    <div style={{ borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(10,14,30,0.97) 0%, rgba(5,8,20,1) 100%)' }}>
      {threads.map((thread, idx) => {
        const lastMsg = thread.messages[thread.messages.length - 1];
        return (
          <button key={thread.sender_id} onClick={() => setOpenThread(thread.sender_id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'inherit', textAlign: 'left', borderBottom: idx < threads.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.12s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid #3b82f6', boxShadow: '0 0 12px rgba(59,130,246,0.55)', background: thread.avatar ? 'transparent' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#3b82f6' }}>
                {thread.avatar ? <img src={thread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (thread.name || '?').charAt(0).toUpperCase()}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{thread.name}</span>
                <span style={{ fontSize: 11, color: '#334155', flexShrink: 0, marginLeft: 8 }}>{fmtTime(lastMsg?.created_date)}</span>
              </div>
              <span style={{ fontSize: 13, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{lastMsg?.content || ''}</span>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: '#2d3f55', flexShrink: 0 }} />
          </button>
        );
      })}
    </div>
  );
}

function CoachInviteBanner({ invite, onAccept, onDecline, accepting, declining }) {
  const iniLocal = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(30,58,138,0.45) 0%, rgba(16,19,40,0.95) 100%)', border: '1px solid rgba(59,130,246,0.35)', borderBottom: '3px solid rgba(29,78,216,0.55)', borderRadius: 18, padding: '16px 16px', boxShadow: '0 2px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: invite.coach_avatar ? 'transparent' : 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 0 14px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#3b82f6' }}>
          {invite.coach_avatar ? <img src={invite.coach_avatar} alt={invite.coach_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniLocal(invite.coach_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', marginBottom: 3, letterSpacing: '-0.01em' }}>{invite.coach_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>Coach</span>
            <BadgeCheck style={{ width: 13, height: 13, color: '#22c55e' }} />
          </div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
            Wants you as a personal training client{invite.coach_gym_name ? ` · ${invite.coach_gym_name}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onAccept} disabled={accepting || declining} style={{ width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #22c55e, #16a34a, #15803d)', border: '1px solid transparent', borderBottom: '3px solid #14532d', boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(34,197,94,0.3)', cursor: 'pointer', transition: 'all 0.1s', opacity: accepting || declining ? 0.6 : 1 }}>
            <CheckCircle style={{ width: 18, height: 18, color: '#fff' }} />
          </button>
          <button onClick={onDecline} disabled={accepting || declining} style={{ width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom, #ef4444, #dc2626, #b91c1c)', border: '1px solid transparent', borderBottom: '3px solid #7f1d1d', boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(239,68,68,0.3)', cursor: 'pointer', transition: 'all 0.1s', opacity: accepting || declining ? 0.6 : 1 }}>
            <X style={{ width: 18, height: 18, color: '#fff' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MyCoachBox({ invite }) {
  const iniLocal = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(10,14,30,0.97) 0%, rgba(5,8,20,1) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '18px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: invite.coach_avatar ? 'transparent' : 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.5)', boxShadow: '0 0 12px rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#3b82f6' }}>
          {invite.coach_avatar ? <img src={invite.coach_avatar} alt={invite.coach_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : iniLocal(invite.coach_name)}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{invite.coach_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa' }}>Coach</span>
            <BadgeCheck style={{ width: 13, height: 13, color: '#22c55e' }} />
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />
      <div style={{ fontSize: 12, color: '#334155', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
        Your coach will add workouts &amp; programmes here soon.
      </div>
    </div>
  );
}

export default function TrainerTab({ currentUser }) {
  const [activeSection, setActiveSection] = useState('coaches');
  const queryClient = useQueryClient();

  const btnBase = "px-2 py-1.5 rounded-2xl font-bold text-sm transition-all duration-100 flex flex-col items-center gap-1 backdrop-blur-md border active:shadow-none active:translate-y-[5px] active:scale-95 transform-gpu flex-1";
  const btnInactive = "bg-slate-900/80 text-slate-400 border-slate-500/50 shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]";

  const { data: me } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });
  const user = me || currentUser;

  const { data: pendingInvites = [] } = useQuery({ queryKey: ['coachInvitesPending', user?.id], queryFn: () => base44.entities.CoachInvite.filter({ member_id: user.id, status: 'pending' }, '-created_date', 20), enabled: !!user?.id, staleTime: 0, refetchInterval: 15 * 1000 });
  const { data: acceptedInvites = [] } = useQuery({ queryKey: ['coachInvitesAccepted', user?.id], queryFn: () => base44.entities.CoachInvite.filter({ member_id: user.id, status: 'accepted' }, '-created_date', 10), enabled: !!user?.id, staleTime: 0, refetchInterval: 30 * 1000 });

  const [processingId, setProcessingId] = useState(null);

  const handleAccept = async (invite) => {
    setProcessingId(invite.id);
    await base44.entities.CoachInvite.update(invite.id, { status: 'accepted' });
    queryClient.invalidateQueries({ queryKey: ['coachInvitesPending'] });
    queryClient.invalidateQueries({ queryKey: ['coachInvitesAccepted'] });
    setProcessingId(null);
  };

  const handleDecline = async (invite) => {
    setProcessingId(invite.id);
    await base44.entities.CoachInvite.update(invite.id, { status: 'declined' });
    queryClient.invalidateQueries({ queryKey: ['coachInvitesPending'] });
    setProcessingId(null);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setActiveSection('classes')} className={`${btnBase} ${activeSection === 'classes' ? 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-transparent shadow-[0_5px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)]' : btnInactive}`}>
          <CalendarDays className="w-4 h-4" />Classes
        </button>
        <button onClick={() => setActiveSection('coaches')} className={`${btnBase} ${activeSection === 'coaches' ? 'bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 text-white border-transparent shadow-[0_5px_0_0_#5b21b6,0_8px_20px_rgba(120,40,220,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)]' : btnInactive}`}>
          <User className="w-4 h-4" />Coaches
        </button>
      </div>

      {activeSection === 'classes' && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <p style={{ fontSize: 14, fontWeight: 500, color: '#475569', lineHeight: 1.6, maxWidth: 260, margin: 0 }}>
            Join classes at your gym to chat with other members and stay connected with your training community.
          </p>
        </div>
      )}

      {activeSection === 'coaches' && (
        <div className="space-y-4">
          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Coach Requests</p>
              {pendingInvites.map(invite => (
                <CoachInviteBanner key={invite.id} invite={invite} accepting={processingId === invite.id} declining={processingId === invite.id} onAccept={() => handleAccept(invite)} onDecline={() => handleDecline(invite)} />
              ))}
            </div>
          )}
          {acceptedInvites.length > 0 && (
            <div className="space-y-3">
              <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Personal Trainer</p>
              {acceptedInvites.map(invite => (
                <MyCoachBox key={invite.id} invite={invite} />
              ))}
            </div>
          )}
          <CoachMessages currentUser={user} />
        </div>
      )}
    </div>
  );
}