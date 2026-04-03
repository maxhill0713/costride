import React, { useState, useRef, useCallback } from 'react';
import {
 X, Upload, Tag, Link2, Calendar, Sparkles,
 CheckCircle, Pin, Image as ImageIcon, Megaphone,
 Trophy, Gift, Lightbulb, Star, Users, Eye,
 ChevronRight, Zap, Clock, Send, ArrowUpRight,

} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';

// Design tokens — identical to the rest of the dashboard 
const T = {
 blue: '#0ea5e9', green: '#10b981', red: '#ef4444',
 amber: '#f59e0b', purple: '#8b5cf6',
 text1: '#f0f4f8', text2: '#94a3b8', text3: '#475569',
 border: 'rgba(255,255,255,0.07)', borderM: 'rgba(255,255,255,0.11)',
 card: '#0b1120', card2: '#0d1630', divider: 'rgba(255,255,255,0.05)',
 bg: '#060c18',
};

function Shimmer({ color = T.blue }) {
 return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}28,transparent)`, pointerEvents: 'none' }} />;
}

// Post types with full metadata 
const POST_TYPES = [
 { value: 'update', icon: Megaphone, label: 'Announcement', color: T.blue, placeholder: 'Share a gym update, news, or announcement with your members…' },
 { value: 'achievement', icon: Trophy, label: 'Achievement', color: T.amber, placeholder: 'Celebrate a milestone, record, or success story…' },
 { value: 'event', icon: Calendar, label: 'Event', color: T.green, placeholder: 'Tell members about an upcoming event or class…' },
 { value: 'offer', icon: Gift, label: 'Special Offer', color: T.red, placeholder: 'Share a promotion, discount, or special deal…' },
 { value: 'tip', icon: Lightbulb, label: 'Fitness Tip', color: T.purple, placeholder: 'Share a workout tip, nutrition advice, or coaching insight…' },
 { value: 'member_spotlight', icon: Star, label: 'Member Spotlight', color: T.amber, placeholder: "Highlight an amazing member's progress or story\u2026" },
];

// Character ring 
function CharRing({ count, max = 500 }) {
 const pct = Math.min(100, (count / max) * 100);
 const r = 10, cf = 2 * Math.PI * r;
 const over = count > max;
 const color = over ? T.red : pct > 80 ? T.amber : T.blue;
 if (count === 0) return null;
 return (
 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
 <svg width={24} height={24} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
 <circle cx={12} cy={12} r={r} fill="none" stroke={`${color}20`} strokeWidth="2" />
 <circle cx={12} cy={12} r={r} fill="none" stroke={color} strokeWidth="2"
 strokeDasharray={cf} strokeDashoffset={cf * (1 - pct / 100)}
 strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.2s ease' }} />
 </svg>
 <span style={{ fontSize: 10, fontWeight: 700, color: over ? T.red : T.text3, transition: 'color 0.2s' }}>
 {over ? `-${count - max}` : max - count}
 </span>
 </div>
 );
}

// Live post preview — matches actual PostCard feed style
const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';

function PostPreview({ postType, content, imageUrl, tags, callToAction, isPinned, scheduledDate, gym }) {
 const type = POST_TYPES.find(t => t.value === postType) || POST_TYPES[0];
 const Icon = type.icon;
 const empty = !content.trim() && !imageUrl;

 return (
 <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
 {/* Preview label */}
 <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
 <Eye style={{ width: 12, height: 12, color: T.text3 }} />
 <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
 </div>

 {/* Post card — exact PostCard feed style */}
 <div style={{
  borderRadius: 16, overflow: 'hidden', position: 'relative',
  background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
 }}>
 {/* Top shine line */}
 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)', pointerEvents: 'none', zIndex: 1 }} />
 {/* Indigo glow */}
 <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

 {/* Post header */}
 {empty ? (
 <div style={{ padding: '28px 16px 28px', textAlign: 'center' }}>
 <Icon style={{ width: 24, height: 24, color: `${type.color}50`, margin: '0 auto 8px', display: 'block' }} />
 <div style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>Start typing to see your post preview</div>
 </div>
 ) : (
 <>
 <div style={{ position: 'relative', zIndex: 1, padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0f172a', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 {gym?.logo_url || gym?.image_url
 ? <img src={gym.logo_url || gym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 : <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{(gym?.name || 'G').charAt(0).toUpperCase()}</span>}
 </div>
 <div>
 <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{gym?.name || 'Your Gym'}</div>
 <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 99, background: `${type.color}15`, border: `1px solid ${type.color}25` }}>
 <Icon style={{ width: 8, height: 8, color: type.color }} />
 <span style={{ fontSize: 9, fontWeight: 700, color: type.color }}>{type.label}</span>
 </div>
 <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
 {scheduledDate ? `Scheduled · ${format(new Date(scheduledDate), 'MMM d')}` : 'Just now'}
 </span>
 {isPinned && <span style={{ fontSize: 9, fontWeight: 800, color: T.amber }}>📌</span>}
 </div>
 </div>
 </div>
 </div>

 {/* Content */}
 <div style={{ position: 'relative', zIndex: 1, padding: '0 16px 12px' }}>
 <p style={{ fontSize: 13, color: 'rgba(203,213,225,1)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</p>
 </div>

 {/* Image */}
 {imageUrl && (
 <div style={{ width: '100%', overflow: 'hidden', maxHeight: 200 }}>
 <img src={imageUrl} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block', maxHeight: 200 }} />
 </div>
 )}

 {/* Tags */}
 {tags.length > 0 && (
 <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
 {tags.map((t, i) => (
 <span key={i} style={{ fontSize: 10, fontWeight: 700, color: type.color, background: `${type.color}10`, border: `1px solid ${type.color}20`, borderRadius: 5, padding: '2px 7px' }}>#{t}</span>
 ))}
 </div>
 )}

 {/* CTA */}
 {callToAction.enabled && callToAction.text && (
 <div style={{ margin: '0 16px 12px', padding: '9px 14px', borderRadius: 9, background: `${type.color}10`, border: `1px solid ${type.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <span style={{ fontSize: 12, fontWeight: 700, color: type.color }}>{callToAction.text}</span>
 <ArrowUpRight style={{ width: 12, height: 12, color: type.color }} />
 </div>
 )}

 {/* Reaction bar */}
 <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', minHeight: 44 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
 <img src={STREAK_ICON_URL} alt="react" style={{ width: 40, height: 40, objectFit: 'contain', opacity: 0.35 }} />
 <Send style={{ width: 18, height: 18, color: 'rgba(148,163,184,0.6)', marginLeft: 4 }} />
 </div>
 </div>
 </>
 )}
 </div>
 </div>
 );
}

