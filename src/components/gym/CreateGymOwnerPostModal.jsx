import React, { useState } from 'react';
import { X, Sparkles, Upload, Tag, Link2, Calendar, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const S = `
  .dm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(10px);z-index:50;display:flex;align-items:flex-end;justify-content:center;}
  @media(min-width:640px){.dm-overlay{align-items:center;}}
  .dm-modal{width:100%;max-width:560px;max-height:92vh;display:flex;flex-direction:column;background:linear-gradient(145deg,rgba(10,16,44,0.98),rgba(5,8,24,0.99));border:1px solid rgba(255,255,255,0.08);border-top:1px solid rgba(255,255,255,0.13);border-radius:24px 24px 0 0;overflow:hidden;}
  @media(min-width:640px){.dm-modal{border-radius:24px;max-height:90vh;}}
  .dm-inp{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-size:13px;font-weight:600;outline:none;box-sizing:border-box;}
  .dm-inp:focus{border-color:rgba(59,130,246,0.5);}
  .dm-inp::placeholder{color:rgba(148,163,184,0.4);}
  .dm-ta{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-size:13px;font-weight:600;outline:none;box-sizing:border-box;resize:none;}
  .dm-ta:focus{border-color:rgba(59,130,246,0.5);}
  .dm-ta::placeholder{color:rgba(148,163,184,0.4);}
  .dm-sel{width:100%;padding:10px 13px;border-radius:11px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:#fff;font-size:13px;font-weight:600;outline:none;box-sizing:border-box;appearance:none;}
  .dm-sel option{background:#0a1628;color:#fff;}
  .dm-tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);color:rgba(165,180,252,0.9);}
  .dm-label{font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(148,163,184,0.5);margin-bottom:6px;display:block;}
`;

function DarkButton({ onClick, disabled, children, secondary }) {
  const [p, setP] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => !disabled && setP(true)}
      onMouseUp={() => setP(false)}
      onMouseLeave={() => setP(false)}
      onTouchStart={() => !disabled && setP(true)}
      onTouchEnd={() => setP(false)}
      style={{
        flex: 1, padding: '12px 0', borderRadius: 13, fontSize: 13, fontWeight: 900,
        color: secondary ? 'rgba(148,163,184,0.8)' : '#fff',
        background: disabled ? 'rgba(255,255,255,0.05)' : secondary ? 'rgba(255,255,255,0.05)' : 'linear-gradient(180deg,#3b82f6 0%,#2563eb 50%,#1d4ed8 100%)',
        border: secondary ? '1px solid rgba(255,255,255,0.08)' : disabled ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.18)',
        borderBottom: secondary || disabled ? '3px solid rgba(0,0,0,0.3)' : p ? '1px solid #1e3a8a' : '4px solid #1e3a8a',
        boxShadow: secondary || disabled ? 'none' : p ? 'none' : '0 3px 0 rgba(0,0,0,0.4),0 6px 20px rgba(59,130,246,0.3),inset 0 1px 0 rgba(255,255,255,0.2)',
        transform: p ? 'translateY(3px) scale(0.98)' : 'translateY(0) scale(1)',
        transition: p ? 'transform 0.06s,box-shadow 0.06s' : 'transform 0.28s cubic-bezier(0.34,1.5,0.64,1),box-shadow 0.18s',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >{children}</button>
  );
}

const POST_TYPES = [
  { value: 'update', label: '📢 Update / Announcement' },
  { value: 'achievement', label: '🏆 Achievement / Success' },
  { value: 'event', label: '📅 Event Promotion' },
  { value: 'offer', label: '🎁 Special Offer' },
  { value: 'tip', label: '💡 Fitness Tip' },
  { value: 'member_spotlight', label: '⭐ Member Spotlight' },
];

const PLACEHOLDERS = {
  achievement: 'Share a gym achievement or milestone...',
  event: 'Tell members about an upcoming event...',
  offer: 'Announce a special offer or promotion...',
  tip: 'Share a helpful fitness tip...',
  member_spotlight: 'Highlight an amazing member...',
};

