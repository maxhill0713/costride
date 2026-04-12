import React, { useState, useRef, useCallback } from 'react';
import {
  X, Upload, Tag, Calendar, Sparkles, CheckCircle, Pin,
  Megaphone, Trophy, Gift, Lightbulb, Star, Eye,
  Zap, Clock, Send, ArrowUpRight,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';

/* ─── Dashboard design tokens ────────────────────────────────── */
const D = {
  bg:          '#05080f',
  surface:     '#090e1a',
  surfaceHigh: '#0c1220',
  surfaceMid:  '#0a1019',
  surfaceLow:  '#070c15',
  border:      'rgba(255,255,255,0.055)',
  borderMid:   'rgba(255,255,255,0.10)',
  borderHigh:  'rgba(255,255,255,0.15)',
  text1:       '#ffffff',
  text2:       '#7e92ad',
  text3:       '#3d5068',
  blue:    '#3b82f6', blueDim:    'rgba(59,130,246,0.10)',  blueBorder:   'rgba(59,130,246,0.24)',
  red:     '#ef4444', redDim:     'rgba(239,68,68,0.09)',   redBorder:    'rgba(239,68,68,0.20)',
  amber:   '#f59e0b', amberDim:   'rgba(245,158,11,0.09)',  amberBorder:  'rgba(245,158,11,0.20)',
  green:   '#22d3a0', greenDim:   'rgba(34,211,160,0.09)',  greenBorder:  'rgba(34,211,160,0.20)',
  purple:  '#a78bfa', purpleDim:  'rgba(167,139,250,0.09)', purpleBorder: 'rgba(167,139,250,0.22)',
};
const mono = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };
const FONT = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";

/* ─── Post types ─────────────────────────────────────────────── */
const POST_TYPES = [
  { value: 'update',           icon: Megaphone,  label: 'Announcement',    color: D.blue,   dim: D.blueDim,   border: D.blueBorder,   placeholder: 'Share a gym update, news, or announcement with your members…' },
  { value: 'achievement',      icon: Trophy,     label: 'Achievement',      color: D.amber,  dim: D.amberDim,  border: D.amberBorder,  placeholder: 'Celebrate a milestone, record, or success story…' },
  { value: 'event',            icon: Calendar,   label: 'Event',            color: D.green,  dim: D.greenDim,  border: D.greenBorder,  placeholder: 'Tell members about an upcoming event or class…' },
  { value: 'offer',            icon: Gift,       label: 'Special Offer',    color: D.red,    dim: D.redDim,    border: D.redBorder,    placeholder: 'Share a promotion, discount, or special deal…' },
  { value: 'tip',              icon: Lightbulb,  label: 'Fitness Tip',      color: D.purple, dim: D.purpleDim, border: D.purpleBorder, placeholder: 'Share a workout tip, nutrition advice, or coaching insight…' },
  { value: 'member_spotlight', icon: Star,       label: 'Member Spotlight', color: D.amber,  dim: D.amberDim,  border: D.amberBorder,  placeholder: "Highlight an amazing member's progress or story…" },
];

/* ─── Character ring ─────────────────────────────────────────── */
function CharRing({ count, max = 500 }) {
  const pct = Math.min(100, (count / max) * 100);
  const r = 9, cf = 2 * Math.PI * r;
  const over = count > max;
  const color = over ? D.red : pct > 80 ? D.amber : D.blue;
  if (count === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <svg width={22} height={22} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={11} cy={11} r={r} fill="none" stroke={`${color}20`} strokeWidth="2"/>
        <circle cx={11} cy={11} r={r} fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={cf} strokeDashoffset={cf * (1 - pct / 100)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.2s ease' }}/>
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: over ? D.red : D.text3, ...mono }}>
        {over ? `-${count - max}` : max - count}
      </span>
    </div>
  );
}

/* ─── Live post preview ──────────────────────────────────────── */
const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';

