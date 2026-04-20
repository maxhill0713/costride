/**
 * CreateGymOwnerPostModal — Content Hub design system
 * Mobile-first responsive: adapts on ≤768px, desktop layout unchanged.
 * Blue #60a5fa · DM Sans · #0d0d11 bg / #17171c surface / #1f1f26 card
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, Tag, Calendar, CheckCircle, Pin,
  Megaphone, Trophy, Gift, Lightbulb, Star, Eye,
  Zap, Clock, Send, ArrowUpRight, ChevronDown, Image as ImageIcon,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:        '#0d0d11', surface:   '#17171c', card:      '#1f1f26', inset:     '#13131a',
  brd:       '#252530', brd2:      '#2e2e3a', brdHover:  '#3a3a48',
  t1:        '#ffffff', t2:        '#9898a6', t3:        '#525260',
  cyan:      '#60a5fa', cyanDim:   'rgba(96,165,250,0.07)',   cyanBrd:   'rgba(96,165,250,0.18)',   cyanSolid: '#60a5fa',
  red:       '#ff4d6d', redDim:    'rgba(255,77,109,0.08)',  redBrd:    'rgba(255,77,109,0.20)',
  amber:     '#f59e0b', amberDim:  'rgba(245,158,11,0.08)',  amberBrd:  'rgba(245,158,11,0.20)',
  green:     '#22c55e', greenDim:  'rgba(34,197,94,0.08)',   greenBrd:  'rgba(34,197,94,0.20)',
  blue:      '#60a5fa', blueDim:   'rgba(96,165,250,0.08)',  blueBrd:   'rgba(96,165,250,0.20)',
  purple:    '#a78bfa', purpleDim: 'rgba(167,139,250,0.08)', purpleBrd: 'rgba(167,139,250,0.20)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";
const MONO = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' };

/* ─── POST TYPES ─────────────────────────────────────────────── */
const POST_TYPES = [
  { value: 'update',           Icon: Megaphone,  label: 'Announcement',     color: C.blue,   dim: C.blueDim,   border: C.blueBrd,   placeholder: 'Share a gym update, news, or announcement with your members…'  },
  { value: 'achievement',      Icon: Trophy,     label: 'Achievement',      color: C.amber,  dim: C.amberDim,  border: C.amberBrd,  placeholder: 'Celebrate a milestone, record, or success story…'              },
  { value: 'event',            Icon: Calendar,   label: 'Event',            color: C.green,  dim: C.greenDim,  border: C.greenBrd,  placeholder: 'Tell members about an upcoming event or class…'                 },
  { value: 'offer',            Icon: Gift,       label: 'Special Offer',    color: C.red,    dim: C.redDim,    border: C.redBrd,    placeholder: 'Share a promotion, discount, or special deal…'                  },
  { value: 'tip',              Icon: Lightbulb,  label: 'Fitness Tip',      color: C.purple, dim: C.purpleDim, border: C.purpleBrd, placeholder: 'Share a workout tip, nutrition advice, or coaching insight…'    },
  { value: 'member_spotlight', Icon: Star,       label: 'Member Spotlight', color: C.blue,   dim: C.blueDim,   border: C.blueBrd,   placeholder: "Highlight an amazing member's progress or story…"              },
];

/* ─── CHARACTER RING ─────────────────────────────────────────── */
function CharRing({ count, max = 500 }) {
  const pct = Math.min(100, (count / max) * 100);
  const r = 9, cf = 2 * Math.PI * r;
  const over = count > max;
  const color = over ? C.red : pct > 80 ? C.amber : C.blue;
  if (count === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <svg width={22} height={22} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={11} cy={11} r={r} fill="none" stroke={`${color}18`} strokeWidth="2" />
        <circle cx={11} cy={11} r={r} fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={cf} strokeDashoffset={cf * (1 - pct / 100)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.2s ease' }} />
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: over ? C.red : C.t3, ...MONO }}>
        {over ? `-${count - max}` : max - count}
      </span>
    </div>
  );
}

/* ─── SECTION LABEL ──────────────────────────────────────────── */
function SL({ children, required, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 4 }}>
        {children}{required && <span style={{ color: C.red, fontSize: 9 }}>*</span>}
      </div>
      {right}
    </div>
  );
}

