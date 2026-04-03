import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

async function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
  });
}

// Simplified post card: CoStride logo top-centre, photo fills middle, date bottom-centre
async function drawPostCard(post) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  if (post.image_url) {
    const img = await loadImage(post.image_url);
    if (img) {
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
      ctx.drawImage(img, (W - sw) / 2, (H - sh) / 2, sw, sh);
    }
    // Gradient: dark top for logo, clear mid, dark bottom for date
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.70)');
    grad.addColorStop(0.20, 'rgba(0,0,0,0.15)');
    grad.addColorStop(0.75, 'rgba(0,0,0,0.15)');
    grad.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0d1117');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  const PAD = 72;

  // TOP: CoStride logo + wordmark centred
  const logo = await loadImage(LOGO_URL);
  const logoSize = 80;
  const wordmark = 'CoStride';
  ctx.font = '900 64px -apple-system, sans-serif';
  const wmWidth = ctx.measureText(wordmark).width;
  const totalBrandW = logoSize + 20 + wmWidth;
  const logoX = (W - totalBrandW) / 2;
  const brandY = 140;

  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(logoX, brandY - logoSize + 16, logoSize, logoSize, 18);
    ctx.clip();
    ctx.drawImage(logo, logoX, brandY - logoSize + 16, logoSize, logoSize);
    ctx.restore();
  }
  ctx.font = '900 64px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 14;
  ctx.fillText(wordmark, logoX + logoSize + 20, brandY);
  ctx.shadowBlur = 0;

  // BOTTOM: date centred
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.font = '600 44px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 10;
  ctx.fillText(dateStr, W / 2, H - 100);
  ctx.shadowBlur = 0;

  return canvas;
}

// ─── React Preview ────────────────────────────────────────────────────────────
function PostCardPreview({ post }) {
  const dateStr = new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      width: '100%', aspectRatio: '9/16', position: 'relative', overflow: 'hidden',
      borderRadius: 16, background: '#0a0a0f',
      fontFamily: "'SF Pro Display',-apple-system,sans-serif"
    }}>
      {/* Background */}
      {post.image_url ? (<>
        <img src={post.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.08) 20%,rgba(0,0,0,0.08) 72%,rgba(0,0,0,0.70) 100%)' }} />
      </>) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 100%)' }} />
      )}

      {/* TOP: CoStride logo + wordmark centred */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
        <img src={LOGO_URL} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
        <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: 900, textShadow: '0 1px 6px rgba(0,0,0,0.8)', letterSpacing: '-0.02em' }}>CoStride</span>
      </div>

      {/* BOTTOM: date centred */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 12px 14px', textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9.5, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.7)', letterSpacing: '0.02em' }}>{dateStr}</div>
      </div>
    </div>
  );
}

// ─── Share buttons same as WorkoutShareModal ──────────────────────────────────
const APP_BUTTONS = [
  {
    id: 'instagram_story',
    label: 'Instagram\nStory',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <defs>
          <radialGradient id="ps-ig1" cx="30%" cy="107%" r="120%">
            <stop offset="0%" stopColor="#ffd600"/>
            <stop offset="50%" stopColor="#ff6f00"/>
            <stop offset="100%" stopColor="#ff6f00" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="ps-ig2" cx="10%" cy="100%" r="100%">
            <stop offset="0%" stopColor="#ff4081"/>
            <stop offset="60%" stopColor="#ff4081" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="ps-ig3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6f00" stopOpacity="0"/>
            <stop offset="40%" stopColor="#e040fb"/>
            <stop offset="100%" stopColor="#7c4dff"/>
          </linearGradient>
        </defs>
        <rect width="60" height="60" rx="14" fill="#000"/>
        <rect width="60" height="60" rx="14" fill="url(#ps-ig1)"/>
        <rect width="60" height="60" rx="14" fill="url(#ps-ig2)"/>
        <rect width="60" height="60" rx="14" fill="url(#ps-ig3)"/>
        <rect x="14" y="14" width="32" height="32" rx="8" fill="none" stroke="white" strokeWidth="3"/>
        <circle cx="30" cy="30" r="8" fill="none" stroke="white" strokeWidth="3"/>
        <circle cx="41.5" cy="18.5" r="2.5" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <rect width="60" height="60" rx="14" fill="#25D366"/>
        <path d="M30 13C20.6 13 13 20.6 13 30c0 3.7 1.2 7.1 3.2 9.9L14 46l6.4-2.1C23 45.5 26.4 47 30 47c9.4 0 17-7.6 17-17S39.4 13 30 13zm8.9 23.8c-.4 1.1-2.3 2.1-3.2 2.2-.8.1-1.8.2-2.9-.2-.7-.2-1.6-.5-2.7-1-4.7-2.1-7.8-6.9-8-7.2-.2-.3-1.9-2.5-1.9-4.8s1.2-3.4 1.6-3.9c.4-.5.9-.6 1.2-.6h.9c.3 0 .7-.1 1 .8.4.9 1.3 3.2 1.4 3.4.1.2.2.5 0 .8-.2.3-.2.5-.4.8-.2.3-.4.6-.6.8-.2.2-.4.5-.2.9.3.5 1.1 1.9 2.4 3 1.7 1.5 3 2 3.5 2.2.5.2.7.2 1-.1.3-.3 1.1-1.3 1.4-1.7.3-.5.6-.4 1-.2.4.2 2.6 1.2 3.1 1.4.5.2.8.3.9.5.1.2.1 1.1-.3 2.2z" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'messages',
    label: 'Message',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <defs>
          <linearGradient id="ps-msg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5BF75B"/>
            <stop offset="100%" stopColor="#27C227"/>
          </linearGradient>
        </defs>
        <rect width="60" height="60" rx="14" fill="url(#ps-msg)"/>
        <path d="M30 14C20.6 14 13 20.6 13 28.5c0 4.3 2 8.2 5.2 10.9L17 46l6.5-3.2c2 .7 4.2 1.2 6.5 1.2 9.4 0 17-6.5 17-14.5S39.4 14 30 14z" fill="white"/>
      </svg>
    ),
  },
  {
    id: 'snapchat',
    label: 'Snapchat',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <rect width="60" height="60" rx="14" fill="#FFFC00"/>
        <path d="M30 13c-5.5 0-10 4.5-10 10v1.5c-1 .2-2.5.8-2.5 2 0 1 .8 1.8 1.9 2-.5 1.4-1.4 3-3.3 3.9-.7.3-1 1-.7 1.7.5 1.2 2.4 1.6 3.9 1.7.2.5.3 1.2.8 1.5.3.2.8 0 1.5-.2.9-.3 2.1-.7 3.4-.7s2.5.4 3.4.7c.7.2 1.2.4 1.5.2.5-.3.6-1 .8-1.5 1.5-.1 3.4-.5 3.9-1.7.3-.7 0-1.4-.7-1.7-1.9-.9-2.8-2.5-3.3-3.9 1.1-.2 1.9-.9 1.9-2 0-1.2-1.5-1.8-2.5-2V23c0-5.5-4.5-10-10-10z" fill="black"/>
      </svg>
    ),
  },
  {
    id: 'more',
    label: 'More',
    icon: (
      <svg viewBox="0 0 60 60" width="60" height="60">
        <rect width="60" height="60" rx="14" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <circle cx="18" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/>
        <circle cx="30" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/>
        <circle cx="42" cy="30" r="3.5" fill="rgba(255,255,255,0.7)"/>
      </svg>
    ),
  },
];

