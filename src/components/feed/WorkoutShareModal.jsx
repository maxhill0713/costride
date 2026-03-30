import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

export default function WorkoutShareModal({ open, onClose, post }) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async (platform) => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const workoutText = [
        `💪 ${post.workout_name || 'Workout'}`,
        post.workout_duration ? `⏱ ${post.workout_duration}` : null,
        post.workout_volume ? `⚡ ${post.workout_volume}` : null,
        `\nLogged on CoStride`,
      ].filter(Boolean).join('\n');

      if (platform === 'copy') {
        await navigator.clipboard.writeText(workoutText);
        toast.success('Link copied!');
        onClose();
      } else if (platform === 'instagram') {
        await navigator.clipboard.writeText(workoutText);
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
          background: '#000', backdropFilter: 'blur(0px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        {/* Header */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(0,0,0,0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              padding: '8px 12px', transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Close
          </button>
          <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Share Activity</h2>
          <div style={{ width: 72 }} />
        </div>

        {/* Main Content - Centered Card */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          {/* Activity Card - Strava Style */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
            style={{
              background: 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(20,20,20,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '32px 24px',
              width: '100%',
              maxWidth: '320px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            {post.image_url && (
              <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', height: 160, background: 'rgba(255,255,255,0.05)' }}>
                <img src={post.image_url} alt="workout" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900, marginBottom: 20, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {post.workout_name || 'Workout'}
            </h2>

            {/* Key Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {post.workout_duration && (
                <div>
                  <p style={{ color: '#60a5fa', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{post.workout_duration}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duration</p>
                </div>
              )}
              {post.workout_volume && (
                <div>
                  <p style={{ color: '#60a5fa', fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{post.workout_volume}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Volume</p>
                </div>
              )}
            </div>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <img src={LOGO_URL} alt="CoStride" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>CoStride</span>
            </div>
          </motion.div>
        </div>

        {/* Share Options - Bottom */}
        <div style={{ width: '100%', padding: '24px 20px', background: 'rgba(0,0,0,0.9)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Share To
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { icon: '📷', label: 'Instagram', action: 'instagram' },
              { icon: '😊', label: 'Facebook', action: 'facebook' },
              { icon: '𝕏', label: 'X', action: 'x' },
              { icon: 'ℹ️', label: 'More', action: 'more' }
            ].map((item) => (
              <button
                key={item.action}
                onClick={() => {
                  if (item.action === 'copy') handleShare('copy');
                  else if (item.action === 'instagram') handleShare('instagram');
                }}
                disabled={isSharing}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  color: 'rgba(255,255,255,0.8)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              >
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => handleShare('copy')}
            disabled={isSharing}
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(96,165,250,0.15)',
              border: '1px solid rgba(96,165,250,0.4)',
              borderRadius: 12,
              color: '#60a5fa',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(96,165,250,0.15)'; }}
          >
            📋 Copy Link
          </button>
        </div>
      </motion.div>}
    </AnimatePresence>
  );
}