/* ─── TOGGLE ─────────────────────────────────────────────────── */
function Toggle({ value, onChange, color = C.blue, label, sub }) {
  return (
    <div onClick={() => onChange(!value)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 9, cursor: 'pointer', background: value ? `${color}09` : C.card, border: `1px solid ${value ? color + '28' : C.brd}`, transition: 'all 0.18s' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: value ? C.t1 : C.t2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0, width: 38, height: 21, borderRadius: 99, background: value ? color : C.brd2, transition: 'background 0.2s', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 2.5, left: value ? 19 : 2.5, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.6)' }} />
      </div>
    </div>
  );
}

/* ─── LIVE PREVIEW ───────────────────────────────────────────── */
function PostPreview({ postType, content, imageUrl, tags, callToAction, isPinned, scheduledDate, gym }) {
  const type  = POST_TYPES.find(t => t.value === postType) || POST_TYPES[0];
  const empty = !content.trim() && !imageUrl;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Eye size={11} color={C.t3} />
        <span style={{ fontSize: 9.5, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Live Preview</span>
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden', background: C.card, border: `1px solid ${C.brd}` }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${type.color}, ${type.color}55, transparent)` }} />
        {empty ? (
          <div style={{ padding: '32px 18px', textAlign: 'center' }}>
            <type.Icon size={22} color={`${type.color}35`} style={{ margin: '0 auto 10px', display: 'block' }} />
            <div style={{ fontSize: 11.5, color: C.t3, fontWeight: 500 }}>Start typing to see your post</div>
          </div>
        ) : (
          <>
            <div style={{ padding: '13px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.surface, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.brd}` }}>
                  {gym?.logo_url || gym?.image_url
                    ? <img src={gym.logo_url || gym.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>{(gym?.name || 'G').charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1, lineHeight: 1.2 }}>{gym?.name || 'Your Gym'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 7px', borderRadius: 5, background: type.dim, border: `1px solid ${type.border}`, fontSize: 9, fontWeight: 700, color: type.color }}>
                      <type.Icon size={8} /> {type.label}
                    </span>
                    <span style={{ fontSize: 9.5, color: C.t3 }}>
                      {scheduledDate ? `Scheduled · ${format(new Date(scheduledDate), 'MMM d')}` : 'Just now'}
                    </span>
                    {isPinned && <span style={{ fontSize: 10, color: C.amber }}>📌</span>}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ padding: '0 14px 12px' }}>
              <p style={{ fontSize: 12.5, color: C.t1, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</p>
            </div>
            {imageUrl && (
              <div style={{ width: '100%', overflow: 'hidden', maxHeight: 170 }}>
                <img src={imageUrl} alt="" style={{ width: '100%', objectFit: 'cover', display: 'block', maxHeight: 170 }} />
              </div>
            )}
            {tags.length > 0 && (
              <div style={{ padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {tags.map((t, i) => (
                  <span key={i} style={{ fontSize: 9.5, fontWeight: 700, color: type.color, background: type.dim, border: `1px solid ${type.border}`, borderRadius: 5, padding: '2px 7px' }}>#{t}</span>
                ))}
              </div>
            )}
            {callToAction.enabled && callToAction.text && (
              <div style={{ margin: '0 14px 12px', padding: '9px 12px', borderRadius: 9, background: type.dim, border: `1px solid ${type.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: type.color }}>{callToAction.text}</span>
                <ArrowUpRight size={11} color={type.color} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderTop: `1px solid ${C.brd}`, gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                <span style={{ fontSize: 11 }}>🔥</span>
              </div>
              <Send size={12} color={C.t3} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN MODAL
═══════════════════════════════════════════════════════════════ */
export default function CreateGymOwnerPostModal({ open, onClose, gym, onSuccess }) {
  const [content,       setContent]       = useState('');
  const [imageUrl,      setImageUrl]      = useState('');
  const [postType,      setPostType]      = useState('update');
  const [tags,          setTags]          = useState([]);
  const [newTag,        setNewTag]        = useState('');
  const [isPinned,      setIsPinned]      = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [callToAction,  setCallToAction]  = useState({ enabled: false, text: '', link: '' });
  const [submitting,    setSubmitting]    = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [dragOver,      setDragOver]      = useState(false);
  const [showPreview,   setShowPreview]   = useState(false);
  const fileRef = useRef();

  /* ── Mobile detection ──────────────────────────────────────── */
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const activeType  = POST_TYPES.find(t => t.value === postType) || POST_TYPES[0];
  const canSubmit   = content.trim().length > 0 && !submitting;
  const isScheduled = !!scheduledDate;

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
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleClose = () => { reset(); onClose(); };
  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes modal-in { from{opacity:0;transform:scale(0.975) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes slide-up { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in  { from{opacity:0} to{opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }

        .ch-ta {
          width:100%; box-sizing:border-box; padding:11px 13px; border-radius:9px;
          background:${C.card}; border:1px solid ${C.brd}; color:${C.t1};
          font-size:13px; line-height:1.7; outline:none; resize:none; font-family:${FONT};
          transition:border-color 0.15s, background 0.15s;
        }
        .ch-ta:focus { border-color:${C.cyanBrd}; background:${C.inset}; }
        .ch-ta::placeholder { color:${C.t3}; }

        .ch-inp {
          width:100%; box-sizing:border-box; padding:9px 12px; border-radius:9px;
          background:${C.card}; border:1px solid ${C.brd}; color:${C.t1};
          font-size:12.5px; outline:none; font-family:${FONT}; transition:border-color 0.15s;
        }
        .ch-inp:focus { border-color:${C.cyanBrd}; }
        .ch-inp::placeholder { color:${C.t3}; }

        .ch-tab-active { color:${C.t1} !important; font-weight:700 !important; border-bottom:2px solid ${C.blue} !important; }
        .ch-tab {
          padding:8px 12px; cursor:pointer; font-size:12.5px; color:${C.t2};
          font-weight:500; background:none; border:none; border-bottom:2px solid transparent;
          font-family:${FONT}; transition:color 0.15s; white-space:nowrap;
        }
        .ch-tab:hover { color:${C.t1}; }

        .ch-cta-btn {
          padding:9px 22px; border-radius:8px; border:none; background:${C.blue}; color:#fff;
          font-size:13px; font-weight:700; cursor:pointer; font-family:${FONT}; letter-spacing:-0.01em;
          display:inline-flex; align-items:center; gap:7px; transition:opacity 0.15s, box-shadow 0.15s;
        }
        .ch-cta-btn:hover { opacity:0.88; }
        .ch-cta-btn:disabled { background:${C.brd2}; color:${C.t3}; cursor:default; box-shadow:none; }
        .ch-cta-btn.schedule { background:${C.amber}; color:#000; }

        .ch-cancel {
          padding:9px 18px; border-radius:8px; background:transparent; border:1px solid ${C.brd};
          color:${C.t2}; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FONT}; transition:all 0.15s;
        }
        .ch-cancel:hover { border-color:${C.brdHover}; color:${C.t1}; background:${C.card}; }

        ::-webkit-scrollbar        { width:3px; }
        ::-webkit-scrollbar-track  { background:transparent; }
        ::-webkit-scrollbar-thumb  { background:${C.brd2}; border-radius:2px; }

        @media (max-width: 768px) {
          .ch-tab { padding:8px 9px; font-size:11.5px; }
          .ch-ta  { font-size:16px; }
          .ch-inp { font-size:16px; }
        }
      `}</style>

      {/* ── Backdrop ──────────────────────────────────────────── */}
      <div
        onClick={e => e.target === e.currentTarget && handleClose()}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex',
          alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center',
          padding: isMobile ? 0 : 20,
          animation: 'fade-in 0.15s ease', fontFamily: FONT,
        }}
      >

        {/* ── Shell ─────────────────────────────────────────── */}
        <div style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 960,
          maxHeight: isMobile ? '96vh' : '92vh',
          height: isMobile ? '96vh' : 'auto',
          display: 'flex', flexDirection: 'column',
          background: C.bg, border: isMobile ? 'none' : `1px solid ${C.brd}`,
          borderRadius: isMobile ? '20px 20px 0 0' : 14,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(96,165,250,0.05)',
          animation: isMobile ? 'slide-up 0.3s cubic-bezier(0.32,0.72,0,1)' : 'modal-in 0.24s cubic-bezier(0.16,1,0.3,1)',
          WebkitFontSmoothing: 'antialiased',
        }}>

          {/* ── HEADER ──────────────────────────────────────── */}
          <div style={{
            flexShrink: 0, padding: isMobile ? '0 16px' : '0 20px',
            background: C.surface, borderBottom: `1px solid ${C.brd}`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Drag handle on mobile */}
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: C.brd2 }} />
              </div>
            )}

            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: isMobile ? 4 : 16, paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 11 }}>
                <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 9, background: activeType.dim, border: `1px solid ${activeType.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  <activeType.Icon size={isMobile ? 12 : 14} color={activeType.color} />
                </div>
                <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  New Post
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Mobile: preview toggle */}
                {isMobile && (
                  <button
                    onClick={() => setShowPreview(v => !v)}
                    style={{
                      height: 30, padding: '0 10px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5,
                      background: showPreview ? C.cyanDim : 'transparent',
                      border: `1px solid ${showPreview ? C.cyanBrd : C.brd}`,
                      cursor: 'pointer', color: showPreview ? C.blue : C.t3, fontSize: 11, fontWeight: 600, fontFamily: FONT,
                    }}
                  >
                    <Eye size={11} /> {showPreview ? 'Edit' : 'Preview'}
                  </button>
                )}
                <button
                  onClick={handleClose}
                  style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.t1; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.t3; }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', marginTop: 8, gap: 0, marginLeft: -2, overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {POST_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setPostType(type.value)}
                  className={`ch-tab ${postType === type.value ? 'ch-tab-active' : ''}`}
                  style={{ borderBottomColor: postType === type.value ? type.color : 'transparent' }}
                >
                  {isMobile ? type.label.split(' ')[0] : type.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── BODY ────────────────────────────────────────── */}
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
            minHeight: 0,
            overflow: 'hidden',
          }}>

            {/* ── FORM ── */}
            {(!isMobile || !showPreview) && (
              <div style={{
                padding: isMobile ? '16px 16px' : '18px 20px',
                borderRight: isMobile ? 'none' : `1px solid ${C.brd}`,
                display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 18,
                overflowY: 'auto', background: C.bg,
                WebkitOverflowScrolling: 'touch',
              }}>

                {/* Content */}
                <div>
                  <SL required right={<CharRing count={content.length} max={500} />}>Content</SL>
                  <textarea
                    className="ch-ta"
                    rows={isMobile ? 5 : 6}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={activeType.placeholder}
                  />
                </div>

                {/* Image upload */}
                <div>
                  <SL>Media</SL>
                  {imageUrl ? (
                    <div style={{ position: 'relative', borderRadius: 9, overflow: 'hidden' }}>
                      <img src={imageUrl} alt="Preview" style={{ width: '100%', maxHeight: 155, objectFit: 'cover', display: 'block', borderRadius: 9, border: `1px solid ${C.brd}` }} />
                      <button onClick={() => setImageUrl('')} style={{ position: 'absolute', top: 9, right: 9, width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,13,17,0.82)', border: `1px solid ${C.brd}`, cursor: 'pointer' }}>
                        <X size={10} color={C.t1} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      style={{ padding: '20px 14px', borderRadius: 9, border: `1.5px dashed ${dragOver ? activeType.color + '60' : C.brd2}`, background: dragOver ? activeType.dim : C.card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: 'pointer', transition: 'all 0.18s' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: activeType.dim, border: `1px solid ${activeType.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {uploading
                          ? <div style={{ width: 14, height: 14, border: `2px solid ${activeType.color}25`, borderTop: `2px solid ${activeType.color}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          : <ImageIcon size={14} color={activeType.color} />}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>{uploading ? 'Uploading…' : 'Drop image or click to browse'}</div>
                        <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>PNG, JPG, WEBP · up to 10 MB</div>
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} style={{ display: 'none' }} />
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <SL>Tags <span style={{ fontSize: 9, color: C.t3, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({tags.length}/8)</span></SL>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <input
                      className="ch-inp"
                      style={{ flex: 1 }}
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="e.g. challenge, nutrition, event"
                    />
                    <button
                      onClick={addTag}
                      disabled={!newTag.trim() || tags.length >= 8}
                      style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: newTag.trim() ? activeType.dim : 'transparent', border: `1px solid ${newTag.trim() ? activeType.border : C.brd}`, cursor: newTag.trim() ? 'pointer' : 'default', transition: 'all 0.15s' }}
                    >
                      <Tag size={13} color={newTag.trim() ? activeType.color : C.t3} />
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 9 }}>
                      {tags.map((t, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: activeType.dim, border: `1px solid ${activeType.border}`, color: activeType.color }}>
                          #{t}
                          <button onClick={() => setTags(tags.filter(x => x !== t))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: `${activeType.color}60`, lineHeight: 1 }}>
                            <X size={8} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Call to Action */}
                <div>
                  <SL>Call to Action</SL>
                  <Toggle
                    value={callToAction.enabled}
                    onChange={v => setCallToAction({ ...callToAction, enabled: v })}
                    color={activeType.color}
                    label="Add a button to the post"
                    sub="Direct members to a booking page, link or form"
                  />
                  {callToAction.enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 9, marginTop: 9 }}>
                      <div>
                        <div style={{ fontSize: 10, color: C.t3, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Button label</div>
                        <input className="ch-inp" value={callToAction.text} onChange={e => setCallToAction({ ...callToAction, text: e.target.value })} placeholder="e.g. Book your spot" />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: C.t3, fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Destination URL</div>
                        <input className="ch-inp" value={callToAction.link} onChange={e => setCallToAction({ ...callToAction, link: e.target.value })} placeholder="https://…" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pin + Schedule */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 10 }}>
                  <Toggle value={isPinned} onChange={setIsPinned} color={C.amber} label="📌 Pin to top" sub="Stays at the top of the member feed" />
                  <div>
                    <SL>Schedule</SL>
                    <div style={{ position: 'relative' }}>
                      <Clock size={11} color={C.t3} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input type="datetime-local" className="ch-inp" style={{ paddingLeft: 30, colorScheme: 'dark' }} value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                    </div>
                    {scheduledDate && (
                      <div style={{ fontSize: 10, color: C.amber, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={9} color={C.amber} />
                        {format(new Date(scheduledDate), "MMM d 'at' h:mma")}
                      </div>
                    )}
                  </div>
                </div>

                {isMobile && <div style={{ height: 8 }} />}
              </div>
            )}

            {/* ── PREVIEW panel ─────────────────────────────── */}
            {(!isMobile || showPreview) && (
              <div style={{
                padding: isMobile ? '16px 16px' : '18px 16px',
                background: C.surface, overflowY: 'auto',
                borderLeft: isMobile ? 'none' : `1px solid ${C.brd}`,
                WebkitOverflowScrolling: 'touch',
              }}>
                <PostPreview
                  postType={postType} content={content} imageUrl={imageUrl} tags={tags}
                  callToAction={callToAction} isPinned={isPinned} scheduledDate={scheduledDate} gym={gym}
                />
              </div>
            )}
          </div>

          {/* ── FOOTER ──────────────────────────────────────── */}
          <div style={{
            flexShrink: 0,
            padding: isMobile ? '12px 16px' : '12px 20px',
            borderTop: `1px solid ${C.brd}`,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? 8 : 10,
            background: C.surface,
          }}>
            {/* Status */}
            <div style={{ flex: 1, display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 6 }}>
              {content.trim() ? (
                <>
                  <CheckCircle size={11} color={C.green} />
                  <span style={{ fontSize: 10.5, color: C.t3, ...MONO }}>
                    {content.length} chars · {activeType.label}
                    {isPinned ? ' · Pinned' : ''}
                    {tags.length > 0 ? ` · ${tags.length} tag${tags.length !== 1 ? 's' : ''}` : ''}
                    {isScheduled ? ` · Scheduled` : ''}
                  </span>
                </>
              ) : (
                <span style={{ fontSize: 10.5, color: C.t3 }}>Add content to publish your post</span>
              )}
            </div>

            {isMobile && content.trim() && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={11} color={C.green} />
                <span style={{ fontSize: 10.5, color: C.t3 }}>
                  {content.length} chars · {activeType.label}
                  {isScheduled ? ' · Scheduled' : ''}
                </span>
              </div>
            )}

            {isMobile ? (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`ch-cta-btn${isScheduled ? ' schedule' : ''}`}
                  style={{
                    width: '100%', justifyContent: 'center', height: 50, fontSize: 15,
                    opacity: canSubmit ? 1 : 0.38, cursor: canSubmit ? 'pointer' : 'default',
                    boxShadow: canSubmit ? `0 0 24px ${isScheduled ? C.amber : C.blue}40` : 'none',
                    borderRadius: 12,
                  }}
                >
                  {submitting
                    ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Publishing…</>
                    : isScheduled
                      ? <><Calendar size={15} /> Schedule Post</>
                      : <><Zap size={15} /> Review & Publish</>}
                </button>
                <button onClick={handleClose} style={{ background: 'none', border: 'none', color: C.t3, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, padding: '6px 0', textAlign: 'center' }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={handleClose} className="ch-cancel">Cancel</button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`ch-cta-btn${isScheduled ? ' schedule' : ''}`}
                  style={{ opacity: canSubmit ? 1 : 0.38, cursor: canSubmit ? 'pointer' : 'default', boxShadow: canSubmit ? `0 0 24px ${isScheduled ? C.amber : C.blue}40` : 'none', minWidth: 160, justifyContent: 'center' }}
                >
                  {submitting
                    ? <><div style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Publishing…</>
                    : isScheduled
                      ? <><Calendar size={13} /> Schedule Post</>
                      : <><Zap size={13} /> Review & Schedule</>}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
}