export default function PostShareModal({ open, onClose, post }) {
  const [loadingId, setLoadingId] = useState(null);

  const getBlob = useCallback(async () => {
    const canvas = await drawPostCard(post);
    return canvasToBlob(canvas);
  }, [post]);

  const handleBtn = useCallback(async (btnId) => {
    if (loadingId) return;
    setLoadingId(btnId);
    try {
      const blob = await getBlob();
      const file = new File([blob], 'costride-post.png', { type: 'image/png' });
      const shareData = { files: [file], text: `Check this out on CoStride 💪` };
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'costride-post.png'; a.click();
        URL.revokeObjectURL(url);
        toast.success('Image saved!');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') { console.error(e); toast.error('Could not share'); }
    } finally { setLoadingId(null); }
  }, [loadingId, getBlob]);

  const handleSave = useCallback(async () => {
    if (loadingId) return;
    setLoadingId('save');
    try {
      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'costride-post.png'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Saved!');
    } catch (e) { console.error(e); toast.error('Could not save'); }
    finally { setLoadingId(null); }
  }, [loadingId, getBlob]);

  if (!open || !post) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10011,
              maxHeight: 'calc(100dvh - 80px)',
              display: 'flex', flexDirection: 'column',
              background: 'rgba(12,12,20,0.98)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderTopLeftRadius: 26, borderTopRightRadius: 26,
              paddingBottom: 'max(env(safe-area-inset-bottom,0px),12px)',
              fontFamily: "'SF Pro Display',-apple-system,sans-serif",
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 18px 8px', flexShrink: 0, position: 'relative' }}>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>Share Post</span>
              <button
                onClick={onClose}
                style={{ position: 'absolute', right: 18, background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview card — centred, same width as workout carousel */}
            <div style={{ padding: '0 18px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 'min(57.2vw, 242px)', borderRadius: 14, overflow: 'hidden' }}>
                  <PostCardPreview post={post} />
                </div>
              </div>
            </div>

            {/* Share to */}
            <div style={{ padding: '14px 18px 0', flexShrink: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px 0' }}>Share to</p>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                {APP_BUTTONS.map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => handleBtn(btn.id)}
                    disabled={!!loadingId}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      background: 'none', border: 'none',
                      cursor: loadingId ? 'default' : 'pointer',
                      opacity: loadingId && loadingId !== btn.id ? 0.3 : 1,
                      flexShrink: 0, padding: 0,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <div style={{ position: 'relative', width: 60, height: 60 }}>
                      {loadingId === btn.id
                        ? <div style={{ width: 60, height: 60, borderRadius: 14, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'ps-spin 0.65s linear infinite' }} />
                          </div>
                        : btn.icon}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 600, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.2, maxWidth: 64 }}>
                      {btn.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Image */}
            <div style={{ padding: '10px 18px 0', flexShrink: 0 }}>
              <button
                onClick={handleSave}
                disabled={!!loadingId}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 14,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: loadingId === 'save' ? 'rgba(255,255,255,0.3)' : 'white',
                  fontSize: 14, fontWeight: 700,
                  cursor: loadingId ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {loadingId === 'save' ? 'Saving…' : 'Save Image'}
              </button>
            </div>
          </motion.div>

          <style>{`@keyframes ps-spin{to{transform:rotate(360deg)}}`}</style>
        </>
      )}
    </AnimatePresence>
  );
}