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
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 50;
  }

  .cgop-modal {
    width: 100%; max-width: 520px;
    background: linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%);
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow:
      0 20px 60px rgba(0,0,0,0.8),
      inset 0 1px 0 rgba(255,255,255,0.05);
    display: flex; flex-direction: column;
    max-height: 90vh;
    color: #fff;
  }

  .cgop-textarea {
    width: 100%; background: transparent; border: none; outline: none;
    color: #fff; font-size: 15px; font-weight: 500; resize: none;
    font-family: inherit;
  }

  .cgop-textarea::placeholder {
    color: rgba(148,163,184,0.5);
  }

  .cgop-pill {
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);

    transition: all 0.2s ease;
  }

  .cgop-pill:hover {
    background: rgba(255,255,255,0.06);
  }

  .cgop-pill.active {
    background: linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.1));
    border-color: rgba(59,130,246,0.5);
    color: #93c5fd;
    box-shadow: 0 0 0 1px rgba(59,130,246,0.2);
  }

  .cgop-inp {
    width: 100%; padding: 10px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #fff; font-size: 13px; outline: none;
  }

  .cgop-inp:focus {
    border-color: rgba(59,130,246,0.6);
    box-shadow: 0 0 0 1px rgba(59,130,246,0.3);
  }

  .cgop-inp::placeholder {
    color: rgba(148,163,184,0.4);
  }
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
      member_id: gym.id,
      member_name: gym.name,
      member_avatar: gym.image_url,
      content,
      image_url: imageUrl,
      likes: 0,
      comments: [],
      post_type: postType,
      tags,
      is_pinned: isPinned,
      scheduled_date: scheduledDate || null,
      call_to_action: callToAction.enabled
        ? { text: callToAction.text, link: callToAction.link }
        : null,
    });

    onSuccess?.();

    setContent('');
    setImageUrl('');
    setPostType('update');
    setTags([]);
    setIsPinned(false);
    setScheduledDate('');
    setCallToAction({ enabled: false, text: '', link: '' });
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
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Create Post</h2>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.5 }}>{gym?.name}</p>
            </div>
            <button onClick={onClose} style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 18,
              cursor: 'pointer'
            }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>

            {/* Content Box */}
            <div style={{
              padding: 16,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <textarea
                className="cgop-textarea"
                rows={4}
                placeholder="What do you want to share with your members?"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            {/* Pills */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {POST_TYPES.map(t => (
                <button
                  key={t.value}
                  className={`cgop-pill${postType === t.value ? ' active' : ''}`}
                  onClick={() => setPostType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Image */}
            <div style={{ marginTop: 16 }}>
              <label style={{ cursor: 'pointer', fontSize: 13, color: 'rgba(148,163,184,0.7)' }}>
                {uploading ? 'Uploading…' : imageUrl ? 'Image attached ✓ (change)' : '+ Add image'}
                <input type="file" hidden onChange={handleFileUpload} />
              </label>

              {imageUrl && (
                <div style={{ marginTop: 10 }}>
                  <img src={imageUrl} style={{ width: '100%', borderRadius: 12 }} />
                </div>
              )}
            </div>

            {/* Advanced */}
            <details style={{ marginTop: 20 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, opacity: 0.6 }}>
                Advanced options
              </summary>

              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input className="cgop-inp" placeholder="Tags"
                  onBlur={e => setTags(e.target.value.split(',').map(t => t.trim()))} />

                <input className="cgop-inp" placeholder="CTA Text"
                  onChange={e => setCallToAction(p => ({ ...p, enabled: true, text: e.target.value }))} />

                <input className="cgop-inp" placeholder="CTA Link"
                  onChange={e => setCallToAction(p => ({ ...p, enabled: true, link: e.target.value }))} />

                <input type="datetime-local" className="cgop-inp"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)} />

                <label style={{ fontSize: 13 }}>
                  <input type="checkbox"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)} /> Pin post
                </label>
              </div>
            </details>

          </div>

          {/* Footer */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            gap: 10
          }}>
            <button onClick={onClose}
              style={{
                flex: 1,
                padding: '11px 0',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              style={{
                flex: 1,
                padding: '12px 0',
                borderRadius: 12,
                background: !content.trim() || submitting
                  ? 'rgba(37,99,235,0.4)'
                  : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontWeight: 700,
                cursor: !content.trim() || submitting ? 'default' : 'pointer',
                boxShadow: !content.trim() || submitting ? 'none' : `
                  0 8px 25px rgba(37,99,235,0.35),
                  inset 0 1px 0 rgba(255,255,255,0.2)
                `
              }}
            >
              {submitting ? 'Posting…' : scheduledDate ? '📅 Schedule' : '✨ Publish'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}