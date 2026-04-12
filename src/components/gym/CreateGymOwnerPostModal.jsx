/**
 * CreateGymOwnerPostModal — Forge Fitness design system
 * Cyan accent · DM Sans · #000 / #141416 / #222226
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  X, Upload, Tag, Calendar, Sparkles, CheckCircle, Pin,
  Megaphone, Trophy, Gift, Lightbulb, Star, Eye,
  Zap, Clock, Send, ArrowUpRight,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:       '#000000',
  surface:  '#141416',
  inset:    '#0f0f12',
  brd:      '#222226',
  brd2:     '#2a2a30',
  t1:       '#ffffff',
  t2:       '#8a8a94',
  t3:       '#444450',
  cyan:     '#00e5c8',
  cyanDim:  'rgba(0,229,200,0.08)',
  cyanBrd:  'rgba(0,229,200,0.22)',
  red:      '#ff4d6d',
  redDim:   'rgba(255,77,109,0.1)',
  redBrd:   'rgba(255,77,109,0.22)',
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,0.1)',
  amberBrd: 'rgba(245,158,11,0.22)',
  green:    '#22c55e',
  greenDim: 'rgba(34,197,94,0.1)',
  greenBrd: 'rgba(34,197,94,0.22)',
  blue:     '#60a5fa',
  blueDim:  'rgba(96,165,250,0.1)',
  blueBrd:  'rgba(96,165,250,0.22)',
  purple:   '#a78bfa',
  purpleDim:'rgba(167,139,250,0.1)',
  purpleBrd:'rgba(167,139,250,0.22)',
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";

/* ─── POST TYPES ─────────────────────────────────────────────── */
const POST_TYPES = [
  { value:'update',          icon:Megaphone, label:'Announcement',    color:C.cyan,   dim:C.cyanDim,   border:C.cyanBrd,   placeholder:'Share a gym update, news, or announcement with your members…' },
  { value:'achievement',     icon:Trophy,    label:'Achievement',     color:C.amber,  dim:C.amberDim,  border:C.amberBrd,  placeholder:'Celebrate a milestone, record, or success story…' },
  { value:'event',           icon:Calendar,  label:'Event',           color:C.green,  dim:C.greenDim,  border:C.greenBrd,  placeholder:'Tell members about an upcoming event or class…' },
  { value:'offer',           icon:Gift,      label:'Special Offer',   color:C.red,    dim:C.redDim,    border:C.redBrd,    placeholder:'Share a promotion, discount, or special deal…' },
  { value:'tip',             icon:Lightbulb, label:'Fitness Tip',     color:C.purple, dim:C.purpleDim, border:C.purpleBrd, placeholder:'Share a workout tip, nutrition advice, or coaching insight…' },
  { value:'member_spotlight',icon:Star,      label:'Member Spotlight',color:C.blue,   dim:C.blueDim,   border:C.blueBrd,   placeholder:"Highlight an amazing member's progress or story…" },
];

/* ─── CHARACTER RING ─────────────────────────────────────────── */
function CharRing({ count, max = 500 }) {
  const pct = Math.min(100, (count / max) * 100);
  const r = 9, cf = 2 * Math.PI * r;
  const over = count > max;
  const color = over ? C.red : pct > 80 ? C.amber : C.cyan;
  if (count === 0) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
      <svg width={22} height={22} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
        <circle cx={11} cy={11} r={r} fill="none" stroke={`${color}20`} strokeWidth="2"/>
        <circle cx={11} cy={11} r={r} fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={cf} strokeDashoffset={cf * (1 - pct / 100)} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 0.2s ease, stroke 0.2s ease' }}/>
      </svg>
      <span style={{ fontSize:10, fontWeight:700, color: over ? C.red : C.t3, fontVariantNumeric:'tabular-nums' }}>
        {over ? `-${count - max}` : max - count}
      </span>
    </div>
  );
}

