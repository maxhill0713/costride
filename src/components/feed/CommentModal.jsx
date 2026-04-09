import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function CommentModal({ open, onClose, post, onAddComment }) {
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onAddComment(comment);
      setComment('');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="comment-overlay"
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
            key="comment-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '640px', maxHeight: '80vh',
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

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Comments</h3>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 10, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Comments List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{comment.user?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2px', fontSize: 14 }}>
                        <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{comment.user}</span>{' '}
                        <span style={{ color: '#cbd5e1' }}>{comment.text}</span>
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>
                        {format(new Date(comment.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
                  <p style={{ margin: 0, fontSize: 14 }}>No comments yet</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12 }}>Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Add Comment */}
            <form onSubmit={handleSubmit} style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 99, padding: '10px 16px', color: '#f1f5f9', fontSize: 14,
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={!comment.trim()}
                  style={{
                    width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: comment.trim() ? 'pointer' : 'default',
                    background: comment.trim() ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    opacity: comment.trim() ? 1 : 0.4, transition: 'all 0.15s',
                  }}
                >
                  <Send style={{ width: 18, height: 18, color: '#fff' }} />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
