import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

async function captureToBlob(el) {
  const { default: html2canvas } = await import('https://esm.sh/html2canvas@1.4.1');
  const canvas = await html2canvas(el, {
    useCORS: true,
    allowTaint: true,
    scale: 3,
    backgroundColor: '#0a0a0f',
    logging: false,
    imageTimeout: 10000,
  });
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
  });
}

function PostCard({ post }) {
  const hasMedia = !!(post.image_url || post.video_url);

  return (
    <div style={{
      width: '100%', aspectRatio: '9/16', position: 'relative',
      overflow: 'hidden', borderRadius: 18,
      background: '#0a0a0f',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {post.image_url ? (
        <>
          <img src={post.image_url} alt="" crossOrigin="anonymous"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.1) 25%,rgba(0,0,0,0.1) 55%,rgba(0,0,0,0.85) 100%)' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 45%,#0f172a 100%)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%,rgba(99,102,241,0.2) 0%,transparent 60%)' }} />
        </div>
      )}

      {/* Top: author */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '18px 18px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.25)' }}>
          {post.member_avatar
            ? <img src={post.member_avatar} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14 }}>{(post.member_name || '?').charAt(0).toUpperCase()}</div>
          }
        </div>
        <div>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 800, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>{post.member_name || 'CoStride User'}</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Bottom: content + logo */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 24px' }}>
        {post.content && (
          <div style={{ color: 'white', fontSize: 15, fontWeight: 600, lineHeight: 1.45, marginBottom: 18, textShadow: '0 1px 8px rgba(0,0,0,0.7)' }}>
            {post.content.length > 160 ? post.content.substring(0, 160) + '…' : post.content}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <img src={LOGO_URL} alt="CoStride" crossOrigin="anonymous"
            style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} />
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>CoStride</span>
        </div>
      </div>
    </div>
  );
}

export default function PostShareModal({ open, onClose, post }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const cardRef = useRef(null);

  const doShare = useCallback(async () => {
    if (isCapturing) return;
    const el = cardRef.current;
    if (!el) { toast.error('Could not capture post'); return; }

    setIsCapturing(true);
    try {
      const blob = await captureToBlob(el);
      const fileName = 'costride-post.png';
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'CoStride Post',
          text: post.content ? post.content.substring(0, 100) : 'Check this out on CoStride 💪',
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
        toast.success('Image saved!');
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error(e);
        toast.error('Share failed — try Save Image instead');
      }
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, post]);

  const doSave = useCallback(async () => {
    if (isCapturing) return;
    const el = cardRef.current;
    if (!el) return;

    setIsCapturing(true);
    try {
      const blob = await captureToBlob(el);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'costride-post.png'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Saved to downloads!');
    } catch (e) {
      console.error(e);
      toast.error('Could not save image');
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  if (!open || !post) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10011,
              background: 'rgba(10,10,18,0.99)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderTopLeftRadius: 26, borderTopRightRadius: 26,
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
              <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 10px' }}>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>Share Post</span>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>

            {/* Hidden capture target */}
            <div style={{ position: 'fixed', left: -2000, top: 0, width: 300, pointerEvents: 'none', zIndex: -1 }}>
              <div ref={cardRef}><PostCard post={post} /></div>
            </div>

            {/* Visible preview */}
            <div style={{ padding: '0 20px' }}>
              <PostCard post={post} />
            </div>

            <div style={{ display: 'flex', gap: 12, padding: '14px 20px 18px' }}>
              <button
                onClick={doSave}
                disabled={isCapturing}
                style={{
                  flex: 1, padding: '15px 0', borderRadius: 16,
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)',
                  color: 'white', fontSize: 14, fontWeight: 700,
                  cursor: isCapturing ? 'default' : 'pointer',
                  opacity: isCapturing ? 0.5 : 1,
                  boxShadow: '0 3px 0 rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.07)',
                }}
              >
                Save Image
              </button>
              <button
                onClick={doShare}
                disabled={isCapturing}
                style={{
                  flex: 2, padding: '15px 0', borderRadius: 16,
                  background: isCapturing
                    ? 'rgba(59,130,246,0.45)'
                    : 'linear-gradient(180deg,#3b82f6 0%,#1d4ed8 60%,#1e3a8a 100%)',
                  border: 'none', color: 'white', fontSize: 15, fontWeight: 800,
                  letterSpacing: '-0.02em',
                  cursor: isCapturing ? 'default' : 'pointer',
                  boxShadow: isCapturing ? 'none' : '0 3px 0 #1e3a8a,0 6px 20px rgba(59,130,246,0.35),inset 0 1px 0 rgba(255,255,255,0.2)',
                  transition: 'all 0.15s',
                }}
              >
                {isCapturing ? 'Preparing…' : 'Share'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}