export default function CreateGymOwnerPostModal({ open, onClose, gym, onSuccess }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [postType, setPostType] = useState('update');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [callToAction, setCallToAction] = useState({ enabled: false, text: '', link: '' });
  const [submitting, setSubmitting] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file) => { const r = await base44.integrations.Core.UploadFile({ file }); return r.file_url; },
    onSuccess: (url) => { setImageUrl(url); setUploading(false); }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) { setUploading(true); uploadMutation.mutate(file); }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) { setTags([...tags, newTag.trim()]); setNewTag(''); }
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    await base44.entities.Post.create({
      member_id: gym.id, member_name: gym.name, member_avatar: gym.image_url,
      content, image_url: imageUrl, likes: 0, comments: [],
      post_type: postType, tags, is_pinned: isPinned,
      scheduled_date: scheduledDate || null,
      call_to_action: callToAction.enabled ? { text: callToAction.text, link: callToAction.link } : null
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
      <style>{S}</style>
      <div className="dm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="dm-modal">

          {/* Header */}
          <div style={{ flexShrink:0, padding:'20px 20px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:11,background:'linear-gradient(135deg,rgba(139,92,246,0.25),rgba(99,102,241,0.15))',border:'1px solid rgba(139,92,246,0.3)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Sparkles style={{ width:17,height:17,color:'#c4b5fd' }}/>
                </div>
                <div>
                  <h2 style={{ fontSize:17,fontWeight:900,color:'#fff',letterSpacing:'-0.03em',margin:0 }}>New Gym Post</h2>
                  <p style={{ fontSize:11,color:'rgba(148,163,184,0.5)',margin:0,fontWeight:600 }}>{gym?.name}</p>
                </div>
              </div>
              <button onClick={onClose} style={{ width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer' }}>
                <X style={{ width:15,height:15,color:'rgba(255,255,255,0.6)' }}/>
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'16px 20px' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Post type */}
              <div>
                <span className="dm-label">Post Type</span>
                <select className="dm-sel" value={postType} onChange={e => setPostType(e.target.value)}>
                  {POST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Content */}
              <div>
                <span className="dm-label">Content *</span>
                <textarea
                  className="dm-ta"
                  rows={5}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={PLACEHOLDERS[postType] || 'Share an update with your members...'}
                />
                <p style={{ fontSize:10,color:'rgba(148,163,184,0.35)',marginTop:4,fontWeight:600 }}>{content.length} characters</p>
              </div>

              {/* Image upload */}
              <div>
                <span className="dm-label">Image (Optional)</span>
                <label style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:11,background:'rgba(255,255,255,0.04)',border:'1px dashed rgba(255,255,255,0.12)',cursor:'pointer' }}>
                  <Upload style={{ width:15,height:15,color:'rgba(148,163,184,0.5)',flexShrink:0 }}/>
                  <span style={{ fontSize:12,color:'rgba(148,163,184,0.5)',fontWeight:600 }}>{uploading ? 'Uploading...' : imageUrl ? 'Image attached ✓' : 'Upload image'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} style={{ display:'none' }}/>
                </label>
                {imageUrl && !uploading && (
                  <div style={{ position:'relative',marginTop:8 }}>
                    <img src={imageUrl} alt="Preview" style={{ width:'100%',maxHeight:160,objectFit:'cover',borderRadius:11,border:'1px solid rgba(255,255,255,0.08)' }}/>
                    <button onClick={() => setImageUrl('')} style={{ position:'absolute',top:6,right:6,width:24,height:24,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer' }}>
                      <X style={{ width:11,height:11,color:'#fff' }}/>
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <span className="dm-label">Tags</span>
                <div style={{ display:'flex', gap:8 }}>
                  <input className="dm-inp" style={{ flex:1 }} value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="e.g. nutrition, event, offer"/>
                  <button onClick={addTag} style={{ width:40,height:40,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(99,102,241,0.18)',border:'1px solid rgba(99,102,241,0.3)',cursor:'pointer',flexShrink:0 }}>
                    <Tag style={{ width:15,height:15,color:'#818cf8' }}/>
                  </button>
                </div>
                {tags.length > 0 && (
                  <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:8 }}>
                    {tags.map((t, i) => (
                      <span key={i} className="dm-tag">
                        #{t}
                        <button onClick={() => setTags(tags.filter(x => x !== t))} style={{ background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center' }}>
                          <X style={{ width:9,height:9,color:'rgba(165,180,252,0.6)' }}/>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Call to Action */}
              <div style={{ padding:'12px 14px',borderRadius:12,background:'rgba(99,102,241,0.07)',border:'1px solid rgba(99,102,241,0.15)' }}>
                <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom: callToAction.enabled ? 10 : 0 }}>
                  <input type="checkbox" checked={callToAction.enabled} onChange={e => setCallToAction({ ...callToAction, enabled: e.target.checked })} style={{ width:14,height:14,accentColor:'#6366f1' }}/>
                  <Link2 style={{ width:13,height:13,color:'#818cf8' }}/>
                  <span style={{ fontSize:12,fontWeight:700,color:'rgba(165,180,252,0.8)' }}>Add Call-to-Action Button</span>
                </label>
                {callToAction.enabled && (
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
                    <input className="dm-inp" value={callToAction.text} onChange={e => setCallToAction({ ...callToAction, text: e.target.value })} placeholder="Button text (e.g. Book Now)"/>
                    <input className="dm-inp" value={callToAction.link} onChange={e => setCallToAction({ ...callToAction, link: e.target.value })} placeholder="Link URL"/>
                  </div>
                )}
              </div>

              {/* Options row */}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                <label style={{ display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:11,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer' }}>
                  <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} style={{ width:14,height:14,accentColor:'#6366f1' }}/>
                  <span style={{ fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.65)' }}>📌 Pin to Top</span>
                </label>
                <div>
                  <span className="dm-label" style={{ display:'flex',alignItems:'center',gap:5 }}><Calendar style={{ width:11,height:11 }}/>Schedule</span>
                  <input type="datetime-local" className="dm-inp" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}/>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div style={{ flexShrink:0,padding:'14px 20px 20px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:10 }}>
            <DarkButton onClick={onClose} secondary>Cancel</DarkButton>
            <DarkButton onClick={handleSubmit} disabled={!content.trim() || submitting}>
              {submitting ? 'Publishing...' : scheduledDate ? '📅 Schedule Post' : '✨ Publish Post'}
            </DarkButton>
          </div>
        </div>
      </div>
    </>
  );
}