/* ─── LIVE PREVIEW ───────────────────────────────────────────── */
function PostPreview({ postType, content, imageUrl, tags, callToAction, isPinned, scheduledDate, gym }) {
  const type = POST_TYPES.find(t => t.value === postType) || POST_TYPES[0];
  const empty = !content.trim() && !imageUrl;
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
        <Eye size={11} color={C.t3}/>
        <span style={{ fontSize:9.5, fontWeight:600, color:C.t3, textTransform:'uppercase', letterSpacing:'0.09em' }}>Live Preview</span>
      </div>

      <div style={{ borderRadius:10, overflow:'hidden', background:C.inset, border:`1px solid ${type.border}` }}>
        {/* Type accent bar */}
        <div style={{ height:2, background:`linear-gradient(90deg,${type.color},${type.color}44,transparent)` }}/>

        {empty ? (
          <div style={{ padding:'32px 18px', textAlign:'center' }}>
            <type.icon size={22} color={`${type.color}40`} style={{ margin:'0 auto 8px', display:'block' }}/>
            <div style={{ fontSize:11.5, color:C.t3, fontWeight:500 }}>Start typing to see your post preview</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding:'13px 15px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:C.surface, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${C.brd}` }}>
                  {gym?.logo_url || gym?.image_url
                    ? <img src={gym.logo_url || gym.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <span style={{ fontSize:13, fontWeight:800, color:C.t1 }}>{(gym?.name || 'G').charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:700, color:C.t1, lineHeight:1.2 }}>{gym?.name || 'Your Gym'}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'1px 6px', borderRadius:4, background:type.dim, border:`1px solid ${type.border}`, fontSize:9, fontWeight:700, color:type.color }}>
                      <type.icon size={8}/> {type.label}
                    </span>
                    <span style={{ fontSize:9.5, color:C.t3 }}>
                      {scheduledDate ? `Scheduled · ${format(new Date(scheduledDate), 'MMM d')}` : 'Just now'}
                    </span>
                    {isPinned && <span style={{ fontSize:9, color:C.amber }}>📌</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding:'0 15px 12px' }}>
              <p style={{ fontSize:12.5, color:C.t1, lineHeight:1.65, margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{content}</p>
            </div>

            {/* Image */}
            {imageUrl && (
              <div style={{ width:'100%', overflow:'hidden', maxHeight:180 }}>
                <img src={imageUrl} alt="" style={{ width:'100%', objectFit:'cover', display:'block', maxHeight:180 }}/>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div style={{ padding:'8px 15px', display:'flex', flexWrap:'wrap', gap:5 }}>
                {tags.map((t,i) => (
                  <span key={i} style={{ fontSize:9.5, fontWeight:700, color:type.color, background:type.dim, border:`1px solid ${type.border}`, borderRadius:4, padding:'2px 6px' }}>#{t}</span>
                ))}
              </div>
            )}

            {/* CTA */}
            {callToAction.enabled && callToAction.text && (
              <div style={{ margin:'0 15px 12px', padding:'8px 12px', borderRadius:8, background:type.dim, border:`1px solid ${type.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:11.5, fontWeight:700, color:type.color }}>{callToAction.text}</span>
                <ArrowUpRight size={11} color={type.color}/>
              </div>
            )}

            {/* Reaction bar */}
            <div style={{ display:'flex', alignItems:'center', padding:'8px 13px', borderTop:`1px solid ${C.brd}`, gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, display:'flex', alignItems:'center', justifyContent:'center', opacity:0.4 }}>
                <span style={{ fontSize:11 }}>🔥</span>
              </div>
              <Send size={13} color={C.t3}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── TOGGLE ─────────────────────────────────────────────────── */
function Toggle({ value, onChange, color = C.cyan, label, sub }) {
  return (
    <div onClick={() => onChange(!value)} style={{
      display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
      borderRadius:8, cursor:'pointer', transition:'all 0.15s',
      background: value ? `${color}10` : 'rgba(255,255,255,0.03)',
      border:`1px solid ${value ? color + '30' : C.brd}`,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:11.5, fontWeight:600, color: value ? C.t1 : C.t2, transition:'color 0.15s' }}>{label}</div>
        {sub && <div style={{ fontSize:9.5, color:C.t3, marginTop:1 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink:0, width:36, height:20, borderRadius:99, background: value ? color : 'rgba(255,255,255,0.08)', transition:'background 0.2s', position:'relative' }}>
        <div style={{ position:'absolute', top:2, left: value ? 18 : 2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.5)' }}/>
      </div>
    </div>
  );
}

/* ─── FIELD LABEL ────────────────────────────────────────────── */
function FL({ children, required }) {
  return (
    <div style={{ fontSize:9.5, fontWeight:600, color:C.t3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:7, display:'flex', alignItems:'center', gap:4 }}>
      {children}{required && <span style={{ color:C.red, fontSize:9 }}>*</span>}
    </div>
  );
}

function Divider() {
  return <div style={{ height:1, background:C.brd, margin:'2px 0' }}/>;
}

/* ─── MAIN MODAL ─────────────────────────────────────────────── */
export default function CreateGymOwnerPostModal({ open, onClose, gym, onSuccess }) {
  const [content,       setContent]       = useState('');
  const [imageUrl,      setImageUrl]      = useState('');
  const [postType,      setPostType]      = useState('update');
  const [tags,          setTags]          = useState([]);
  const [newTag,        setNewTag]        = useState('');
  const [isPinned,      setIsPinned]      = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [callToAction,  setCallToAction]  = useState({ enabled:false, text:'', link:'' });
  const [submitting,    setSubmitting]    = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [dragOver,      setDragOver]      = useState(false);
  const fileRef = useRef();

  const activeType = POST_TYPES.find(t => t.value === postType) || POST_TYPES[0];
  const canSubmit  = content.trim().length > 0 && !submitting;

  const uploadMutation = useMutation({
    mutationFn: async (file) => { const r = await base44.integrations.Core.UploadFile({ file }); return r.file_url; },
    onSuccess: (url) => { setImageUrl(url); setUploading(false); },
    onError:   ()    => { setUploading(false); },
  });

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };

  const addTag = () => {
    const t = newTag.trim().toLowerCase().replace(/\s+/g,'-');
    if (t && !tags.includes(t) && tags.length < 8) { setTags([...tags, t]); setNewTag(''); }
  };

  const reset = () => {
    setContent(''); setImageUrl(''); setPostType('update'); setTags([]);
    setIsPinned(false); setScheduledDate(''); setCallToAction({ enabled:false, text:'', link:'' }); setNewTag('');
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.Post.create({
        member_id:user.id, member_name:gym.name,
        member_avatar:gym.logo_url || gym.image_url || null,
        gym_id:gym.id, gym_name:gym.name,
        content:content.trim(), image_url:imageUrl || null,
        likes:0, comments:[], reactions:{},
        post_type:postType, tags, is_pinned:isPinned,
        scheduled_date:scheduledDate || null,
        call_to_action:callToAction.enabled && callToAction.text ? { text:callToAction.text, link:callToAction.link } : null,
      });
      onSuccess?.(); reset(); onClose();
    } catch(e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleClose = () => { reset(); onClose(); };
  if (!open) return null;

  const isScheduled = !!scheduledDate;

  return (
    <>
      <style>{`
        @keyframes modal-in { from{opacity:0;transform:scale(0.97) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        .ff-ta {
          width:100%; box-sizing:border-box; padding:10px 12px; border-radius:8px;
          background:rgba(255,255,255,0.03); border:1px solid ${C.brd};
          color:${C.t1}; font-size:12.5px; font-weight:400; line-height:1.65;
          outline:none; resize:none; font-family:${FONT}; transition:border-color 0.15s;
        }
        .ff-ta:focus { border-color:${C.cyanBrd}; background:rgba(0,229,200,0.03); }
        .ff-ta::placeholder { color:${C.t3}; }
        .ff-inp {
          width:100%; box-sizing:border-box; padding:8px 11px; border-radius:8px;
          background:rgba(255,255,255,0.03); border:1px solid ${C.brd};
          color:${C.t1}; font-size:12px; font-weight:500; outline:none;
          font-family:${FONT}; transition:border-color 0.15s;
        }
        .ff-inp:focus { border-color:${C.cyanBrd}; }
        .ff-inp::placeholder { color:${C.t3}; }
        .ff-type-btn:hover { border-color:${C.brd2} !important; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${C.brd}; border-radius:2px; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={e => e.target === e.currentTarget && handleClose()}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(6px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20, animation:'fade-in 0.15s ease', fontFamily:FONT }}>

        {/* Shell */}
        <div style={{
          width:'100%', maxWidth:920, maxHeight:'92vh', display:'flex', flexDirection:'column',
          background:C.surface, border:`1px solid ${C.brd}`,
          borderRadius:12, overflow:'hidden',
          boxShadow:'0 32px 80px rgba(0,0,0,0.7)',
          animation:'modal-in 0.22s cubic-bezier(0.16,1,0.3,1)',
          WebkitFontSmoothing:'antialiased',
        }}>

          {/* ── HEADER ─────────────────────────────────────────── */}
          <div style={{ flexShrink:0, padding:'13px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${C.brd}`, background:C.inset, position:'relative', overflow:'hidden' }}>
            {/* Accent line */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${activeType.color},${activeType.color}44,transparent)`, transition:'background 0.3s' }}/>

            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:8, background:activeType.dim, border:`1px solid ${activeType.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
                <activeType.icon size={14} color={activeType.color}/>
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.t1, letterSpacing:'-0.02em' }}>New Post</div>
                <div style={{ fontSize:10.5, color:C.t2, marginTop:1 }}>{gym?.name || 'Your Gym'}</div>
              </div>
            </div>

            <button onClick={handleClose} style={{ width:28, height:28, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.04)', border:`1px solid ${C.brd}`, cursor:'pointer', color:C.t3, transition:'all 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color=C.t1; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color=C.t3; }}>
              <X size={12}/>
            </button>
          </div>

          {/* ── BODY ───────────────────────────────────────────── */}
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 290px', minHeight:0, overflow:'hidden' }}>

            {/* Left — form */}
            <div style={{ padding:'16px 18px', borderRight:`1px solid ${C.brd}`, display:'flex', flexDirection:'column', gap:16, overflowY:'auto' }}>

              {/* Post type grid */}
              <div>
                <FL>Post Type</FL>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                  {POST_TYPES.map(type => {
                    const active = postType === type.value;
                    return (
                      <button key={type.value} className="ff-type-btn" onClick={() => setPostType(type.value)} style={{
                        padding:'9px 10px', borderRadius:8, cursor:'pointer',
                        background: active ? type.dim : 'rgba(255,255,255,0.03)',
                        border:`1px solid ${active ? type.border : C.brd}`,
                        display:'flex', alignItems:'center', gap:7,
                        transition:'all 0.15s', fontFamily:FONT, textAlign:'left',
                      }}>
                        <div style={{ width:22, height:22, borderRadius:6, background:`${type.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <type.icon size={10} color={type.color}/>
                        </div>
                        <span style={{ fontSize:11, fontWeight:active?600:400, color:active?C.t1:C.t2, transition:'color 0.15s', lineHeight:1.2 }}>{type.label}</span>
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
                <textarea className="ff-ta" rows={5} value={content} onChange={e=>setContent(e.target.value)} placeholder={activeType.placeholder}/>
              </div>

              <Divider/>

              {/* Image */}
              <div>
                <FL>Image</FL>
                {imageUrl ? (
                  <div style={{ position:'relative', borderRadius:8, overflow:'hidden' }}>
                    <img src={imageUrl} alt="Preview" style={{ width:'100%', maxHeight:150, objectFit:'cover', display:'block', borderRadius:8, border:`1px solid ${C.brd}` }}/>
                    <button onClick={()=>setImageUrl('')} style={{ position:'absolute', top:8, right:8, width:24, height:24, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.7)', border:`1px solid ${C.brd}`, cursor:'pointer' }}>
                      <X size={9} color="#fff"/>
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
                    onDragLeave={()=>setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={()=>fileRef.current?.click()}
                    style={{ padding:'16px 14px', borderRadius:8, border:`1.5px dashed ${dragOver ? activeType.color+'55' : C.brd}`, background: dragOver ? activeType.dim : 'rgba(255,255,255,0.02)', display:'flex', flexDirection:'column', alignItems:'center', gap:7, cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:activeType.dim, border:`1px solid ${activeType.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {uploading
                        ? <div style={{ width:12, height:12, border:`2px solid ${activeType.color}30`, borderTop:`2px solid ${activeType.color}`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                        : <Upload size={12} color={activeType.color}/>}
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:11.5, fontWeight:600, color:C.t2 }}>{uploading ? 'Uploading…' : 'Drop image or click to browse'}</div>
                      <div style={{ fontSize:9.5, color:C.t3, marginTop:2 }}>PNG, JPG up to 10MB</div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={e=>handleFile(e.target.files?.[0])} style={{ display:'none' }}/>
                  </div>
                )}
              </div>

              <Divider/>

              {/* Tags */}
              <div>
                <FL>Tags</FL>
                <div style={{ display:'flex', gap:7 }}>
                  <input className="ff-inp" style={{ flex:1 }} value={newTag} onChange={e=>setNewTag(e.target.value)}
                    onKeyDown={e=>{ if (e.key==='Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="e.g. challenge, nutrition, event"/>
                  <button onClick={addTag} disabled={!newTag.trim() || tags.length >= 8} style={{
                    flexShrink:0, width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                    background: newTag.trim() ? activeType.dim : 'rgba(255,255,255,0.03)',
                    border:`1px solid ${newTag.trim() ? activeType.border : C.brd}`,
                    cursor:newTag.trim() ? 'pointer' : 'default', transition:'all 0.15s',
                  }}>
                    <Tag size={12} color={newTag.trim() ? activeType.color : C.t3}/>
                  </button>
                </div>
                {tags.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
                    {tags.map((t,i) => (
                      <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:600, padding:'3px 8px', borderRadius:6, background:activeType.dim, border:`1px solid ${activeType.border}`, color:activeType.color }}>
                        #{t}
                        <button onClick={()=>setTags(tags.filter(x=>x!==t))} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', color:`${activeType.color}70`, lineHeight:1 }}>
                          <X size={8}/>
                        </button>
                      </span>
                    ))}
                    <span style={{ fontSize:9.5, color:C.t3, alignSelf:'center' }}>{tags.length}/8</span>
                  </div>
                )}
              </div>

              <Divider/>

              {/* Call to Action */}
              <div>
                <FL>Call to Action</FL>
                <Toggle value={callToAction.enabled} onChange={v=>setCallToAction({...callToAction,enabled:v})} color={activeType.color} label="Add a button to the post" sub="Direct members to a link, booking page, or form"/>
                {callToAction.enabled && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
                    <div>
                      <div style={{ fontSize:9.5, color:C.t3, fontWeight:600, marginBottom:5 }}>Button label</div>
                      <input className="ff-inp" value={callToAction.text} onChange={e=>setCallToAction({...callToAction,text:e.target.value})} placeholder="e.g. Book your spot"/>
                    </div>
                    <div>
                      <div style={{ fontSize:9.5, color:C.t3, fontWeight:600, marginBottom:5 }}>Destination URL</div>
                      <input className="ff-inp" value={callToAction.link} onChange={e=>setCallToAction({...callToAction,link:e.target.value})} placeholder="https://…"/>
                    </div>
                  </div>
                )}
              </div>

              <Divider/>

              {/* Options row */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <Toggle value={isPinned} onChange={setIsPinned} color={C.amber} label="📌 Pin to top" sub="Keeps this post at the top of the feed"/>
                <div>
                  <FL>Schedule</FL>
                  <div style={{ position:'relative' }}>
                    <Clock size={11} color={C.t3} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                    <input type="datetime-local" className="ff-inp" style={{ paddingLeft:28, colorScheme:'dark' }} value={scheduledDate} onChange={e=>setScheduledDate(e.target.value)}/>
                  </div>
                  {scheduledDate && (
                    <div style={{ fontSize:9.5, color:C.amber, fontWeight:600, marginTop:5, display:'flex', alignItems:'center', gap:4 }}>
                      <Clock size={9} color={C.amber}/>
                      Scheduled for {format(new Date(scheduledDate), "MMM d 'at' h:mma")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right — live preview */}
            <div style={{ padding:'16px 14px', background:C.inset, overflowY:'auto', borderLeft:`1px solid ${C.brd}` }}>
              <PostPreview postType={postType} content={content} imageUrl={imageUrl} tags={tags} callToAction={callToAction} isPinned={isPinned} scheduledDate={scheduledDate} gym={gym}/>
            </div>
          </div>

          {/* ── FOOTER ─────────────────────────────────────────── */}
          <div style={{ flexShrink:0, padding:'11px 18px', borderTop:`1px solid ${C.brd}`, display:'flex', alignItems:'center', gap:8, background:C.inset }}>
            {/* Status */}
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:6 }}>
              {content.trim() ? (
                <>
                  <CheckCircle size={11} color={C.green}/>
                  <span style={{ fontSize:10.5, color:C.t3, fontVariantNumeric:'tabular-nums' }}>
                    {content.length} chars · {activeType.label}
                    {isPinned ? ' · Pinned' : ''}
                    {tags.length > 0 ? ` · ${tags.length} tag${tags.length!==1?'s':''}` : ''}
                  </span>
                </>
              ) : (
                <span style={{ fontSize:10.5, color:C.t3 }}>Add content to publish</span>
              )}
            </div>

            {/* Cancel */}
            <button onClick={handleClose} style={{ padding:'8px 16px', borderRadius:8, background:'rgba(255,255,255,0.04)', color:C.t2, border:`1px solid ${C.brd}`, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:FONT, transition:'all 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color=C.t1; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color=C.t2; }}>
              Cancel
            </button>

            {/* Publish / Schedule */}
            <button onClick={handleSubmit} disabled={!canSubmit} style={{
              padding:'8px 22px', borderRadius:8, border:'none', fontFamily:FONT,
              background: canSubmit
                ? (isScheduled ? C.amber : C.cyan)
                : 'rgba(255,255,255,0.06)',
              color: canSubmit ? '#000' : C.t3,
              fontSize:12.5, fontWeight:700, cursor:canSubmit?'pointer':'default',
              display:'flex', alignItems:'center', gap:6,
              transition:'all 0.2s', letterSpacing:'-0.01em', minWidth:150,
              justifyContent:'center',
              boxShadow: canSubmit ? `0 0 20px ${isScheduled ? C.amber : C.cyan}35` : 'none',
              opacity: canSubmit ? 1 : 0.5,
            }}>
              {submitting
                ? <><div style={{ width:11, height:11, border:'2px solid rgba(0,0,0,0.3)', borderTop:'2px solid #000', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Publishing…</>
                : isScheduled
                  ? <><Calendar size={12}/> Schedule Post</>
                  : <><Zap size={12}/> Publish Now</>}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
