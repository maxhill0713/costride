import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';
const STREAK_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';

// ─── Canvas helpers ───────────────────────────────────────────────────────────
async function loadImage(src) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() { resolve(img); };
    img.onerror = function() { resolve(null); };
    img.src = src;
  });
}
function canvasToBlob(canvas) {
  return new Promise(function(res, rej) {
    canvas.toBlob(function(b) { return b ? res(b) : rej(new Error('toBlob failed')); }, 'image/png');
  });
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
function getAuthorStreakVariant(post) {
  if (post.reactions && post.member_id && post.reactions[post.member_id]) {
    return post.reactions[post.member_id];
  }
  return post.streak_variant || 'default';
}

function getPostStreak(post) {
  return post.streak_count ?? post.member_streak ?? post.streak ?? null;
}

function getCleanCaption(post) {
  if (!post.content) return null;
  const lines = post.content.split('\n').filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (t.length <= 3 && t.codePointAt(0) > 255) return false;
    if (t.includes('Just finished')) return false;
    if (/[0-9]+\s*[xX]\s*[0-9]+/.test(t)) return false;
    if (/[0-9]+(kg|lbs)/i.test(t)) return false;
    return true;
  });
  return lines.join(' ').trim() || null;
}

// ─── Canvas: shared background + brand ───────────────────────────────────────
async function drawBase(ctx, W, H, post) {
  const PAD = 72;
  if (post.image_url) {
    const img = await loadImage(post.image_url);
    if (img) {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      ctx.drawImage(img,
        (W - img.naturalWidth * s) / 2,
        (H - img.naturalHeight * s) / 2,
        img.naturalWidth * s, img.naturalHeight * s);
    }
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0,    'rgba(0,0,0,0.28)');
    g.addColorStop(0.12, 'rgba(0,0,0,0.0)');
    g.addColorStop(0.58, 'rgba(0,0,0,0.0)');
    g.addColorStop(0.74, 'rgba(0,0,0,0.72)');
    g.addColorStop(1,    'rgba(0,0,0,0.96)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0a0d16'); g.addColorStop(0.5, '#111827'); g.addColorStop(1, '#0d1320');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  const logo = await loadImage(LOGO_URL);
  const logoSz = 60, fontSz = 54;
  if (logo) {
    ctx.save(); ctx.beginPath();
    ctx.roundRect(PAD, 136 - logoSz + Math.round(logoSz * 0.14), logoSz, logoSz, Math.round(logoSz * 0.22));
    ctx.clip(); ctx.drawImage(logo, PAD, 136 - logoSz + Math.round(logoSz * 0.14), logoSz, logoSz);
    ctx.restore();
  }
  ctx.font = `800 ${fontSz}px -apple-system,sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 14;
  ctx.fillText('CoStride', PAD + logoSz + 16, 136); ctx.shadowBlur = 0;
}

function drawBottomBlock(ctx, W, H, post) {
  const PAD = 72;
  const bottomY = H - 160;
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  ctx.font = '500 28px -apple-system,sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.textAlign = 'left';
  ctx.fillText(dateStr.toUpperCase(), PAD, bottomY + 36);

  const dividerY = bottomY - 28;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, dividerY); ctx.lineTo(W - PAD, dividerY); ctx.stroke();

  const caption = getCleanCaption(post);
  if (caption) {
    const capFontSize = 88;
    ctx.font = `900 ${capFontSize}px -apple-system,sans-serif`;
    const maxW = W - PAD * 2;
    const words = caption.split(' ');
    let line1 = '', line2 = '';
    let onLine2 = false;
    for (const word of words) {
      const test = onLine2 ? line2 + (line2 ? ' ' : '') + word : line1 + (line1 ? ' ' : '') + word;
      if (!onLine2 && ctx.measureText(test).width > maxW) {
        onLine2 = true; line2 = word;
      } else if (onLine2) {
        const test2 = line2 + (line2 ? ' ' : '') + word;
        if (ctx.measureText(test2).width > maxW) { line2 = line2 + '…'; break; }
        line2 = test2;
      } else { line1 = test; }
    }
    const lineH = Math.round(capFontSize * 1.15);
    const numLines = line2 ? 2 : 1;
    const textTop = dividerY - 36 - numLines * lineH;
    ctx.fillStyle = 'white'; ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 28;
    ctx.fillText(line1, PAD, textTop + lineH);
    if (line2) ctx.fillText(line2, PAD, textTop + lineH * 2);
    ctx.shadowBlur = 0;
  } else {
    ctx.font = `900 96px -apple-system,sans-serif`;
    ctx.fillStyle = 'white'; ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 28;
    ctx.fillText(dateStr, PAD, dividerY - 52);
    ctx.shadowBlur = 0;
  }
}

async function drawCleanCard(post) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  await drawBase(ctx, W, H, post);
  drawBottomBlock(ctx, W, H, post);
  return canvas;
}

async function drawStreakCard(post) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  await drawBase(ctx, W, H, post);

  const streakNum = getPostStreak(post) ?? post.member_current_streak ?? post.current_streak ?? 0;
  const streakVariant = getAuthorStreakVariant(post);
  const streakIcon = await loadImage(STREAK_ICON_URL);
  const PAD = 72;

  const iconSz = 120;
  const numFontSz = 100;
  const gap = 8;

  // Measure number width first so we can right-align the whole group
  ctx.font = `900 ${numFontSz}px -apple-system,sans-serif`;
  const numW = ctx.measureText(String(streakNum)).width;
  const totalW = iconSz + gap + numW;
  const iconX = W - PAD - totalW;
  const iconY = 52;

  if (streakIcon) {
    ctx.save();
    ctx.drawImage(streakIcon, iconX, iconY, iconSz, iconSz);
    if (streakVariant === 'sunglasses') {
      const cx1 = iconX + iconSz * 0.31, cy1 = iconY + iconSz * 0.375;
      const cx2 = iconX + iconSz * 0.69, cy2 = iconY + iconSz * 0.375;
      const r = iconSz * 0.094;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = iconSz * 0.024;
      ctx.beginPath(); ctx.arc(cx1, cy1, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx1 + r, cy1); ctx.lineTo(cx2 - r, cy2); ctx.stroke();
    }
    ctx.restore();
  }

  // Number: to the right of the icon, vertically centred on it
  ctx.font = `900 ${numFontSz}px -apple-system,sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'white';
  ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 20;
  const numX = iconX + iconSz + gap;
  const numY = iconY + iconSz / 2 + numFontSz * 0.36;
  ctx.fillText(String(streakNum), numX, numY);
  ctx.shadowBlur = 0;

  drawBottomBlock(ctx, W, H, post);
  return canvas;
}

