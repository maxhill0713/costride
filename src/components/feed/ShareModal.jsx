import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, MessageCircle, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareModal({ open, onClose, post }) {
  const shareUrl = `${window.location.origin}/post/${post.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
    onClose();
  };

  const handleShare = (platform) => {
    let url = '';
    const text = `Check out this workout from ${post.member_name}!`;

    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(shareUrl)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank');
      onClose();
    }
  };

  const options = [
    { icon: Copy, label: 'Copy Link', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', action: handleCopyLink },
    { icon: MessageCircle, label: 'Share to WhatsApp', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', action: () => handleShare('whatsapp') },
    { icon: LinkIcon, label: 'Share to Twitter', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', action: () => handleShare('twitter') },
    { icon: Mail, label: 'Share via Email', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', action: () => handleShare('email') },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="share-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <motion.div
            key="share-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '640px',
              background: 'linear-gradient(160deg, #0c1128 0%, #060810 100%)',
              border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
              paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Share</h3>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Options */}
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.map(({ icon: Icon, label, color, bg, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.15s',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 20, height: 20, color }} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
