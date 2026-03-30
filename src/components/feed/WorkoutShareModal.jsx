import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

function parseEx(ex) {
  const setsRepsStr = String(ex.setsReps || ex.sets_reps || '');
  const srParts = /[xX×]/.test(setsRepsStr) ? setsRepsStr.split(/[xX×]/).map(s => s.trim()) : [];
  const sets = String(ex.sets || srParts[0] || '') || '-';
  const reps = String(ex.reps || srParts[1] || '') || '-';
  const weight = String(ex.weight || '') || '-';
  return { sets, reps, weight };
}

function buildGroups(exercises) {
  const groups = [];
  const nameToIdx = {};
  (exercises || []).forEach((ex, index) => {
    const key = (ex.exercise || '').trim().toLowerCase();
    if (!key) { groups.push({ key: `__${index}`, name: ex.exercise || '', items: [{ ex, index }] }); return; }
    if (nameToIdx[key] === undefined) { nameToIdx[key] = groups.length; groups.push({ key, name: ex.exercise, items: [{ ex, index }] }); }
    else groups[nameToIdx[key]].items.push({ ex, index });
  });
  return groups;
}

// ── Overlay 1: Stats Card (Strava style) ────────────────────────────────────
function StatsOverlay({ post }) {
  const exercises = post.workout_exercises || [];
  const exerciseCount = new Set(exercises.map(e => (e.exercise || e.name || '').trim().toLowerCase()).filter(Boolean)).size || exercises.length;
  const date = post.created_date
    ? new Date(post.created_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 60%, transparent 100%)',
      padding: '48px 24px 32px',
    }}>
      {/* Logo + app name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <img src={LOGO_URL} alt="CoStride" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }} />
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>CoStride</span>
      </div>

      {/* Workout name */}
      <p style={{ color: '#ffffff', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4, lineHeight: 1.2 }}>
        {post.workout_name || 'Workout'}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>{date}</p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
        {[
          { label: 'Duration', value: post.workout_duration || '—' },
          { label: 'Exercises', value: exerciseCount || '—' },
          { label: 'Volume', value: post.workout_volume || '—' },
        ].map((stat, i) => (
          <div key={stat.label} style={{
            flex: 1, textAlign: 'center',
            borderRight: i < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none',
          }}>
            <p style={{ color: '#ffffff', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{stat.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overlay 2: Full Exercise Breakdown ──────────────────────────────────────
function BreakdownOverlay({ post }) {
  const exercises = post.workout_exercises || [];
  const groups = buildGroups(exercises);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.75) 100%)',
      display: 'flex', flexDirection: 'column', padding: '28px 20px 24px',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <p style={{ color: '#ffffff', fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em' }}>{post.workout_name || 'Workout'}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            {post.workout_duration && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>{post.workout_duration}</span>}
            {post.workout_volume && <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>{post.workout_volume}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src={LOGO_URL} alt="CoStride" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>CoStride</span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 12px 40px 60px', gap: 4, marginBottom: 6, flexShrink: 0 }}>
        {['Exercise', 'Sets', '', 'Reps', 'Weight'].map((h, i) => (
          <span key={i} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: i > 0 ? 'center' : 'left' }}>{h}</span>
        ))}
      </div>

      {/* Exercise rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {groups.map((group) => {
          const isGrouped = group.items.length > 1;
          if (!isGrouped) {
            const { ex } = group.items[0];
            const { sets, reps, weight } = parseEx(ex);
            return (
              <div key={group.key} style={{ display: 'grid', gridTemplateColumns: '1fr 40px 12px 40px 60px', gap: 4, alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 8px' }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{sets}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center' }}>×</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>{reps}</span>
                <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 900, textAlign: 'center' }}>{weight}kg</span>
              </div>
            );
          }
          return (
            <div key={group.key} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 8px' }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>{group.name}</span>
              {group.items.map(({ ex, index }, setIdx) => {
                const { reps, weight } = parseEx(ex);
                return (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 40px 12px 40px 60px', gap: 4, alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600 }}>Set {setIdx + 1}</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>1</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center' }}>×</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{reps}</span>
                    <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 900, textAlign: 'center' }}>{weight}kg</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────
export default function WorkoutShareModal({ open, onClose, post }) {
  const [slide, setSlide] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) setSlide(dx < 0 ? 1 : 0);
    touchStartX.current = null;
  };

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

      if (platform === 'share') {
        if (navigator.share) {
          await navigator.share({ title: post.workout_name || 'My Workout', text: workoutText });
        } else {
          await navigator.clipboard.writeText(workoutText);
          toast.success('Copied to clipboard!');
        }
      } else if (platform === 'copy') {
        await navigator.clipboard.writeText(workoutText);
        toast.success('Copied to clipboard!');
      } else if (platform === 'instagram') {
        toast.info('Copy the text and share to Instagram');
        await navigator.clipboard.writeText(workoutText);
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('Could not share');
    } finally {
      setIsSharing(false);
    }
  }, [post, isSharing]);

  if (!open || !post) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10010,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: '0',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 400 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 400 }}
          transition={{ duration: 0.28, ease: [0.34, 1.2, 0.64, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 100%)',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: '24px 16px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Swipeable Image Preview */}
          {post.image_url && (
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{
                width: '100%',
                height: '200px',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#0d1117',
                position: 'relative',
              }}
            >
              <img src={post.image_url} alt="workout" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {/* Swipe Hint */}
              {slide === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', bottom: 8, right: 12,
                    color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600,
                    background: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: 4,
                  }}
                >
                  ← Swipe
                </motion.div>
              )}
            </div>
          )}

          {/* Stats Section */}
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
              {post.workout_name || 'Workout'}
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>{post.workout_duration || '—'}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, marginTop: 4 }}>Duration</p>
              </div>
              <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <p style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>{post.workout_volume || '—'}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, marginTop: 4 }}>Volume</p>
              </div>
              <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div>
                <p style={{ color: '#60a5fa', fontSize: 20, fontWeight: 900 }}>
                  {post.workout_exercises?.length || '—'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, marginTop: 4 }}>Exercises</p>
              </div>
            </div>
          </div>

          {/* Share To Label */}
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
            Share to
          </p>

          {/* Platform Icons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <button
              onClick={() => handleShare('instagram')}
              style={{
                background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                border: 'none',
                borderRadius: '50%',
                width: 50,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 24,
              }}
              title="Instagram"
            >
              📷
            </button>
            <button
              onClick={() => handleShare('copy')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: 50,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 20,
                color: '#fff',
              }}
              title="Copy to clipboard"
              disabled={isSharing}
            >
              ⋯
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button
              onClick={() => handleShare('copy')}
              disabled={isSharing}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '8px 0',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            >
              Copy Text
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '8px 0',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            >
              Instagram
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '8px 0',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            >
              Close
            </button>
          </div>

          {/* Close hint */}
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
            Tap outside to close
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}