// ─── React Preview components ─────────────────────────────────────────────────
function CardShell({ post, children }) {
  return (
    <div style={{ width: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden', borderRadius: 16, background: '#0a0d16', fontFamily: "'SF Pro Display',-apple-system,sans-serif" }}>
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.26) 0%,rgba(0,0,0,0) 12%,rgba(0,0,0,0) 58%,rgba(0,0,0,0.74) 74%,rgba(0,0,0,0.96) 100%)' }} />
      </>) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0a0d16,#111827,#0d1320)' }} />
      )}
      {children}
    </div>
  );
}

function CardBrand() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px 11px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
      <img src={LOGO_URL} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
      <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>CoStride</span>
    </div>
  );
}

function CardBottom({ post }) {
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const caption = getCleanCaption(post);
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 11px 18px' }}>
      {caption && (
        <div style={{ color: 'white', fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.08, textShadow: '0 2px 16px rgba(0,0,0,0.7)', marginBottom: 7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{caption}</div>
      )}
      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.14)', marginBottom: 5 }} />
      <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 6.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{dateStr}</div>
    </div>
  );
}

function CleanPreview({ post }) {
  return (
    <CardShell post={post}>
      <CardBrand />
      <CardBottom post={post} />
    </CardShell>
  );
}

function StreakPreview({ post }) {
  const streakNum = getPostStreak(post) ?? post.member_current_streak ?? post.current_streak ?? 0;
  const streakVariant = getAuthorStreakVariant(post);
  return (
    <CardShell post={post}>
      <CardBrand />
      {/* Top right: icon + number side by side, with enough left margin so number fits inside card */}
      <div style={{ position: 'absolute', top: 6, right: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img
            src={STREAK_ICON_URL}
            alt="streak"
            style={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))' }}
          />
          {streakVariant === 'sunglasses' && (
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 64 64">
              <circle cx="20" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
              <circle cx="44" cy="24" r="6" fill="none" stroke="black" strokeWidth="1.5" />
              <line x1="26" y1="24" x2="38" y2="24" stroke="black" strokeWidth="1.5" />
            </svg>
          )}
        </div>
        <span style={{
          fontSize: 14,
          fontWeight: 900,
          color: '#ffffff',
          textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(0,0,0,0.9)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          flexShrink: 0,
        }}>
          {streakNum}
        </span>
      </div>
      <CardBottom post={post} />
    </CardShell>
  );
}

// ─── Share helpers ────────────────────────────────────────────────────────────
async function shareImageNative(blob, post) {
  const name = 'costride-post.png';
  const file = new File([blob], name, { type: 'image/png' });
  const shareData = { files: [file], text: 'Check this out on CoStride 💪' };
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    await navigator.share(shareData);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url); toast.success('Image saved!');
  }
}

