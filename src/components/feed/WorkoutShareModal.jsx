import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import html2canvas from 'html2canvas';

// ── Costride logo (inline SVG wordmark) ──────────────────────────────────────
function CostrideLogoMark({ size = 28, className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5" />
        <path d="M10 16 L14 10 L18 16 L22 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="22" r="2.5" fill="white" />
      </svg>
      <span style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: size * 0.6, color: 'white', letterSpacing: '-0.03em', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
        costride
      </span>
    </div>
  );
}

// ── Card 1: Stats Summary (Strava-style minimal) ──────────────────────────────
function StatsCard({ post, cardRef }) {
  const exercises = post.workout_exercises || [];
  const hasPhoto = !!post.image_url;

  return (
    <div
      ref={cardRef}
      style={{
        width: '100%',
        aspectRatio: '9/16',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        background: '#0a0a0f',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Background photo */}
      {hasPhoto ? (
        <>
          <img
            src={post.image_url}
            alt="workout"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
            }}
            crossOrigin="anonymous"
          />
          {/* Dark gradient overlay — stronger at bottom */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.93) 100%)',
          }} />
        </>
      ) : (
        /* No photo: rich dark gradient background */
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #0d1117 0%, #111827 40%, #0f172a 100%)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(59,130,246,0.12) 0%, transparent 50%)',
          }} />
        </div>
      )}

      {/* Top bar: logo + date */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '20px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <CostrideLogoMark size={26} />
        <span style={{
          color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600,
          textShadow: '0 1px 4px rgba(0,0,0,0.6)', letterSpacing: '0.02em',
        }}>
          {new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Bottom stats panel */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 20px 28px',
      }}>
        {/* Workout name */}
        <div style={{
          color: 'white', fontSize: 26, fontWeight: 900,
          letterSpacing: '-0.04em', lineHeight: 1.1,
          marginBottom: 18,
          textShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>
          {post.workout_name || 'Workout'}
        </div>

        {/* Stat pills */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 10, marginBottom: 20,
        }}>
          {[
            { label: 'Exercises', value: exercises.length || '—' },
            { label: 'Duration', value: post.workout_duration || '—' },
            { label: 'Volume', value: post.workout_volume || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 14,
              padding: '12px 8px',
              textAlign: 'center',
            }}>
              <div style={{
                color: 'white', fontSize: 18, fontWeight: 900,
                letterSpacing: '-0.03em', lineHeight: 1,
              }}>
                {value}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.6)', fontSize: 10,
                fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginTop: 4,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Personal comment if exists */}
        {post.content && (() => {
          const lines = post.content.split('\n').filter(l => {
            const t = l.trim();
            return t && !t.includes('Just finished') && !/[0-9]+\s*[xX]\s*[0-9]+/.test(t) && !/[0-9]+(kg|lbs)/i.test(t);
          });
          const comment = lines.join(' ').trim();
          return comment ? (
            <div style={{
              color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500,
              lineHeight: 1.4, fontStyle: 'italic',
              borderLeft: '2px solid rgba(255,255,255,0.3)',
              paddingLeft: 10,
            }}>
              "{comment}"
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}

// ── Card 2: Full Exercise Breakdown ─────────────────────────────────────────
function BreakdownCard({ post, cardRef }) {
  const exercises = post.workout_exercises || [];
  const hasPhoto = !!post.image_url;

  return (
    <div
      ref={cardRef}
      style={{
        width: '100%',
        aspectRatio: '9/16',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        background: '#0a0a0f',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Background photo — blurred & darker for readability */}
      {hasPhoto ? (
        <>
          <img
            src={post.image_url}
            alt="workout"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              filter: 'blur(8px) brightness(0.4)',
              transform: 'scale(1.1)',
            }}
            crossOrigin="anonymous"
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(6,8,18,0.55)',
          }} />
        </>
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #0d1117 0%, #111827 100%)',
        }} />
      )}

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        padding: '20px 18px 24px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <CostrideLogoMark size={24} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {new Date(post.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* Workout name + mini stats */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          padding: '14px 16px',
          marginBottom: 12,
        }}>
          <div style={{ color: 'white', fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 10 }}>
            {post.workout_name || 'Workout'}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Exercises', value: exercises.length || '—' },
              { label: 'Duration', value: post.workout_duration || '—' },
              { label: 'Volume', value: post.workout_volume || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ color: 'white', fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 36px 8px 36px 52px',
            gap: 4,
            paddingLeft: 10, paddingRight: 4,
            marginBottom: 2,
          }}>
            {['Exercise', 'Sets', '', 'Reps', 'Weight'].map((h, i) => (
              <div key={i} style={{
                color: 'rgba(255,255,255,0.35)', fontSize: 8,
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                textAlign: i > 0 ? 'center' : 'left',
              }}>{h}</div>
            ))}
          </div>

          {exercises.slice(0, 10).map((ex, idx) => {
            const name = (ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`)
              .replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const sets = ex.sets || ex.set_count || '—';
            const reps = ex.reps || ex.rep_count || '—';
            const weight = ex.weight ?? ex.weight_kg ?? '—';

            return (
              <div key={idx} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 36px 8px 36px 52px',
                gap: 4,
                alignItems: 'center',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 10,
                padding: '7px 4px 7px 10px',
              }}>
                <div style={{ color: 'white', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '3px 0' }}>{sets}</div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', fontWeight: 700 }}>×</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '3px 0' }}>{reps}</div>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(29,78,216,0.9))',
                  borderRadius: 8, color: 'white', fontSize: 11, fontWeight: 800,
                  textAlign: 'center', padding: '3px 4px',
                }}>
                  {weight}<span style={{ fontSize: 8 }}>kg</span>
                </div>
              </div>
            );
          })}

          {exercises.length > 10 && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, textAlign: 'center', marginTop: 4 }}>
              +{exercises.length - 10} more exercises
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function WorkoutShareModal({ open, onClose, post }) {
  const [activeCard, setActiveCard] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const card0Ref = useRef(null);
  const card1Ref = useRef(null);
  const cardRefs = [card0Ref, card1Ref];
  const touchStartXRef = useRef(null);

  // Reset to first card when modal opens
  useEffect(() => { if (open) setActiveCard(0); }, [open]);

  const captureCard = useCallback(async () => {
    const el = cardRefs[activeCard].current;
    if (!el) return null;
    try {
      const canvas = await html2canvas(el, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: null,
        logging: false,
      });
      return canvas;
    } catch (e) {
      console.error('html2canvas error:', e);
      return null;
    }
  }, [activeCard]);

  const handleDownload = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `${(post.workout_name || 'workout').replace(/\s+/g, '-').toLowerCase()}-share.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsExporting(false);
    }
  }, [captureCard, post.workout_name]);

  const handleShare = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = await captureCard();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${(post.workout_name || 'workout').replace(/\s+/g, '-')}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: post.workout_name || 'Workout',
            text: `Check out my workout on Costride! 💪`,
          });
        } else {
          // Fallback: open share as download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } finally {
      setIsExporting(false);
    }
  }, [captureCard, post.workout_name]);

  if (!open) return null;

  const cards = [
    { label: 'Summary', component: <StatsCard post={post} cardRef={card0Ref} /> },
    { label: 'Full Breakdown', component: <BreakdownCard post={post} cardRef={card1Ref} /> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 10010,
              background: 'rgba(2,6,23,0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              zIndex: 10011,
              background: 'linear-gradient(180deg, rgba(16,19,40,0.97) 0%, rgba(6,8,18,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: '0 0 env(safe-area-inset-bottom, 0)',
              fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {/* Handle bar */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 20px 12px',
            }}>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>
                Share Workout
              </span>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  borderRadius: '50%', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Card preview area */}
            <div
              style={{ padding: '0 20px', overflow: 'hidden' }}
              onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current === null) return;
                const dx = e.changedTouches[0].clientX - touchStartXRef.current;
                if (Math.abs(dx) > 40) {
                  if (dx < 0) setActiveCard(v => Math.min(cards.length - 1, v + 1));
                  else setActiveCard(v => Math.max(0, v - 1));
                }
                touchStartXRef.current = null;
              }}
            >
              {/* Card switcher track */}
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  display: 'flex', gap: 12,
                  transform: `translateX(calc(${-activeCard * 100}% - ${activeCard * 12}px))`,
                  transition: 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  width: '100%',
                }}>
                  {cards.map((card, i) => (
                    <div key={i} style={{ minWidth: '100%', flexShrink: 0 }}>
                      {card.component}
                    </div>
                  ))}
                </div>
              </div>

              {/* Swipe nav arrows + dots */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 16, marginTop: 14,
              }}>
                <button
                  onClick={() => setActiveCard(v => Math.max(0, v - 1))}
                  disabled={activeCard === 0}
                  style={{
                    background: activeCard === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%', width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: activeCard === 0 ? 'rgba(255,255,255,0.2)' : 'white',
                    cursor: activeCard === 0 ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {cards.map((card, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveCard(i)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      }}
                    >
                      <div style={{
                        width: activeCard === i ? 20 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: activeCard === i ? 'white' : 'rgba(255,255,255,0.25)',
                        transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }} />
                      <span style={{
                        color: activeCard === i ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                        fontSize: 10, fontWeight: 700,
                        transition: 'color 0.2s',
                      }}>
                        {card.label}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setActiveCard(v => Math.min(cards.length - 1, v + 1))}
                  disabled={activeCard === cards.length - 1}
                  style={{
                    background: activeCard === cards.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%', width: 34, height: 34,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: activeCard === cards.length - 1 ? 'rgba(255,255,255,0.2)' : 'white',
                    cursor: activeCard === cards.length - 1 ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ padding: '16px 20px 28px', display: 'flex', gap: 12 }}>
              {/* Save / Download */}
              <button
                onClick={handleDownload}
                disabled={isExporting}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 0',
                  borderRadius: 16,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white',
                  fontSize: 14, fontWeight: 700,
                  cursor: isExporting ? 'default' : 'pointer',
                  opacity: isExporting ? 0.5 : 1,
                  transition: 'opacity 0.15s',
                  boxShadow: '0 3px 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <Download size={17} />
                Save
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                disabled={isExporting}
                style={{
                  flex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 0',
                  borderRadius: 16,
                  background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 60%, #1e3a8a 100%)',
                  border: 'none',
                  color: 'white',
                  fontSize: 15, fontWeight: 800,
                  cursor: isExporting ? 'default' : 'pointer',
                  opacity: isExporting ? 0.6 : 1,
                  letterSpacing: '-0.02em',
                  transition: 'opacity 0.15s',
                  boxShadow: '0 3px 0 #1e3a8a, 0 6px 20px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                <Share2 size={17} />
                {isExporting ? 'Preparing…' : 'Share'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}