function PostPreview({ postType, content, imageUrl, tags, callToAction, isPinned, scheduledDate, gym }) {
  const type = POST_TYPES.find(t => t.value === postType) || POST_TYPES[0];
  const empty = !content.trim() && !imageUrl;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Eye style={{ width: 11, height: 11, color: D.text3 }}/>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: D.text3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>

      {/* Post card */}
      <div style={{
        borderRadius: 10, overflow: 'hidden', position: 'relative',
        background: D.surface, border: `1px solid ${type.border}`,
        boxShadow: `0 0 0 1px ${type.dim}`,
      }}>
        {/* top accent line */}
        <div style={{ height: 2, background: `linear-gradient(90deg,${type.color},${type.color}55)`, width: '100%' }}/>

        {empty ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <type.icon style={{ width: 22, height: 22, color: `${type.color}40`, margin: '0 auto 8px', display: 'block' }}/>
            <div style={{ fontSize: 11.5, color: D.text3, fontWeight: 500 }}>Start typing to see your post preview</div>
          </div>
        ) : (
          <>
            {/* Post header */}
            <div style={{ padding: '13px 15px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: D.surfaceHigh, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${D.border}` }}>
                  {gym?.logo_url || gym?.image_url
                    ? <img src={gym.logo_url || gym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <span style={{ fontSize: 13, fontWeight: 800, color: D.text1 }}>{(gym?.name || 'G').charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: D.text1, lineHeight: 1.2 }}>{gym?.name || 'Your Gym'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 4, background: type.dim, border: `1px solid ${type.border}`, fontSize: 9, fontWeight: 700, color: type.color }}>
                      <type.icon style={{ width: 8, height: 8 }}/> {type.label}
                    </span>
                    <span style={{ fontSize: 9.5, color: D.text3 }}>
                      {scheduledDate ? `Scheduled · ${format(new Date(scheduledDate), 'MMM d')}` : 'Just now'}
                    </span>
                    {isPinned && <span style={{ fontSize: 9, fontWeight: 700, color: D.amber }}>📌</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '0 15px 12px' }}>
              <p style={{ fontSize: 12.5, color: D.text1, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</p>
            </div>

            {/* Image */}
            {imageUrl && (
              <div style={{ width: '100%', overflow: 'hidden', maxHeight: 180 }}>
                <img src={imageUrl} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block', maxHeight: 180 }}/>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div style={{ padding: '8px 15px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {tags.map((t, i) => (
                  <span key={i} style={{ fontSize: 9.5, fontWeight: 700, color: type.color, background: type.dim, border: `1px solid ${type.border}`, borderRadius: 4, padding: '2px 6px' }}>#{t}</span>
                ))}
              </div>
            )}

            {/* CTA */}
            {callToAction.enabled && callToAction.text && (
              <div style={{ margin: '0 15px 12px', padding: '8px 12px', borderRadius: 8, background: type.dim, border: `1px solid ${type.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: type.color }}>{callToAction.text}</span>
                <ArrowUpRight style={{ width: 11, height: 11, color: type.color }}/>
              </div>
            )}

            {/* Reaction bar */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '7px 11px', borderTop: `1px solid ${D.border}` }}>
              <img src={STREAK_ICON_URL} alt="react" style={{ width: 34, height: 34, objectFit: 'contain', opacity: 0.3 }}/>
              <Send style={{ width: 15, height: 15, color: D.text3, marginLeft: 6 }}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Toggle ─────────────────────────────────────────────────── */
function Toggle({ value, onChange, color = D.blue, label, sub }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
      borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
      background: value ? `${color}0d` : D.surfaceHigh,
      border: `1px solid ${value ? color + '28' : D.border}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: value ? D.text1 : D.text2, transition: 'color 0.15s' }}>{label}</div>
        {sub && <div style={{ fontSize: 9.5, color: D.text3, marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0, width: 36, height: 20, borderRadius: 99, background: value ? color : 'rgba(255,255,255,0.08)', transition: 'background 0.2s', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}/>
      </div>
    </div>
  );
}

/* ─── Field label ────────────────────────────────────────────── */
function FL({ children, required }) {
  return (
    <div style={{ fontSize: 9.5, fontWeight: 800, color: D.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
      {children}{required && <span style={{ color: D.red, fontSize: 9 }}>*</span>}
    </div>
  );
}

/* ─── Section divider ────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: 1, background: D.border, margin: '2px 0' }}/>;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN MODAL
═══════════════════════════════════════════════════════════════ */
export default function CreateGymOwnerPostModal({ open, onClose, gym, onSuccess }) {
  const [content,      setContent]      = useState('');
  const [imageUrl,     setImageUrl]     = useState('');
  const [postType,     setPostType]     = useState('update');
  const [tags,         setTags]         = useState([]);
  const [newTag,       setNewTag]       = useState('');
  const [isPinned,     setIsPinned]     = useState(false);
  const [scheduledDate,setScheduledDate]= useState('');
  const [callToAction, setCallToAction] = useState({ enabled: false, text: '', link: '' });
  const [submitting,   setSubmitting]   = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const fileRef = useRef();

  const activeType = POST_TYPES.find(t => t.value === postType) || POST_TYPES[0];
  const canSubmit  = content.trim().length > 0 && !submitting;

  const uploadMutation = useMutation({
    mutationFn: async (file) => { const r = await base44.integrations.Core.UploadFile({ file }); return r.file_url; },
    onSuccess: (url) => { setImageUrl(url); setUploading(false); },
    onError: ()     => { setUploading(false); },
  });

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };

  const addTag = () => {
    const t = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 8) { setTags([...tags, t]); setNewTag(''); }
  };

  const reset = () => {
    setContent(''); setImageUrl(''); setPostType('update'); setTags([]);
    setIsPinned(false); setScheduledDate(''); setCallToAction({ enabled: false, text: '', link: '' }); setNewTag('');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Post.create({
        member_id: user.id, member_name: gym.name,
        member_avatar: gym.logo_url || gym.image_url || null,
        gym_id: gym.id, gym_name: gym.name,
        content: content.trim(), image_url: imageUrl || null,
        likes: 0, comments: [], reactions: {},
        post_type: postType, tags, is_pinned: isPinned,
        scheduled_date: scheduledDate || null,
        call_to_action: callToAction.enabled && callToAction.text ? { text: callToAction.text, link: callToAction.link } : null,
      });
      onSuccess?.(); reset(); onClose();
    } catch (e) { console.error('Post creation failed:', e); }
    finally { setSubmitting(false); }
  };

  const handleClose = () => { reset(); onClose(); };
  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes modal-in  { from { opacity:0; transform:scale(0.97) translateY(6px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fade-in   { from { opacity:0; } to { opacity:1; } }
        @keyframes spin      { to { transform:rotate(360deg); } }
        .gp-ta {
          width:100%; box-sizing:border-box; padding:11px 13px; border-radius:8px;
          background:${D.surfaceHigh}; border:1px solid ${D.border};
          color:${D.text1}; font-size:12.5px; font-weight:500; line-height:1.65;
          outline:none; resize:none; font-family:${FONT}; transition:border-color 0.15s;
        }
        .gp-ta:focus { border-color:${D.blueBorder}; background:${D.surfaceMid}; }
        .gp-ta::placeholder { color:${D.text3}; }
        .gp-inp {
          width:100%; box-sizing:border-box; padding:9px 12px; border-radius:8px;
          background:${D.surfaceHigh}; border:1px solid ${D.border};
          color:${D.text1}; font-size:12px; font-weight:600; outline:none;
          font-family:${FONT}; transition:border-color 0.15s;
        }
        .gp-inp:focus { border-color:${D.blueBorder}; }
        .gp-inp::placeholder { color:${D.text3}; }
        .gp-type:hover { border-color:${D.borderMid} !important; }
        .gp-pub:not(:disabled):hover { opacity:0.9; transform:translateY(-1px); }
        .gp-cancel:hover { background:${D.surfaceHigh} !important; color:${D.text1} !important; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${D.border}; border-radius:2px; }
      `}</style>

      {/* Overlay */}
      <div
        onClick={e => e.target === e.currentTarget && handleClose()}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)',
          zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center',
          padding:20, animation:'fade-in 0.18s ease', fontFamily:FONT }}>

        {/* Modal shell */}
        <div style={{
          width:'100%', maxWidth:900, maxHeight:'92vh', display:'flex', flexDirection:'column',
          background:D.surface, border:`1px solid ${D.borderMid}`,
          borderRadius:12, overflow:'hidden',
          boxShadow:'0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
          animation:'modal-in 0.22s cubic-bezier(0.16,1,0.3,1)',
          WebkitFontSmoothing:'antialiased',
        }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <div style={{
            flexShrink:0, padding:'14px 20px', display:'flex', alignItems:'center',
            justifyContent:'space-between', borderBottom:`1px solid ${D.border}`,
            background:D.surfaceLow, position:'relative', overflow:'hidden',
          }}>
            {/* accent line */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
              background:`linear-gradient(90deg,${activeType.color},${activeType.color}44,transparent)`,
              transition:'background 0.3s' }}/>

            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:activeType.dim,
                border:`1px solid ${activeType.border}`, display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
                <activeType.icon style={{ width:15, height:15, color:activeType.color }}/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:D.text1, letterSpacing:'-0.02em' }}>New Post</div>
                <div style={{ fontSize:10.5, color:D.text3, marginTop:1 }}>{gym?.name}</div>
              </div>
            </div>

            <button onClick={handleClose} style={{
              width:30, height:30, borderRadius:7, display:'flex', alignItems:'center',
              justifyContent:'center', background:D.surfaceHigh, border:`1px solid ${D.border}`,
              cursor:'pointer', color:D.text3, transition:'all 0.15s',
            }}
              onMouseEnter={e=>{ e.currentTarget.style.background=D.borderMid; e.currentTarget.style.color=D.text1; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=D.surfaceHigh; e.currentTarget.style.color=D.text3; }}>
              <X style={{ width:13, height:13 }}/>
            </button>
          </div>

          {/* ── Body ────────────────────────────────────────────── */}
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 300px', minHeight:0, overflow:'hidden' }}>

            {/* Left — form */}
            <div style={{ padding:'18px 20px', borderRight:`1px solid ${D.border}`,
              display:'flex', flexDirection:'column', gap:18, overflowY:'auto' }}>

              {/* Post type grid */}
              <div>
                <FL>Post Type</FL>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                  {POST_TYPES.map(type => {
                    const active = postType === type.value;
                    return (
                      <button key={type.value} className="gp-type" onClick={() => setPostType(type.value)}
                        style={{ padding:'9px 10px', borderRadius:8, cursor:'pointer',
                          background:active ? type.dim : D.surfaceHigh,
                          border:`1px solid ${active ? type.border : D.border}`,
                          display:'flex', alignItems:'center', gap:7,
                          transition:'all 0.15s', fontFamily:FONT, textAlign:'left' }}>
                        <div style={{ width:22, height:22, borderRadius:6, background:`${type.color}18`,
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <type.icon style={{ width:10, height:10, color:type.color }}/>
                        </div>
                        <span style={{ fontSize:11, fontWeight:active?700:500,
                          color:active?D.text1:D.text2, transition:'color 0.15s', lineHeight:1.2 }}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Divider/>

              {/* Content */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                  <FL required>Content</FL>
                  <CharRing count={content.length} max={500}/>
                </div>
                <textarea className="gp-ta" rows={5} value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={activeType.placeholder}/>
              </div>

              <Divider/>

              {/* Image upload */}
              <div>
                <FL>Image</FL>
                {imageUrl ? (
                  <div style={{ position:'relative', borderRadius:8, overflow:'hidden' }}>
                    <img src={imageUrl} alt="Preview" style={{ width:'100%', maxHeight:160, objectFit:'cover', display:'block', borderRadius:8, border:`1px solid ${D.border}` }}/>
                    <button onClick={() => setImageUrl('')} style={{
                      position:'absolute', top:8, right:8, width:26, height:26, borderRadius:7,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      background:'rgba(0,0,0,0.65)', border:`1px solid ${D.borderMid}`, cursor:'pointer' }}>
                      <X style={{ width:10, height:10, color:'#fff' }}/>
                    </button>
                    <div style={{ position:'absolute', bottom:8, left:10, fontSize:9.5,
                      fontWeight:700, color:'rgba(255,255,255,0.6)' }}>Image attached</div>
                  </div>
                ) : (
                  <div
                    onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={()=>fileRef.current?.click()}
                    style={{ padding:'18px 14px', borderRadius:8,
                      border:`1.5px dashed ${dragOver ? activeType.color+'60' : D.border}`,
                      background: dragOver ? activeType.dim : D.surfaceHigh,
                      display:'flex', flexDirection:'column', alignItems:'center',
                      gap:7, cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:activeType.dim,
                      border:`1px solid ${activeType.border}`, display:'flex',
                      alignItems:'center', justifyContent:'center' }}>
                      {uploading
                        ? <div style={{ width:12, height:12, border:`2px solid ${activeType.color}30`,
                            borderTop:`2px solid ${activeType.color}`, borderRadius:'50%',
                            animation:'spin 0.8s linear infinite' }}/>
                        : <Upload style={{ width:12, height:12, color:activeType.color }}/>}
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:11.5, fontWeight:700, color:D.text2 }}>
                        {uploading ? 'Uploading…' : 'Drop image or click to browse'}
                      </div>
                      <div style={{ fontSize:9.5, color:D.text3, marginTop:2 }}>PNG, JPG up to 10MB</div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*"
                      onChange={e=>handleFile(e.target.files?.[0])} style={{ display:'none' }}/>
                  </div>
                )}
              </div>

              <Divider/>

              {/* Tags */}
              <div>
                <FL>Tags</FL>
                <div style={{ display:'flex', gap:7 }}>
                  <input className="gp-inp" style={{ flex:1 }} value={newTag}
                    onChange={e=>setNewTag(e.target.value)}
                    onKeyDown={e=>{ if (e.key==='Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="e.g. challenge, nutrition, event"/>
                  <button onClick={addTag} disabled={!newTag.trim() || tags.length >= 8}
                    style={{ flexShrink:0, width:36, height:36, borderRadius:8, display:'flex',
                      alignItems:'center', justifyContent:'center',
                      background:newTag.trim() ? activeType.dim : D.surfaceHigh,
                      border:`1px solid ${newTag.trim() ? activeType.border : D.border}`,
                      cursor:newTag.trim() ? 'pointer' : 'default', transition:'all 0.15s' }}>
                    <Tag style={{ width:12, height:12, color:newTag.trim() ? activeType.color : D.text3 }}/>
                  </button>
                </div>
                {tags.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
                    {tags.map((t, i) => (
                      <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4,
                        fontSize:10.5, fontWeight:700, padding:'3px 8px', borderRadius:6,
                        background:activeType.dim, border:`1px solid ${activeType.border}`,
                        color:activeType.color }}>
                        #{t}
                        <button onClick={()=>setTags(tags.filter(x=>x!==t))}
                          style={{ background:'none', border:'none', cursor:'pointer',
                            padding:0, display:'flex', alignItems:'center',
                            color:`${activeType.color}70`, lineHeight:1 }}>
                          <X style={{ width:8, height:8 }}/>
                        </button>
                      </span>
                    ))}
                    <span style={{ fontSize:9.5, color:D.text3, alignSelf:'center' }}>{tags.length}/8</span>
                  </div>
                )}
              </div>

              <Divider/>

              {/* Call to Action */}
              <div>
                <FL>Call to Action</FL>
                <Toggle value={callToAction.enabled}
                  onChange={v=>setCallToAction({...callToAction, enabled:v})}
                  color={activeType.color} label="Add a button to the post"
                  sub="Direct members to a link, booking page, or form"/>
                {callToAction.enabled && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                    <div>
                      <div style={{ fontSize:9.5, color:D.text3, fontWeight:600, marginBottom:5 }}>Button label</div>
                      <input className="gp-inp" value={callToAction.text}
                        onChange={e=>setCallToAction({...callToAction, text:e.target.value})}
                        placeholder="e.g. Book your spot"/>
                    </div>
                    <div>
                      <div style={{ fontSize:9.5, color:D.text3, fontWeight:600, marginBottom:5 }}>Destination URL</div>
                      <input className="gp-inp" value={callToAction.link}
                        onChange={e=>setCallToAction({...callToAction, link:e.target.value})}
                        placeholder="https://…"/>
                    </div>
                  </div>
                )}
              </div>

              <Divider/>

              {/* Options row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Toggle value={isPinned} onChange={setIsPinned} color={D.amber}
                  label="📌 Pin to top" sub="Keeps this post at the top of the feed"/>
                <div>
                  <FL>Schedule</FL>
                  <div style={{ position:'relative' }}>
                    <Clock style={{ position:'absolute', left:10, top:'50%',
                      transform:'translateY(-50%)', width:11, height:11,
                      color:D.text3, pointerEvents:'none' }}/>
                    <input type="datetime-local" className="gp-inp"
                      style={{ paddingLeft:28, colorScheme:'dark' }}
                      value={scheduledDate} onChange={e=>setScheduledDate(e.target.value)}/>
                  </div>
                  {scheduledDate && (
                    <div style={{ fontSize:9.5, color:D.amber, fontWeight:600, marginTop:5,
                      display:'flex', alignItems:'center', gap:4 }}>
                      <Clock style={{ width:9, height:9 }}/>
                      Scheduled for {format(new Date(scheduledDate), "MMM d 'at' h:mma")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right — live preview */}
            <div style={{ padding:'18px 16px', background:D.surfaceLow, overflowY:'auto' }}>
              <PostPreview
                postType={postType} content={content} imageUrl={imageUrl}
                tags={tags} callToAction={callToAction} isPinned={isPinned}
                scheduledDate={scheduledDate} gym={gym}/>
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────── */}
          <div style={{ flexShrink:0, padding:'12px 20px', borderTop:`1px solid ${D.border}`,
            display:'flex', alignItems:'center', gap:9, background:D.surfaceLow }}>

            {/* Status */}
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:7 }}>
              {content.trim() ? (
                <>
                  <CheckCircle style={{ width:12, height:12, color:D.green, flexShrink:0 }}/>
                  <span style={{ fontSize:10.5, color:D.text3, ...mono }}>
                    {content.length} chars · {activeType.label}
                    {isPinned ? ' · Pinned' : ''}
                    {tags.length > 0 ? ` · ${tags.length} tag${tags.length!==1?'s':''}` : ''}
                  </span>
                </>
              ) : (
                <span style={{ fontSize:10.5, color:D.text3 }}>Add content to publish</span>
              )}
            </div>

            {/* Cancel */}
            <button className="gp-cancel" onClick={handleClose} style={{
              padding:'9px 18px', borderRadius:8, background:D.surfaceHigh,
              color:D.text2, border:`1px solid ${D.border}`,
              fontSize:11.5, fontWeight:700, cursor:'pointer', fontFamily:FONT,
              transition:'all 0.15s' }}>
              Cancel
            </button>

            {/* Publish / Schedule */}
            <button className="gp-pub" onClick={handleSubmit} disabled={!canSubmit} style={{
              padding:'9px 22px', borderRadius:8, border:'none', fontFamily:FONT,
              background: canSubmit
                ? (scheduledDate
                    ? `linear-gradient(135deg,${D.amber},#d97706)`
                    : `linear-gradient(135deg,${D.blue},#0369a1)`)
                : D.surfaceHigh,
              color: canSubmit ? '#fff' : D.text3,
              fontSize:12, fontWeight:800, cursor:canSubmit?'pointer':'default',
              display:'flex', alignItems:'center', gap:6,
              transition:'all 0.2s', letterSpacing:'-0.01em', minWidth:148,
              justifyContent:'center',
              boxShadow: canSubmit ? `0 4px 14px ${scheduledDate ? D.amber : D.blue}40` : 'none',
            }}>
              {submitting
                ? <><div style={{ width:11, height:11, border:'2px solid rgba(255,255,255,0.3)',
                    borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Publishing…</>
                : scheduledDate
                  ? <><Calendar style={{ width:12, height:12 }}/> Schedule Post</>
                  : <><Zap style={{ width:12, height:12 }}/> Publish Now</>}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