// Toggle switch 
function Toggle({ value, onChange, color = T.blue, label, sub }) {
 return (
 <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: value ? `${color}08` : T.divider, border: `1px solid ${value ? color + '22' : T.border}`, cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => onChange(!value)}>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: value ? T.text1 : T.text2, transition: 'color 0.15s' }}>{label}</div>
 {sub && <div style={{ fontSize: 10, color: T.text3, marginTop: 1 }}>{sub}</div>}
 </div>
 <div style={{ flexShrink: 0, width: 38, height: 21, borderRadius: 99, background: value ? color : 'rgba(255,255,255,0.1)', transition: 'background 0.2s', position: 'relative' }}>
 <div style={{ position: 'absolute', top: 2.5, left: value ? 19 : 2.5, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
 </div>
 </div>
 );
}

// Field label 
function FieldLabel({ children, required }) {
 return (
 <div style={{ fontSize: 10, fontWeight: 800, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
 {children}
 {required && <span style={{ color: T.red, fontSize: 10 }}>*</span>}
 </div>
 );
}

// Main modal 
export default function CreateGymOwnerPostModal({ open, onClose, gym, onSuccess }) {
 const [content, setContent] = useState('');
 const [imageUrl, setImageUrl] = useState('');
 const [postType, setPostType] = useState('update');
 const [tags, setTags] = useState([]);
 const [newTag, setNewTag] = useState('');
 const [isPinned, setIsPinned] = useState(false);
 const [scheduledDate,setScheduledDate]= useState('');
 const [callToAction, setCallToAction] = useState({ enabled: false, text: '', link: '' });
 const [submitting, setSubmitting] = useState(false);
 const [uploading, setUploading] = useState(false);
 const [dragOver, setDragOver] = useState(false);
 const fileRef = useRef();

 const activeType = POST_TYPES.find(t => t.value === postType) || POST_TYPES[0];
 const canSubmit = content.trim().length > 0 && !submitting;

 const uploadMutation = useMutation({
 mutationFn: async (file) => { const r = await base44.integrations.Core.UploadFile({ file }); return r.file_url; },
 onSuccess: (url) => { setImageUrl(url); setUploading(false); },
 onError: () => { setUploading(false); },
 });

 const handleFile = useCallback((file) => {
 if (!file || !file.type.startsWith('image/')) return;
 setUploading(true);
 uploadMutation.mutate(file);
 }, [uploadMutation]);

 const handleDrop = (e) => {
 e.preventDefault(); setDragOver(false);
 const file = e.dataTransfer.files?.[0];
 if (file) handleFile(file);
 };

 const addTag = () => {
 const t = newTag.trim().toLowerCase().replace(/\s+/g, '-');
 if (t && !tags.includes(t) && tags.length < 8) { setTags([...tags, t]); setNewTag(''); }
 };

 const reset = () => {
 setContent(''); setImageUrl(''); setPostType('update'); setTags([]);
 setIsPinned(false); setScheduledDate(''); setCallToAction({ enabled: false, text: '', link: '' });
 setNewTag('');
 };

 const handleSubmit = async () => {
 if (!canSubmit) return;
 setSubmitting(true);
 try {
 await base44.entities.Post.create({
 member_id: gym.id, member_name: gym.name, member_avatar: gym.image_url,
 content: content.trim(), image_url: imageUrl || null, likes: 0, comments: [],
 post_type: postType, tags, is_pinned: isPinned,
 scheduled_date: scheduledDate || null,
 call_to_action: callToAction.enabled && callToAction.text ? { text: callToAction.text, link: callToAction.link } : null,
 });
 onSuccess?.();
 reset();
 onClose();
 } catch {
 } finally {
 setSubmitting(false);
 }
 };

 const handleClose = () => { reset(); onClose(); };

 if (!open) return null;

 return (
 <>
 <style>{`
 @keyframes modal-in { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
 @keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }
 .post-ta { width: 100%; box-sizing: border-box; padding: 13px 15px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #f0f4f8; font-size: 13px; font-weight: 500; line-height: 1.65; outline: none; resize: none; font-family: 'DM Sans', system-ui, sans-serif; transition: border-color 0.15s; }
 .post-ta:focus { border-color: rgba(14,165,233,0.45); background: rgba(255,255,255,0.06); }
 .post-ta::placeholder { color: rgba(71,85,105,0.8); }
 .post-inp { width: 100%; box-sizing: border-box; padding: 10px 13px; border-radius: 9px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #f0f4f8; font-size: 12px; font-weight: 600; outline: none; font-family: 'DM Sans', system-ui, sans-serif; transition: border-color 0.15s; }
 .post-inp:focus { border-color: rgba(14,165,233,0.45); }
 .post-inp::placeholder { color: rgba(71,85,105,0.7); }
 .type-btn:hover { transform: translateY(-1px); }
 .submit-btn:not(:disabled):hover { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(14,165,233,0.35); }
 .submit-btn:not(:disabled):active { transform: translateY(0); }
 `}</style>

 {/* Overlay */}
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'overlay-in 0.2s ease' }}
 onClick={e => e.target === e.currentTarget && handleClose()}>

 {/* Modal */}
 <div style={{ width: '100%', maxWidth: 880, maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#07101f', border: `1px solid ${T.borderM}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset', animation: 'modal-in 0.22s cubic-bezier(0.34,1.4,0.64,1)' }}>

 {/* Header */}
 <div style={{ flexShrink: 0, padding: '18px 24px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
 <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${activeType.color}40,transparent)`, transition: 'background 0.3s' }} />
 <div style={{ position: 'absolute', top: -40, left: -20, width: 180, height: 100, borderRadius: '50%', background: activeType.color, opacity: 0.04, filter: 'blur(40px)', transition: 'background 0.3s', pointerEvents: 'none' }} />
 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
 <div style={{ width: 38, height: 38, borderRadius: 11, background: `${activeType.color}14`, border: `1px solid ${activeType.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
 <activeType.icon style={{ width: 17, height: 17, color: activeType.color, transition: 'color 0.2s' }} />
 </div>
 <div>
 <div style={{ fontSize: 16, fontWeight: 800, color: T.text1, letterSpacing: '-0.025em' }}>New Post</div>
 <div style={{ fontSize: 11, color: T.text3, marginTop: 1, fontWeight: 500 }}>{gym?.name}</div>
 </div>
 </div>
 <button onClick={handleClose}
 style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.15s', color: T.text3 }}
 onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = T.text1; }}
 onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = T.text3; }}>
 <X style={{ width: 14, height: 14 }} />
 </button>
 </div>

 {/* Body — two columns */}
 <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 0 }}>

 {/* Left — form */}
 <div style={{ padding: '20px 24px', borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

 {/* Post type pills */}
 <div>
 <FieldLabel>Post type</FieldLabel>
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
 {POST_TYPES.map(type => {
 const active = postType === type.value;
 return (
 <button key={type.value} className="type-btn" onClick={() => setPostType(type.value)}
 style={{ padding: '10px 10px 9px', borderRadius: 10, background: active ? `${type.color}14` : T.divider, border: `1px solid ${active ? type.color + '35' : T.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s', fontFamily: 'inherit', textAlign: 'left' }}>
 <div style={{ width: 24, height: 24, borderRadius: 7, background: `${type.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
 <type.icon style={{ width: 11, height: 11, color: type.color }} />
 </div>
 <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: active ? T.text1 : T.text2, transition: 'color 0.15s' }}>{type.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* Content */}
 <div>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
 <FieldLabel required>Content</FieldLabel>
 <CharRing count={content.length} max={500} />
 </div>
 <textarea className="post-ta" rows={5} value={content} onChange={e => setContent(e.target.value)} placeholder={activeType.placeholder} />
 </div>

 {/* Image upload */}
 <div>
 <FieldLabel>Image</FieldLabel>
 {imageUrl ? (
 <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
 <img src={imageUrl} alt="Preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block', borderRadius: 10, border: `1px solid ${T.border}` }} />
 <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 50%)', borderRadius: 10, pointerEvents: 'none' }} />
 <button onClick={() => setImageUrl('')}
 style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', border: `1px solid ${T.borderM}`, cursor: 'pointer', backdropFilter: 'blur(6px)' }}>
 <X style={{ width: 11, height: 11, color: '#fff' }} />
 </button>
 <div style={{ position: 'absolute', bottom: 8, left: 12, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Image attached </div>
 </div>
 ) : (
 <div
 onDragOver={e => { e.preventDefault(); setDragOver(true); }}
 onDragLeave={() => setDragOver(false)}
 onDrop={handleDrop}
 onClick={() => fileRef.current?.click()}
 style={{ padding: '22px 16px', borderRadius: 10, border: `2px dashed ${dragOver ? activeType.color + '60' : T.border}`, background: dragOver ? `${activeType.color}06` : 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
 <div style={{ width: 36, height: 36, borderRadius: 10, background: `${activeType.color}10`, border: `1px solid ${activeType.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 {uploading ? <div style={{ width: 14, height: 14, border: `2px solid ${activeType.color}30`, borderTop: `2px solid ${activeType.color}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Upload style={{ width: 14, height: 14, color: activeType.color }} />}
 </div>
 <div>
 <div style={{ fontSize: 12, fontWeight: 700, color: T.text2, textAlign: 'center' }}>{uploading ? 'Uploading…' : 'Drop image here or click to browse'}</div>
 <div style={{ fontSize: 10, color: T.text3, textAlign: 'center', marginTop: 3 }}>PNG, JPG up to 10MB</div>
 </div>
 <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
 </div>
 )}
 </div>

 {/* Tags */}
 <div>
 <FieldLabel>Tags</FieldLabel>
 <div style={{ display: 'flex', gap: 8 }}>
 <input className="post-inp" style={{ flex: 1 }} value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="e.g. challenge, nutrition, event" />
 <button onClick={addTag} disabled={!newTag.trim() || tags.length >= 8}
 style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: newTag.trim() ? `${activeType.color}14` : T.divider, border: `1px solid ${newTag.trim() ? activeType.color + '30' : T.border}`, cursor: newTag.trim() ? 'pointer' : 'default', transition: 'all 0.15s' }}>
 <Tag style={{ width: 13, height: 13, color: newTag.trim() ? activeType.color : T.text3 }} />
 </button>
 </div>
 {tags.length > 0 && (
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
 {tags.map((t, i) => (
 <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 7, background: `${activeType.color}12`, border: `1px solid ${activeType.color}25`, color: activeType.color }}>
 #{t}
 <button onClick={() => setTags(tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: `${activeType.color}80`, lineHeight: 1 }}>
 <X style={{ width: 9, height: 9 }} />
 </button>
 </span>
 ))}
 <span style={{ fontSize: 10, color: T.text3, alignSelf: 'center' }}>{tags.length}/8</span>
 </div>
 )}
 </div>

 {/* Call to Action */}
 <div>
 <FieldLabel>Call to Action</FieldLabel>
 <Toggle
 value={callToAction.enabled}
 onChange={v => setCallToAction({ ...callToAction, enabled: v })}
 color={activeType.color}
 label="Add a button to the post"
 sub="Direct members to a link, booking page, or form"
 />
 {callToAction.enabled && (
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 9 }}>
 <div>
 <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginBottom: 5 }}>Button label</div>
 <input className="post-inp" value={callToAction.text} onChange={e => setCallToAction({ ...callToAction, text: e.target.value })} placeholder="e.g. Book your spot" />
 </div>
 <div>
 <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginBottom: 5 }}>Destination URL</div>
 <input className="post-inp" value={callToAction.link} onChange={e => setCallToAction({ ...callToAction, link: e.target.value })} placeholder="https://…" />
 </div>
 </div>
 )}
 </div>

 {/* Options row */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
 <Toggle value={isPinned} onChange={setIsPinned} color={T.amber} label=" Pin to top" sub="Keeps this post at the top of the feed" />
 <div>
 <FieldLabel>Schedule</FieldLabel>
 <div style={{ position: 'relative' }}>
 <Clock style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: T.text3, pointerEvents: 'none' }} />
 <input type="datetime-local" className="post-inp" style={{ paddingLeft: 30, colorScheme: 'dark' }} value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
 </div>
 {scheduledDate && (
 <div style={{ fontSize: 10, color: T.amber, fontWeight: 600, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
 <Clock style={{ width: 9, height: 9 }} />
 Scheduled for {format(new Date(scheduledDate), 'MMM d \'at\' h:mma')}
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Right — live preview */}
 <div style={{ padding: '20px 20px', background: T.bg, overflowY: 'auto' }}>
 <PostPreview
 postType={postType} content={content} imageUrl={imageUrl}
 tags={tags} callToAction={callToAction} isPinned={isPinned}
 scheduledDate={scheduledDate} gym={gym}
 />
 </div>
 </div>

 {/* Footer */}
 <div style={{ flexShrink: 0, padding: '14px 24px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, background: '#07101f' }}>
 {/* Content status */}
 <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
 {content.trim() ? (
 <>
 <CheckCircle style={{ width: 13, height: 13, color: T.green, flexShrink: 0 }} />
 <span style={{ fontSize: 11, color: T.text3 }}>
 {content.length} chars · {postType === 'update' ? 'Announcement' : activeType.label}
 {isPinned ? ' · Pinned' : ''}
 {tags.length > 0 ? ` · ${tags.length} tag${tags.length !== 1 ? 's' : ''}` : ''}
 </span>
 </>
 ) : (
 <span style={{ fontSize: 11, color: T.text3 }}>Add content to publish</span>
 )}
 </div>

 {/* Cancel */}
 <button onClick={handleClose}
 style={{ padding: '10px 20px', borderRadius: 10, background: T.divider, color: T.text2, border: `1px solid ${T.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
 onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.text1; }}
 onMouseLeave={e => { e.currentTarget.style.background = T.divider; e.currentTarget.style.color = T.text2; }}>
 Cancel
 </button>

 {/* Publish / Schedule */}
 <button className="submit-btn" onClick={handleSubmit} disabled={!canSubmit}
 style={{ padding: '10px 24px', borderRadius: 10, background: canSubmit ? (scheduledDate ? `linear-gradient(135deg,${T.amber},#d97706)` : `linear-gradient(135deg,${T.blue},#0284c7)`) : 'rgba(255,255,255,0.06)', color: canSubmit ? '#fff' : T.text3, border: 'none', fontSize: 12, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s', letterSpacing: '-0.01em', boxShadow: canSubmit ? `0 4px 16px ${scheduledDate ? T.amber : T.blue}35` : 'none', minWidth: 160, justifyContent: 'center' }}>
 {submitting
 ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Publishing…</>
 : scheduledDate
 ? <><Calendar style={{ width: 13, height: 13 }} /> Schedule Post</>
 : <><Zap style={{ width: 13, height: 13 }} /> Publish Now</>
 }
 </button>
 </div>
 </div>
 </div>

 <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
 </>
 );
}