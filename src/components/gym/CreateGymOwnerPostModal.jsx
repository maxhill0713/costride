import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const POST_TYPES = [
  { value: 'update',           label: '📢 Update' },
  { value: 'achievement',      label: '🏆 Achievement' },
  { value: 'event',            label: '📅 Event' },
  { value: 'offer',            label: '🎁 Offer' },
  { value: 'tip',              label: '💡 Tip' },
  { value: 'member_spotlight', label: '⭐ Spotlight' },
];

const CSS = `
  .cgop-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 50;
  }
  .cgop-modal {
    width: 100%; max-width: 520px;
    background: #0b1220;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column;
    max-height: 90vh;
    color: #fff;
  }
  .cgop-textarea {
    width: 100%; background: transparent; border: none; outline: none;
    color: #fff; font-size: 15px; font-weight: 500; resize: none;
    font-family: inherit;
  }
  .cgop-textarea::placeholder { color: rgba(148,163,184,0.4); }
  .cgop-pill {
    padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
    cursor: pointer; border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6); background: transparent;
    transition: all 0.12s;
  }
  .cgop-pill.active {
    background: rgba(59,130,246,0.15); color: #60a5fa;
    border-color: rgba(59,130,246,0.4);
  }
  .cgop-inp {
    width: 100%; padding: 9px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
    color: #fff; font-size: 13px; outline: none; box-sizing: border-box;
    font-family: inherit;
  }
  .cgop-inp::placeholder { color: rgba(148,163,184,0.4); }
`;

export default function CreateGymOwnerPostModal({ open, onClose, gym, onSuccess }) {
  const [content, setContent]             = useState('');
  const [imageUrl, setImageUrl]           = useState('');
  const [uploading, setUploading]         = useState(false);
  const [postType, setPostType]           = useState('update');
  const [tags, setTags]                   = useState([]);
  const [isPinned, setIsPinned]           = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [callToAction, setCallToAction]   = useState({ enabled: false, text: '', link: '' });
  const [submitting, setSubmitting]       = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const r = await base44.integrations.Core.UploadFile({ file });
      return r.file_url;
    },
    onSuccess: (url) => { setImageUrl(url); setUploading(false); },
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) { setUploading(true); uploadMutation.mutate(file); }
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    await base44.entities.Post.create({
      member_id: gym.id, member_name: gym.name, member_avatar: gym.image_url,
      content, image_url: imageUrl, likes: 0, comments: [],
      post_type: postType, tags, is_pinned: isPinned,
      scheduled_date: scheduledDate || null,
      call_to_action: callToAction.enabled ? { text: callToAction.text, link: callToAction.link } : null,
    });
    onSuccess?.();
    setContent(''); setImageUrl(''); setPostType('update'); setTags([]);
    setIsPinned(false); setScheduledDate(''); setCallToAction({ enabled: false, text: '', link: '' });
    setSubmitting(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="cgop-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="cgop-modal">

          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Create Post</h2>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.5 }}>{gym?.name}</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>

            {/* Content */}
            <textarea
              className="cgop-textarea"
              rows={4}
              placeholder="What do you want to share with your members?"
              value={content}
              onChange={e => setContent(e.target.value)}
            />

            {/* Post type pills */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {POST_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`cgop-pill${postType === t.value ? ' active' : ''}`}
                  onClick={() => setPostType(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Image */}
            <div style={{ marginTop: 16 }}>
              <label style={{ cursor: 'pointer', fontSize: 13, color: 'rgba(148,163,184,0.7)' }}>
                {uploading ? 'Uploading…' : imageUrl ? 'Image attached ✓  (change)' : '+ Add image'}
                <input type="file" accept="image/*" hidden onChange={handleFileUpload} disabled={uploading} />
              </label>
              {imageUrl && !uploading && (
                <div style={{ position: 'relative', marginTop: 10 }}>
                  <img src={imageUrl} style={{ width: '100%', borderRadius: 12, maxHeight: 180, objectFit: 'cover' }} />
                  <button onClick={() => setImageUrl('')}
                    style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: 6, width: 24, height: 24, cursor: 'pointer', fontSize: 12 }}>✕</button>
                </div>
              )}
            </div>

            {/* Advanced */}
            <details style={{ marginTop: 20 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: 'rgba(148,163,184,0.6)', userSelect: 'none' }}>
                Advanced options
              </summary>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="cgop-inp" placeholder="Tags (comma separated)"
                  onBlur={e => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))} />
                <input className="cgop-inp" placeholder="CTA Button text (e.g. Book Now)"
                  onChange={e => setCallToAction(p => ({ ...p, enabled: true, text: e.target.value }))} />
                <input className="cgop-inp" placeholder="CTA Link URL"
                  onChange={e => setCallToAction(p => ({ ...p, enabled: true, link: e.target.value }))} />
                <input type="datetime-local" className="cgop-inp" value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)} />
                <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} /> 📌 Pin post
                </label>
              </div>
            </details>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={!content.trim() || submitting}
              style={{ flex: 1, padding: '11px 0', borderRadius: 12, background: !content.trim() || submitting ? 'rgba(37,99,235,0.4)' : '#2563eb', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: !content.trim() || submitting ? 'default' : 'pointer' }}>
              {submitting ? 'Posting…' : scheduledDate ? '📅 Schedule' : '✨ Publish'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}