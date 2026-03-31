import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg';

// ── Capture a DOM element → PNG Blob via html2canvas ─────────────────────────
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

// ── Card 1: Stats Summary (photo bg + frosted stats) ─────────────────────────
function StatsCard({ post }) {
  const exercises = post.workout_exercises || [];

  const userComment = (() => {
    if (!post.content) return null;
    const lines = post.content.split('\n').filter(l => {
      const t = l.trim();
      return t && !t.includes('Just finished') && !/[0-9]+\s*[xX]\s*[0-9]+/.test(t) && !/[0-9]+(kg|lbs)/i.test(t);
    });
    return lines.join(' ').trim() || null;
  })();

  return (
    <div style={{
      width: '100%', aspectRatio: '9/16', position: 'relative',
      overflow: 'hidden', borderRadius: 18, background: '#0a0a0f',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {post.image_url ? (
        <>
          <img src={post.image_url} alt="" crossOrigin="anonymous"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.04) 30%, rgba(0,0,0,0.65) 62%, rgba(0,0,0,0.96) 100%)' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 45%,#0f172a 100%)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%,rgba(99,102,241,0.22) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(59,130,246,0.15) 0%,transparent 50%)' }} />
        </div>
      )}

      {/* Logo + date */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <img src={LOGO_URL} alt="CoStride" crossOrigin="anonymous"
            style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.55)' }} />
          <span style={{ color: 'white', fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>CoStride</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: 12, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
          {new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Bottom stats */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 30px' }}>
        <div style={{ color: 'white', fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 18, textShadow: '0 2px 12px rgba(0,0,0,0.55)' }}>
          {post.workout_name || 'Workout'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: userComment ? 14 : 0 }}>
          {[
            { label: 'Exercises', value: exercises.length || '—' },
            { label: 'Duration', value: post.workout_duration || '—' },
            { label: 'Volume', value: post.workout_volume || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 13, padding: '12px 6px', textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: 17, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 5 }}>{label}</div>
            </div>
          ))}
        </div>
        {userComment && (
          <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: 500, lineHeight: 1.4, fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.3)', paddingLeft: 9 }}>
            "{userComment}"
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card 2: Full Exercise Breakdown ──────────────────────────────────────────
function BreakdownCard({ post }) {
  const exercises = post.workout_exercises || [];

  return (
    <div style={{
      width: '100%', aspectRatio: '9/16', position: 'relative',
      overflow: 'hidden', borderRadius: 18, background: '#0a0a0f',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {post.image_url ? (
        <>
          <img src={post.image_url} alt="" crossOrigin="anonymous"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px) brightness(0.3)', transform: 'scale(1.12)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,7,16,0.52)' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d1117 0%,#111827 100%)' }} />
      )}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '20px 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src={LOGO_URL} alt="CoStride" crossOrigin="anonymous"
              style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />
            <span style={{ color: 'white', fontSize: 13, fontWeight: 800, letterSpacing: '-0.02em' }}>CoStride</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ color: 'white', fontSize: 17, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 9 }}>{post.workout_name || 'Workout'}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Exercises', value: exercises.length || '—' },
              { label: 'Duration', value: post.workout_duration || '—' },
              { label: 'Volume', value: post.workout_volume || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ color: 'white', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 8px 32px 48px', gap: 3, paddingLeft: 8, marginBottom: 4 }}>
          {['Exercise', 'Sets', '', 'Reps', 'Weight'].map((h, i) => (
            <div key={i} style={{ color: 'rgba(255,255,255,0.28)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: i > 0 ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {exercises.slice(0, 10).map((ex, idx) => {
            const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const sets = ex.sets || ex.set_count || '—';
            const reps = ex.reps || ex.rep_count || '—';
            const weight = ex.weight ?? ex.weight_kg ?? '—';
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 32px 8px 32px 48px', gap: 3, alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '6px 3px 6px 8px' }}>
                <div style={{ color: 'white', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 5, color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}>{sets}</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, textAlign: 'center', fontWeight: 700 }}>×</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 5, color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}>{reps}</div>
                <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.85),rgba(29,78,216,0.95))', borderRadius: 7, color: 'white', fontSize: 10, fontWeight: 800, textAlign: 'center', padding: '2px 3px' }}>
                  {weight}<span style={{ fontSize: 7 }}>kg</span>
                </div>
              </div>
            );
          })}
          {exercises.length > 10 && (
            <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 9, fontWeight: 600, textAlign: 'center', marginTop: 2 }}>+{exercises.length - 10} more exercises</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function WorkoutShareModal({ open, onClose, post }) {
  const [activeCard, setActiveCard] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const card0Ref = useRef(null);
  const card1Ref = useRef(null);
  const touchStartXRef = useRef(null);

  useEffect(() => { if (open) setActiveCard(0); }, [open]);

  const getActiveRef = () => activeCard === 0 ? card0Ref : card1Ref;

  const doShare = useCallback(async () => {
    if (isCapturing) return;
    const el = getActiveRef().current;
    if (!el) { toast.error('Could not capture card'); return; }

    setIsCapturing(true);
    try {
      const blob = await captureToBlob(el);
      const fileName = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Native share sheet — shows real app icons (Instagram, WhatsApp, Messages, etc.)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: post.workout_name || 'Workout',
          text: 'Check out my workout on CoStride 💪',
        });
      } else {
        // Desktop / unsupported: just download
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
  }, [activeCard, isCapturing, post]);

  const doSave = useCallback(async () => {
    if (isCapturing) return;
    const el = getActiveRef().current;
    if (!el) return;

    setIsCapturing(true);
    try {
      const blob = await captureToBlob(el);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-costride.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Saved to downloads!');
    } catch (e) {
      console.error(e);
      toast.error('Could not save image');
    } finally {
      setIsCapturing(false);
    }
  }, [activeCard, isCapturing, post]);

  if (!open || !post) return null;

  const cards = [
    { label: 'Summary', node: <StatsCard post={post} />, ref: card0Ref },
    { label: 'Full Breakdown', node: <BreakdownCard post={post} />, ref: card1Ref },
  ];

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
            {/* Pull handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
              <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 10px' }}>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>Share Activity</span>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>

            {/* Hidden refs for capture — off-screen but mounted so html2canvas can read them */}
            <div style={{ position: 'fixed', left: -2000, top: 0, width: 300, pointerEvents: 'none', zIndex: -1 }}>
              <div ref={card0Ref}><StatsCard post={post} /></div>
            </div>
            <div style={{ position: 'fixed', left: -2000, top: 0, width: 300, pointerEvents: 'none', zIndex: -1 }}>
              <div ref={card1Ref}><BreakdownCard post={post} /></div>
            </div>

            {/* Swipeable card preview */}
            <div
              style={{ padding: '0 20px', overflow: 'hidden' }}
              onTouchStart={e => { touchStartXRef.current = e.touches[0].clientX; }}
              onTouchEnd={e => {
                if (touchStartXRef.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStartXRef.current;
                if (Math.abs(dx) > 40) setActiveCard(v => dx < 0 ? Math.min(cards.length - 1, v + 1) : Math.max(0, v - 1));
                touchStartXRef.current = null;
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', gap: 14,
                  transform: `translateX(calc(${-activeCard * 100}% - ${activeCard * 14}px))`,
                  transition: 'transform 0.36s cubic-bezier(0.25,0.46,0.45,0.94)',
                }}>
                  {cards.map((card, i) => (
                    <div key={i} style={{ minWidth: '100%', flexShrink: 0 }}>{card.node}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dot indicators */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 14 }}>
              {cards.map((card, i) => (
                <button key={i} onClick={() => setActiveCard(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: 0 }}>
                  <div style={{
                    width: activeCard === i ? 22 : 7, height: 7, borderRadius: 4,
                    background: activeCard === i ? 'white' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
                  }} />
                  <span style={{ color: activeCard === i ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 700, transition: 'color 0.2s' }}>
                    {card.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Buttons */}
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
                  transition: 'opacity 0.15s',
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