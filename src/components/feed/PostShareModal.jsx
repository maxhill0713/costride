import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

export default function PostShareModal({ open, onClose, post }) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async (platform) => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const postText = post.content || 'Check out this post';

      if (platform === 'copy') {
        await navigator.clipboard.writeText(postText);
        toast.success('Copied to clipboard!');
        onClose();
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('Could not share');
    } finally {
      setIsSharing(false);
    }
  }, [post, isSharing, onClose]);

  if (!open || !post) return null;

  return (
    <AnimatePresence mode="wait">
      {open && <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10010,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 300 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 300 }}
          transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '100%',
            background: '#1a1a1a',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          }}
        >
          {/* Handle indicator */}
          <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '12px auto 0' }} />

          {/* Post Preview */}
          <div style={{ padding: '24px 16px', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            {post.image_url && (
              <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', height: 180, position: 'relative' }}>
                <img src={post.image_url} alt="post" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* Logo in corner */}
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 8 }}>
                  <img src={LOGO_URL} alt="CoStride" style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'cover' }} />
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>CoStride</span>
                </div>
              </div>
            )}
            
            {post.content && (
              <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
                {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
              </p>
            )}
          </div>

          {/* Share Options Grid */}
          <div style={{ padding: '16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
              SHARE TO
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
              {[
                { icon: '📋', label: 'Copy', action: 'copy' },
                { icon: '📱', label: 'WhatsApp', action: 'whatsapp' },
                { icon: '𝕏', label: 'X', action: 'x' },
                { icon: 'ℹ️', label: 'More', action: 'more' }
              ].map((item) => (
                <button
                  key={item.action}
                  onClick={() => {
                    if (item.action === 'copy') handleShare('copy');
                  }}
                  disabled={isSharing}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 14,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                >
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              margin: '0 16px 8px',
              padding: '12px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              color: 'rgba(255,255,255,0.8)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          >
            Close
          </button>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}