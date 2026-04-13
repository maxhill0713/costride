import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, CheckCircle, X, BadgeCheck,
  Paperclip, Camera, Image, Film, FileText, Play, Download, Send,
} from 'lucide-react';

/* ─── helpers ─── */
const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const fmtTime = (date) => {
  if (!date) return '';
  const d = new Date(date); const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/* ─── MediaBubble ─── */
function MediaBubble({ url, type, name, isMe }) {
  const [playing, setPlaying] = useState(false);
  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: 2 }}>
        <img src={url} alt="" style={{ maxWidth: 200, maxHeight: 220, borderRadius: 12, objectFit: 'cover', display: 'block', border: '1px solid rgba(255,255,255,0.08)' }} />
      </a>
    );
  }
  if (type === 'video') {
    return (
      <div style={{ position: 'relative', maxWidth: 220, borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 2 }}>
        <video src={url} style={{ width: '100%', maxHeight: 200, display: 'block', objectFit: 'cover' }} controls={playing} onClick={() => setPlaying(true)} />
        {!playing && (
          <div onClick={() => setPlaying(true)} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play style={{ width: 18, height: 18, color: '#111', marginLeft: 2 }} />
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', marginBottom: 2, maxWidth: 220 }}>
      <FileText style={{ width: 16, height: 16, color: isMe ? '#fff' : '#94a3b8', flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: isMe ? '#fff' : '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'File'}</span>
      <Download style={{ width: 12, height: 12, color: isMe ? 'rgba(255,255,255,0.6)' : '#475569', flexShrink: 0 }} />
    </a>
  );
}

/* ─── AttachMenu ─── */
function AttachMenu({ onPickFile, onPickCamera, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-attach-menu]')) onClose(); };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [onClose]);

  const items = [
    { icon: Image,    label: 'Photo / Video', action: () => { onPickFile('image/*,video/*'); onClose(); } },
    { icon: Camera,   label: 'Camera',        action: () => { onPickCamera(); onClose(); } },
    { icon: FileText, label: 'File',          action: () => { onPickFile('*/*'); onClose(); } },
  ];

  return (
    <div data-attach-menu style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 8, zIndex: 20, background: 'linear-gradient(160deg, #141b2e 0%, #0b0f1e 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 6, display: 'flex', flexDirection: 'column', gap: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: 160 }}>
      {items.map(({ icon: Icon, label, action }) => (
        <button key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#cbd5e1', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 14, height: 14, color: '#818cf8' }} />
          </div>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── MediaPreviewStrip ─── */
function MediaPreviewStrip({ previews, onRemove }) {
  if (!previews.length) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 12px 0', flexWrap: 'nowrap', overflowX: 'auto' }}>
      {previews.map((p, i) => (
        <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
          {p.type.startsWith('image/') ? (
            <img src={p.objectUrl} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(99,102,241,0.4)' }} />
          ) : p.type.startsWith('video/') ? (
            <div style={{ width: 60, height: 60, borderRadius: 10, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.4)' }}>
              <Film style={{ width: 20, height: 20, color: '#818cf8' }} />
            </div>
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, border: '1px solid rgba(99,102,241,0.4)', padding: 4 }}>
              <FileText style={{ width: 18, height: 18, color: '#818cf8' }} />
              <span style={{ fontSize: 9, color: '#64748b', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 52 }}>{p.name}</span>
            </div>
          )}
          <button onClick={() => onRemove(i)} style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <X style={{ width: 10, height: 10, color: '#94a3b8' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── ChatPage — full-screen WhatsApp/Instagram style ─── */
function ChatPage({ thread, currentUser, onBack }) {
  const [replyText, setReplyText] = useState('');
  const [previews, setPreviews]   = useState([]);
  const [showAttach, setShowAttach] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);
  const fileAcceptRef = useRef('image/*,video/*');
  const qc = useQueryClient();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'instant' }); }, [thread?.messages?.length]);

  const handlePickFile = (accept) => {
    fileAcceptRef.current = accept;
    if (fileInputRef.current) { fileInputRef.current.accept = accept; fileInputRef.current.removeAttribute('capture'); fileInputRef.current.click(); }
  };
  const handlePickCamera = () => {
    fileAcceptRef.current = 'image/*';
    if (fileInputRef.current) { fileInputRef.current.accept = 'image/*'; fileInputRef.current.setAttribute('capture', 'environment'); fileInputRef.current.click(); }
  };
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPreviews(prev => [...prev, ...files.map(file => ({ file, name: file.name, type: file.type, objectUrl: URL.createObjectURL(file) }))]);
    e.target.value = '';
  };
  const removePreview = useCallback((index) => {
    setPreviews(prev => { URL.revokeObjectURL(prev[index].objectUrl); return prev.filter((_, i) => i !== index); });
  }, []);
  useEffect(() => { return () => { previews.forEach(p => URL.revokeObjectURL(p.objectUrl)); }; }, []);

  const sendReply = useMutation({
    mutationFn: async ({ content, mediaUrl, mediaType, mediaName }) => {
      return base44.entities.Message.create({ sender_id: currentUser.id, sender_name: currentUser.full_name || currentUser.email, sender_avatar: currentUser.avatar_url || null, receiver_id: thread.sender_id, receiver_name: thread.name, content: content || '', media_url: mediaUrl || null, media_type: mediaType || null, media_name: mediaName || null, read: false });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coachMessages', currentUser?.id] });
      qc.invalidateQueries({ queryKey: ['coachMessagesSent', currentUser?.id] });
      qc.invalidateQueries({ queryKey: ['dashMessages'] });
      setReplyText(''); setPreviews([]);
    },
  });

  const handleSend = async () => {
    if (uploading || sendReply.isPending) return;
    const hasText = replyText.trim().length > 0;
    const hasMedia = previews.length > 0;
    if (!hasText && !hasMedia) return;
    setUploading(true);
    try {
      if (hasMedia) {
        for (let i = 0; i < previews.length; i++) {
          const p = previews[i]; const isFirst = i === 0;
          let mediaUrl = null; let mediaType = 'file';
          try { const result = await base44.integrations.Core.UploadFile({ file: p.file }); mediaUrl = result.file_url; } catch { mediaUrl = p.objectUrl; }
          if (p.type.startsWith('image/')) mediaType = 'image';
          else if (p.type.startsWith('video/')) mediaType = 'video';
          await sendReply.mutateAsync({ content: isFirst && hasText ? replyText.trim() : '', mediaUrl, mediaType, mediaName: p.name });
        }
      } else { await sendReply.mutateAsync({ content: replyText.trim() }); }
    } finally { setUploading(false); }
  };

  const canSend = (replyText.trim().length > 0 || previews.length > 0) && !uploading && !sendReply.isPending;
  const messages = thread?.messages || [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)',
      display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(8,12,28,0.85)',
        backdropFilter: 'blur(16px)',
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#94a3b8', flexShrink: 0 }}>
          <ChevronLeft style={{ width: 24, height: 24 }} />
        </button>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: thread?.avatar ? 'transparent' : 'rgba(99,102,241,0.15)', border: '2px solid rgba(99,102,241,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#818cf8' }}>
            {thread?.avatar ? <img src={thread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(thread?.name)}
          </div>
          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#10b981', border: '2px solid #02040a', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
        </div>
        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>{thread?.name}</p>
          <p style={{ fontSize: 11, color: '#22c55e', margin: '1px 0 0', fontWeight: 600 }}>Online · Coach</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 0, WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Send style={{ width: 22, height: 22, color: '#6366f1' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', margin: '0 0 4px' }}>Start the conversation</p>
              <p style={{ fontSize: 12, color: '#475569' }}>Send a message to your coach</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser?.id;
            const prev = messages[i - 1];
            const showAvatar = !isMe && (i === 0 || prev?.sender_id !== msg.sender_id);
            const isGrouped = i > 0 && prev?.sender_id === msg.sender_id && (new Date(msg.created_date) - new Date(prev?.created_date)) < 60000;
            const showTime = i === messages.length - 1 || (new Date(messages[i + 1]?.created_date) - new Date(msg.created_date)) > 300000;
            return (
              <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8, marginTop: isGrouped ? 2 : 10 }}>
                {/* Coach avatar placeholder for alignment */}
                {!isMe && (
                  <div style={{ width: 28, flexShrink: 0 }}>
                    {showAvatar && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', background: thread?.avatar ? 'transparent' : 'rgba(99,102,241,0.15)', border: '1.5px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#818cf8' }}>
                        {thread?.avatar ? <img src={thread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(thread?.name)}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {msg.media_url && <MediaBubble url={msg.media_url} type={msg.media_type || 'file'} name={msg.media_name} isMe={isMe} />}
                  {msg.content && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: isMe ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                      background: isMe
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        : 'rgba(255,255,255,0.08)',
                      border: isMe ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      fontSize: 14.5,
                      color: '#f1f5f9',
                      lineHeight: 1.5,
                      boxShadow: isMe ? '0 2px 12px rgba(59,130,246,0.3)' : 'none',
                    }}>{msg.content}</div>
                  )}
                  {showTime && <span style={{ fontSize: 10, color: '#334155', paddingLeft: 4, paddingRight: 4, marginTop: 1 }}>{fmtTime(msg.created_date)}</span>}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <MediaPreviewStrip previews={previews} onRemove={removePreview} />

      {/* Input bar */}
      <div style={{
        padding: '10px 12px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', gap: 8, alignItems: 'flex-end',
        flexShrink: 0,
        background: 'rgba(8,12,28,0.9)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
      }}>
        {showAttach && <AttachMenu onPickFile={handlePickFile} onPickCamera={handlePickCamera} onClose={() => setShowAttach(false)} />}
        <button onClick={() => setShowAttach(v => !v)} style={{ width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showAttach ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showAttach ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.09)'}`, cursor: 'pointer', flexShrink: 0 }}>
          <Paperclip style={{ width: 15, height: 15, color: showAttach ? '#818cf8' : '#475569' }} />
        </button>
        <textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={`Message ${thread?.name ?? 'Coach'}…`}
          rows={1}
          style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: '10px 16px', color: '#e2e8f0', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 96, overflowY: 'auto' }}
          onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button onClick={handleSend} disabled={!canSend} style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: canSend ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.05)', border: 'none', cursor: canSend ? 'pointer' : 'default', flexShrink: 0, boxShadow: canSend ? '0 4px 14px rgba(59,130,246,0.4)' : 'none', transition: 'all 0.15s' }}>
          {uploading || sendReply.isPending
            ? <div className="animate-spin" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            : <Send style={{ width: 14, height: 14, color: canSend ? '#fff' : '#334155', marginLeft: 1 }} />
          }
        </button>
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
      </div>
    </div>
  );
}

/* ─── CoachThreadRow ─── */
function CoachThreadRow({ thread, currentUser, onClick }) {
  const hasUnread = thread.unread > 0;

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px',
        background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
        border: `1px solid ${hasUnread ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 18,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: hasUnread ? '0 4px 20px rgba(99,102,241,0.18)' : '0 2px 12px rgba(0,0,0,0.4)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = hasUnread ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'}
    >
      {/* Top shine line */}
      <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)', pointerEvents: 'none' }} />

      {/* Left: avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: thread.avatar ? 'transparent' : 'rgba(99,102,241,0.12)', border: `2px solid ${hasUnread ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.3)'}`, boxShadow: hasUnread ? '0 0 14px rgba(99,102,241,0.4)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#818cf8' }}>
          {thread.avatar ? <img src={thread.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(thread.name)}
        </div>
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#10b981', border: '2px solid #02040a', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
      </div>

      {/* Middle: name + Coach label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: hasUnread ? 800 : 700, color: '#f1f5f9', margin: '0 0 3px', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {thread.name}
        </p>
        <p style={{ fontSize: 11.5, color: '#6366f1', margin: 0, fontWeight: 700, letterSpacing: '0.01em' }}>
          Coach
        </p>
      </div>

      {/* Right: unread count + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {hasUnread && (
          <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', padding: '0 5px', boxShadow: '0 2px 8px rgba(99,102,241,0.5)' }}>
            {thread.unread > 9 ? '9+' : thread.unread}
          </div>
        )}
        <ChevronRight style={{ width: 15, height: 15, color: '#334155' }} />
      </div>
    </button>
  );
}

/* ─── CoachMessages ─── */
function CoachMessages({ currentUser, hideEmpty = false }) {
  const [openThread, setOpenThread] = useState(null);
  const qc = useQueryClient();

  const { data: received = [], isLoading } = useQuery({
    queryKey: ['coachMessages', currentUser?.id],
    queryFn: () => base44.entities.Message.filter({ receiver_id: currentUser.id }, 'created_date', 200),
    enabled: !!currentUser, staleTime: 15 * 1000, refetchInterval: 15 * 1000,
  });
  const { data: sent = [] } = useQuery({
    queryKey: ['coachMessagesSent', currentUser?.id],
    queryFn: () => base44.entities.Message.filter({ sender_id: currentUser.id }, 'created_date', 200),
    enabled: !!currentUser, staleTime: 15 * 1000, refetchInterval: 15 * 1000,
  });

  const threads = useMemo(() => {
    const map = {};
    received.forEach(msg => {
      const id = msg.sender_id;
      if (!map[id]) map[id] = { sender_id: id, name: msg.sender_name || 'Coach', avatar: msg.sender_avatar || null, messages: [] };
      map[id].messages.push(msg);
    });
    sent.forEach(msg => {
      const id = msg.receiver_id;
      if (map[id]) map[id].messages.push(msg);
    });
    Object.values(map).forEach(t => {
      const seen = new Set();
      t.messages = t.messages.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
      t.messages.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      t.unread = t.messages.filter(m => m.receiver_id === currentUser?.id && !m.read).length;
    });
    return Object.values(map).sort((a, b) => {
      const la = a.messages[a.messages.length - 1]?.created_date || 0;
      const lb = b.messages[b.messages.length - 1]?.created_date || 0;
      return new Date(lb) - new Date(la);
    });
  }, [received, sent, currentUser?.id]);

  const activeThread = threads.find(t => t.sender_id === openThread);

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1, 2].map(i => (
        <div key={i} style={{ height: 76, borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 14 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.06)', width: '45%' }} />
            <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.04)', width: '70%' }} />
          </div>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );

  if (threads.length === 0) {
    if (hideEmpty) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 24px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Send style={{ width: 28, height: 28, color: '#6366f1' }} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', margin: '0 0 6px', letterSpacing: '-0.01em' }}>No messages yet</p>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, maxWidth: 240, margin: 0 }}>When a coach or gym owner messages you, their conversation will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {threads.map(thread => (
          <CoachThreadRow key={thread.sender_id} thread={thread} currentUser={currentUser} onClick={() => setOpenThread(thread.sender_id)} />
        ))}
      </div>

      {/* Full-screen chat page — slides in from right */}
      <AnimatePresence>
        {activeThread && (
          <motion.div
            key="chat-page"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 1 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300 }}
          >
            <ChatPage thread={activeThread} currentUser={currentUser} onBack={() => setOpenThread(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── CoachInviteBanner ─── */
function CoachInviteBanner({ invite, onAccept, onDecline, accepting, declining }) {
  return (
    <div style={{ background: 'linear-gradient(160deg, #0c1128 0%, #060c1e 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8, #6366f1)', opacity: 0.8 }} />
      <div style={{ padding: '16px 16px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Coach Request</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: invite.coach_avatar ? 'transparent' : 'rgba(99,102,241,0.12)', border: '2px solid rgba(99,102,241,0.5)', boxShadow: '0 0 18px rgba(99,102,241,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#818cf8', flexShrink: 0 }}>
            {invite.coach_avatar ? <img src={invite.coach_avatar} alt={invite.coach_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(invite.coach_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 3 }}>{invite.coach_name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8' }}>Personal Trainer</span>
              <BadgeCheck style={{ width: 13, height: 13, color: '#22c55e' }} />
            </div>
            {invite.coach_gym_name && <div style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{invite.coach_gym_name}</div>}
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55, margin: '12px 0 14px', paddingLeft: 2 }}>
          {invite.coach_name.split(' ')[0]} wants to work with you as their personal training client.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onAccept} disabled={accepting || declining} style={{ flex: 1, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#fff', boxShadow: '0 4px 14px rgba(34,197,94,0.3)', opacity: accepting || declining ? 0.6 : 1, fontFamily: 'inherit' }}>
            <CheckCircle style={{ width: 16, height: 16 }} /> Accept
          </button>
          <button onClick={onDecline} disabled={accepting || declining} style={{ flex: 1, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#64748b', opacity: accepting || declining ? 0.6 : 1, fontFamily: 'inherit' }}>
            <X style={{ width: 15, height: 15 }} /> Decline
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MyCoachBox ─── */
function MyCoachBox({ invite }) {
  return (
    <div style={{ background: 'linear-gradient(160deg, #0c1128 0%, #060c1e 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #818cf8)', opacity: 0.6 }} />
      <div style={{ padding: '16px 16px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Your Coach</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: invite.coach_avatar ? 'transparent' : 'rgba(99,102,241,0.12)', border: '2px solid rgba(99,102,241,0.45)', boxShadow: '0 0 14px rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#818cf8' }}>
            {invite.coach_avatar ? <img src={invite.coach_avatar} alt={invite.coach_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(invite.coach_name)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 3 }}>{invite.coach_name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8' }}>Personal Trainer</span>
              <BadgeCheck style={{ width: 13, height: 13, color: '#22c55e' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TrainerTab ─── */
export default function TrainerTab({ currentUser }) {
  const queryClient = useQueryClient();

  const { data: me } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });
  const user = me || currentUser;

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['coachInvitesPending', user?.id],
    queryFn: () => base44.entities.CoachInvite.filter({ member_id: user.id, status: 'pending' }, '-created_date', 20),
    enabled: !!user?.id, staleTime: 0, refetchInterval: 15 * 1000,
  });
  const { data: acceptedInvites = [] } = useQuery({
    queryKey: ['coachInvitesAccepted', user?.id],
    queryFn: () => base44.entities.CoachInvite.filter({ member_id: user.id, status: 'accepted' }, '-created_date', 10),
    enabled: !!user?.id, staleTime: 0, refetchInterval: 30 * 1000,
  });

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

  const hasCoach = acceptedInvites.length > 0;

  return (
    <div className="space-y-4 pt-4">
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          {pendingInvites.map(invite => (
            <CoachInviteBanner key={invite.id} invite={invite} accepting={processingId === invite.id} declining={processingId === invite.id} onAccept={() => handleAccept(invite)} onDecline={() => handleDecline(invite)} />
          ))}
        </div>
      )}
      {acceptedInvites.length > 0 && (
        <div className="space-y-3">
          {acceptedInvites.map(invite => <MyCoachBox key={invite.id} invite={invite} />)}
        </div>
      )}
      <CoachMessages currentUser={user} hideEmpty={hasCoach} />
    </div>
  );
}