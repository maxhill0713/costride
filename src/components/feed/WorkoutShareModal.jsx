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
        if (navigator.share) {
          await navigator.share({ title: post.workout_name || 'My Workout', text: workoutText });
        } else {
          await navigator.clipboard.writeText(workoutText);
          toast.info('Copy the text and share to Instagram');
        }
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
    <AnimatePresence>
      <motion.div
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

          {/* Workout Card */}
          <div style={{ padding: '24px 16px', textAlign: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            {post.image_url && (
              <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', height: 180 }}>
                <img src={post.image_url} alt="workout" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.02em' }}>
              {post.workout_name || 'Workout'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <div>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{post.workout_duration || '—'}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</p>
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{post.workout_volume || '—'}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</p>
              </div>
              <div>
                <p style={{ color: '#60a5fa', fontSize: 18, fontWeight: 900 }}>
                  {post.workout_exercises?.length || '—'}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exercises</p>
              </div>
            </div>
          </div>

          {/* Share Options Grid */}
          <div style={{ padding: '16px' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
              SHARE TO
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
              {[
                { icon: '📷', label: 'Instagram', action: 'instagram' },
                { icon: '📋', label: 'Copy Link', action: 'copy' },
                { icon: '📧', label: 'Mail', action: 'mail' },
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
      </motion.div>
    </AnimatePresence>
  );
}