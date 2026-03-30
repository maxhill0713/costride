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
  const cardRef = useRef(null);
  const touchStartX = useRef(null);

  const SLIDES = 2;

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) setSlide(dx < 0 ? Math.min(slide + 1, SLIDES - 1) : Math.max(slide - 1, 0));
    touchStartX.current = null;
  };

  const handleShare = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      // Try to capture the card as an image using html2canvas if available
      let imageBlob = null;
      if (cardRef.current && window.html2canvas) {
        const canvas = await window.html2canvas(cardRef.current, {
          useCORS: true, allowTaint: true, scale: 2,
          backgroundColor: null,
        });
        imageBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
      }

      const workoutText = [
        `💪 ${post.workout_name || 'Workout'}`,
        post.workout_duration ? `⏱ ${post.workout_duration}` : null,
        post.workout_volume ? `⚡ ${post.workout_volume}` : null,
        `\nLogged on CoStride`,
      ].filter(Boolean).join('\n');

      if (navigator.share) {
        const shareData = { title: post.workout_name || 'My Workout', text: workoutText };
        if (imageBlob) shareData.files = [new File([imageBlob], 'workout.jpg', { type: 'image/jpeg' })];
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(workoutText);
        toast.success('Copied to clipboard!');
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast.error('Could not share');
    } finally {
      setIsSharing(false);
    }
  }, [post, isSharing]);

  if (!open || !post) return null;

  const bgImage = post.image_url;
  const overlayLabels = ['Stats', 'Breakdown'];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10010,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '20px 16px 32px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.34, 1.2, 0.64, 1] }}
          onClick={e => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
        >
          {/* Close */}
          <button onClick={onClose} style={{ alignSelf: 'flex-end', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} />
          </button>

          {/* Share Card */}
          <div
            ref={cardRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              width: '100%',
              aspectRatio: '4/5',
              borderRadius: 20,
              overflow: 'hidden',
              position: 'relative',
              background: '#0d1117',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Background photo */}
            {bgImage ? (
              <img src={bgImage} alt="workout" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }} />
            )}

            {/* Overlay — animated slide */}
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{ position: 'absolute', inset: 0 }}
              >
                {slide === 0 ? <StatsOverlay post={post} /> : <BreakdownOverlay post={post} />}
              </motion.div>
            </AnimatePresence>

            {/* Swipe hint arrows */}
            {slide < SLIDES - 1 && (
              <button onClick={() => setSlide(s => Math.min(s + 1, SLIDES - 1))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <ChevronRight size={18} />
              </button>
            )}
            {slide > 0 && (
              <button onClick={() => setSlide(s => Math.max(s - 1, 0))} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <ChevronLeft size={18} />
              </button>
            )}
          </div>

          {/* Slide dots + labels */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {overlayLabels.map((label, i) => (
              <button key={i} onClick={() => setSlide(i)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: slide === i ? 24 : 8, height: 8, borderRadius: 4, background: slide === i ? '#3b82f6' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s ease' }} />
                <span style={{ color: slide === i ? '#93c5fd' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={isSharing}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 16,
              background: 'linear-gradient(to bottom, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
              border: 'none',
              borderBottom: '3px solid #1e40af',
              color: '#fff',
              fontSize: 15,
              fontWeight: 800,
              cursor: isSharing ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: isSharing ? 0.7 : 1,
              boxShadow: '0 4px 20px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'opacity 0.15s',
            }}
          >
            <Share2 size={18} />
            {isSharing ? 'Sharing…' : 'Share Workout'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}