const APP_BUTTONS = [
  { id: 'instagram_story', label: 'Instagram\nStory', action: shareImageNative, icon: (<svg viewBox="0 0 60 60" width="60" height="60"><defs><radialGradient id="psig1" cx="30%" cy="107%" r="120%"><stop offset="0%" stopColor="#ffd600"/><stop offset="50%" stopColor="#ff6f00"/><stop offset="100%" stopColor="#ff6f00" stopOpacity="0"/></radialGradient><radialGradient id="psig2" cx="10%" cy="100%" r="100%"><stop offset="0%" stopColor="#ff4081"/><stop offset="60%" stopColor="#ff4081" stopOpacity="0"/></radialGradient><linearGradient id="psig3" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ff6f00" stopOpacity="0"/><stop offset="40%" stopColor="#e040fb"/><stop offset="100%" stopColor="#7c4dff"/></linearGradient></defs><rect width="60" height="60" rx="14" fill="#000"/><rect width="60" height="60" rx="14" fill="url(#psig1)"/><rect width="60" height="60" rx="14" fill="url(#psig2)"/><rect width="60" height="60" rx="14" fill="url(#psig3)"/><rect x="14" y="14" width="32" height="32" rx="8" fill="none" stroke="white" strokeWidth="3"/><circle cx="30" cy="30" r="8" fill="none" stroke="white" strokeWidth="3"/><circle cx="41.5" cy="18.5" r="2.5" fill="white"/></svg>) },
  { id: 'whatsapp', label: 'WhatsApp', action: shareImageNative, icon: (<svg viewBox="0 0 60 60" width="60" height="60"><rect width="60" height="60" rx="14" fill="#25D366"/><path d="M30 13C20.6 13 13 20.6 13 30c0 3.7 1.2 7.1 3.2 9.9L14 46l6.4-2.1C23 45.5 26.4 47 30 47c9.4 0 17-7.6 17-17S39.4 13 30 13zm8.9 23.8c-.4 1.1-2.3 2.1-3.2 2.2-.8.1-1.8.2-2.9-.2-.7-.2-1.6-.5-2.7-1-4.7-2.1-7.8-6.9-8-7.2-.2-.3-1.9-2.5-1.9-4.8s1.2-3.4 1.6-3.9c.4-.5.9-.6 1.2-.6h.9c.3 0 .7-.1 1 .8.4.9 1.3 3.2 1.4 3.4.1.2.2.5 0 .8-.2.3-.2.5-.4.8-.2.3-.4.6-.6.8-.2.2-.4.5-.2.9.3.5 1.1 1.9 2.4 3 1.7 1.5 3 2 3.5 2.2.5.2.7.2 1-.1.3-.3 1.1-1.3 1.4-1.7.3-.5.6-.4 1-.2.4.2 2.6 1.2 3.1 1.4.5.2.8.3.9.5.1.2.1 1.1-.3 2.2z" fill="white"/></svg>) },
  { id: 'messages', label: 'Message', action: shareImageNative, icon: (<svg viewBox="0 0 60 60" width="60" height="60"><defs><linearGradient id="psmsg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#5BF75B"/><stop offset="100%" stopColor="#27C227"/></linearGradient></defs><rect width="60" height="60" rx="14" fill="url(#psmsg)"/><path d="M30 14C20.6 14 13 20.6 13 28.5c0 4.3 2 8.2 5.2 10.9L17 46l6.5-3.2c2 .7 4.2 1.2 6.5 1.2 9.4 0 17-6.5 17-14.5S39.4 14 30 14z" fill="white"/></svg>) },
  { id: 'snapchat', label: 'Snapchat', action: shareImageNative, icon: (<svg viewBox="0 0 60 60" width="60" height="60"><rect width="60" height="60" rx="14" fill="#FFFC00"/><path d="M30 13c-5.5 0-10 4.5-10 10v1.5c-1 .2-2.5.8-2.5 2 0 1 .8 1.8 1.9 2-.5 1.4-1.4 3-3.3 3.9-.7.3-1 1-.7 1.7.5 1.2 2.4 1.6 3.9 1.7.2.5.3 1.2.8 1.5.3.2.8 0 1.5-.2.9-.3 2.1-.7 3.4-.7s2.5.4 3.4.7c.7.2 1.2.4 1.5.2.5-.3.6-1 .8-1.5 1.5-.1 3.4-.5 3.9-1.7.3-.7 0-1.4-.7-1.7-1.9-.9-2.8-2.5-3.3-3.9 1.1-.2 1.9-.9 1.9-2 0-1.2-1.5-1.8-2.5-2V23c0-5.5-4.5-10-10-10z" fill="black"/></svg>) },
  { id: 'more', label: 'More', action: shareImageNative, icon: (<svg viewBox="0 0 60 60" width="60" height="60"><rect width="60" height="60" rx="14" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/><circle cx="18" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/><circle cx="30" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/><circle cx="42" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/></svg>) },
];

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function PostShareModal({ open, onClose, post }) {
  const [activeCard, setActiveCard] = useState(0);
  const [loadingId, setLoadingId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(function() { if (open) { setActiveCard(0); } }, [open]);

  const cards = [
    { label: 'Streak', drawFn: drawStreakCard,  node: <StreakPreview post={post || {}} /> },
    { label: 'Clean',  drawFn: drawCleanCard,  node: <CleanPreview  post={post || {}} /> },
  ];

  const getCanvas = useCallback(function() {
    return cards[activeCard].drawFn(post);
  }, [activeCard, post]);

  const handleBtn = useCallback(async function(btn) {
    if (loadingId) { return; }
    setLoadingId(btn.id);
    try {
      const canvas = await getCanvas();
      const blob = await canvasToBlob(canvas);
      await btn.action(blob, post);
    } catch(e) {
      if (e && e.name !== 'AbortError') { console.error(e); toast.error('Could not share'); }
    } finally { setLoadingId(null); }
  }, [loadingId, getCanvas, post]);

  const handleSave = useCallback(async function() {
    if (loadingId) { return; }
    setLoadingId('save');
    try {
      const canvas = await getCanvas();
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'costride-post.png'; a.click();
      URL.revokeObjectURL(url); toast.success('Saved!');
    } catch(e) { console.error(e); toast.error('Could not save'); }
    finally { setLoadingId(null); }
  }, [loadingId, getCanvas]);

  const handleTouchStart = useCallback(function(e) {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(false); setDragOffset(0);
  }, []);

  const handleTouchMove = useCallback(function(e) {
    if (touchStartXRef.current === null) { return; }
    const dx = e.touches[0].clientX - touchStartXRef.current;
    const dy = Math.abs(e.touches[0].clientY - (touchStartYRef.current || 0));
    if (Math.abs(dx) > dy && Math.abs(dx) > 5) {
      setIsDragging(true);
      const atStart = activeCard === 0 && dx > 0;
      const atEnd = activeCard === cards.length - 1 && dx < 0;
      setDragOffset(dx * ((atStart || atEnd) ? 0.25 : 1));
      e.preventDefault();
    }
  }, [activeCard, cards.length]);

  const handleTouchEnd = useCallback(function(e) {
    if (touchStartXRef.current === null) { return; }
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = Math.abs(e.changedTouches[0].clientY - (touchStartYRef.current || 0));
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy) {
      if (dx < 0 && activeCard < cards.length - 1) { setActiveCard(v => v + 1); }
      else if (dx > 0 && activeCard > 0) { setActiveCard(v => v - 1); }
    }
    touchStartXRef.current = null; touchStartYRef.current = null;
    setIsDragging(false); setDragOffset(0);
  }, [activeCard, cards.length]);

  if (!open || !post) { return null; }

  const cardWidthPercent = 100 / cards.length;
  const baseTranslate = -(activeCard * cardWidthPercent);
  const containerWidth = containerRef.current ? containerRef.current.offsetWidth : 220;
  const dragPercent = (dragOffset / (containerWidth * cards.length)) * 100;
  const translateX = isDragging ? (baseTranslate + dragPercent) + '%' : baseTranslate + '%';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10011, maxHeight: 'calc(100dvh - 80px)', display: 'flex', flexDirection: 'column', background: 'rgba(10,10,18,0.98)', borderTop: '1px solid rgba(255,255,255,0.09)', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 'max(env(safe-area-inset-bottom,0px),12px)', fontFamily: "'SF Pro Display',-apple-system,sans-serif", overflow: 'hidden' }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.22)' }} />
            </div>

            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px 18px 8px', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>Share Post</span>
            </div>

            {/* Card carousel */}
            <div style={{ padding: '0 18px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  ref={containerRef}
                  style={{ width: 'min(57.2vw, 242px)', flexShrink: 0, overflow: 'hidden', borderRadius: 14, touchAction: 'pan-y', boxShadow: '0 0 0 1px rgba(255,255,255,0.10), 0 16px 40px rgba(0,0,0,0.6)' }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div style={{
                    display: 'flex',
                    width: (cards.length * 100) + '%',
                    transform: 'translateX(' + translateX + ')',
                    transition: isDragging ? 'none' : 'transform 0.36s cubic-bezier(0.25,0.46,0.45,0.94)',
                    willChange: 'transform',
                  }}>
                    {cards.map(function(card, i) {
                      return (
                        <div key={i} style={{ width: (100 / cards.length) + '%', flexShrink: 0 }}>
                          {card.node}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Dot indicators */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, flexShrink: 0 }}>
              {cards.map(function(_, i) {
                return (
                  <button key={i} onClick={function() { setActiveCard(i); }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                    <div style={{ width: activeCard === i ? 18 : 6, height: 6, borderRadius: 3, background: activeCard === i ? 'white' : 'rgba(255,255,255,0.18)', transition: 'all 0.24s cubic-bezier(0.34,1.56,0.64,1)' }} />
                  </button>
                );
              })}
            </div>

            {/* Card label */}
            <div style={{ textAlign: 'center', marginTop: 4, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em', flexShrink: 0 }}>
              {cards[activeCard].label}
            </div>

            {/* Share to */}
            <div style={{ padding: '12px 18px 0', flexShrink: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px 0' }}>Share to</p>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                {APP_BUTTONS.map(function(btn) {
                  return (
                    <button key={btn.id} onClick={function() { handleBtn(btn); }} disabled={!!loadingId}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: loadingId ? 'default' : 'pointer', opacity: loadingId && loadingId !== btn.id ? 0.28 : 1, flexShrink: 0, padding: 0, transition: 'opacity 0.15s' }}>
                      <div style={{ position: 'relative', width: 60, height: 60 }}>
                        {loadingId === btn.id
                          ? <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.18)', borderTopColor: 'white', borderRadius: '50%', animation: 'ps-spin 0.65s linear infinite' }} />
                            </div>
                          : btn.icon}
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.58)', fontSize: 10, fontWeight: 600, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2, maxWidth: 64 }}>{btn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save button */}
            <div style={{ padding: '10px 18px 0', flexShrink: 0 }}>
              <button onClick={handleSave} disabled={!!loadingId}
                style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: loadingId === 'save' ? 'rgba(255,255,255,0.28)' : 'white', fontSize: 14, fontWeight: 700, cursor: loadingId ? 'default' : 'pointer', transition: 'all 0.15s', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                {loadingId === 'save' ? 'Saving...' : 'Save Image'}
              </button>
            </div>
          </motion.div>

          <style>{'@keyframes ps-spin { to { transform: rotate(360deg) } }'}</style>
        </>
      )}
    </AnimatePresence>
  );
}