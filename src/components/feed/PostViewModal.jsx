import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function PostViewModal({ post, open, onClose, friendName, friendAvatar, friendId }) {
  if (!post) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="postview-overlay"
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
            key="postview-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '640px', maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
              background: 'linear-gradient(160deg, #0c1128 0%, #060810 100%)',
              border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
              paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Sticky Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <Link
                to={createPageUrl('UserProfile') + `?id=${friendId}`}
                style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
              >
                {friendAvatar ? (
                  <img src={friendAvatar} alt={friendName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 700 }}>{friendName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{friendName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</p>
                </div>
              </Link>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              <p style={{ color: '#cbd5e1', whiteSpace: 'pre-wrap', margin: '0 0 16px', fontSize: 15, lineHeight: 1.6 }}>{post.content}</p>

              {/* Media */}
              {post.video_url ? (
                <video src={post.video_url} controls style={{ width: '100%', borderRadius: 16, background: '#0f172a', marginBottom: 16 }} />
              ) : post.image_url ? (
                <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 16, objectFit: 'cover', marginBottom: 16 }} />
              ) : null}

              {/* Engagement */}
              <div style={{ display: 'flex', gap: 24, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                  <Heart style={{ width: 18, height: 18 }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{post.likes || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                  <MessageCircle style={{ width: 18, height: 18 }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{post.comments?.length || 0}</span>
                </div>
              </div>

              {/* Comments */}
              {post.comments && post.comments.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
                  <p style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 13, margin: '0 0 12px' }}>Comments</p>
                  {post.comments.map((comment, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #475569, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{comment.user?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 2px', fontSize: 13 }}>
                          <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{comment.user}</span>{' '}
                          <span style={{ color: '#94a3b8' }}>{comment.text}</span>
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
