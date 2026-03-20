import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X, Clock, Users, MapPin, Star, Calendar, Dumbbell, ChevronRight, Zap, Award, Heart, Share2, Bell, CheckCircle, TrendingUp, Info } from 'lucide-react';

// ── Match the app's exact card style ─────────────────────────────────────────
const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';

const CLASS_TYPE_CONFIG = {
  hiit:     { label:'HIIT',     emoji:'⚡', color:'#f87171', colorRgb:'248,113,113', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)',   glow:'rgba(239,68,68,0.3)'   },
  yoga:     { label:'Yoga',     emoji:'🧘', color:'#34d399', colorRgb:'52,211,153',  bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)',  glow:'rgba(16,185,129,0.3)'  },
  strength: { label:'Strength', emoji:'🏋️', color:'#818cf8', colorRgb:'129,140,248', bg:'rgba(99,102,241,0.12)',  border:'rgba(99,102,241,0.25)',  glow:'rgba(99,102,241,0.3)'  },
  cardio:   { label:'Cardio',   emoji:'🏃', color:'#fb7185', colorRgb:'251,113,133', bg:'rgba(244,63,94,0.12)',   border:'rgba(244,63,94,0.25)',   glow:'rgba(244,63,94,0.3)'   },
  spin:     { label:'Spin',     emoji:'🚴', color:'#38bdf8', colorRgb:'56,189,248',  bg:'rgba(14,165,233,0.12)',  border:'rgba(14,165,233,0.25)',  glow:'rgba(14,165,233,0.3)'  },
  boxing:   { label:'Boxing',   emoji:'🥊', color:'#fb923c', colorRgb:'251,146,60',  bg:'rgba(234,88,12,0.12)',   border:'rgba(234,88,12,0.25)',   glow:'rgba(234,88,12,0.3)'   },
  pilates:  { label:'Pilates',  emoji:'🌸', color:'#c084fc', colorRgb:'192,132,252', bg:'rgba(168,85,247,0.12)',  border:'rgba(168,85,247,0.25)',  glow:'rgba(168,85,247,0.3)'  },
  default:  { label:'Class',    emoji:'🎯', color:'#38bdf8', colorRgb:'56,189,248',  bg:'rgba(14,165,233,0.10)',  border:'rgba(14,165,233,0.2)',   glow:'rgba(14,165,233,0.25)' },
};

const CLASS_IMAGES = {
  hiit:     'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=800&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  cardio:   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  spin:     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  boxing:   'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80',
  pilates:  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  default:  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
};

const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function getClassType(c) {
  const n = (c.name || c.title || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('zen')) return 'yoga';
  if (n.includes('strength') || n.includes('weight') || n.includes('lift') || n.includes('power')) return 'strength';
  if (n.includes('cardio') || n.includes('aerobic') || n.includes('zumba')) return 'cardio';
  if (n.includes('spin') || n.includes('cycle') || n.includes('bike')) return 'spin';
  if (n.includes('box') || n.includes('mma') || n.includes('kickbox')) return 'boxing';
  if (n.includes('pilates') || n.includes('barre')) return 'pilates';
  return 'default';
}

function getScheduleDays(c) {
  const schedule = c.schedule;
  if (!schedule) return [];
  if (Array.isArray(schedule)) return DAYS_SHORT.filter(d => schedule.some(s => (s.day || '').toLowerCase().includes(d.toLowerCase())));
  if (typeof schedule === 'string') return DAYS_SHORT.filter(d => schedule.toLowerCase().includes(d.toLowerCase()));
  return [];
}

// ── Animated progress ring ───────────────────────────────────────────────────
function ProgressRing({ pct, color, size = 54, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(pct), 200); return () => clearTimeout(t); }, [pct]);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - (circ * animated / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.2,0.64,1)' }} />
    </svg>
  );
}

// ── Intensity meter ──────────────────────────────────────────────────────────
function IntensityBar({ level, color }) {
  const levels = { beginner: 1, easy: 1, all_levels: 2, intermediate: 3, advanced: 4, expert: 5 };
  const num = levels[level?.toLowerCase()?.replace(' ','_')] || 2;
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ width: 5, borderRadius: 3, background: i <= num ? color : 'rgba(255,255,255,0.1)', height: 6 + i * 3, transition: `background 0.3s ease ${i * 0.06}s` }} />
      ))}
    </div>
  );
}

// ── Pulse dot ────────────────────────────────────────────────────────────────
const PULSE_CSS = `
@keyframes cdm-pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.15)} }
@keyframes cdm-ripple { 0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.4);opacity:0} }
@keyframes cdm-shimmer { 0%{transform:translateX(-100%)}100%{transform:translateX(200%)} }
@keyframes cdm-count { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
@keyframes cdm-tag-in { from{opacity:0;transform:translateY(6px) scale(0.92)}to{opacity:1;transform:translateY(0) scale(1)} }
`;

export default function ClassDetailModal({ gymClass, open, onClose, booked: initialBooked, onBook, isOwner }) {
  const [booked, setBooked] = useState(initialBooked || false);
  const [saved, setSaved] = useState(false);
  const [reminded, setReminded] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [bookAnimating, setBookAnimating] = useState(false);
  const scrollRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setBooked(initialBooked || false); }, [initialBooked]);

  useEffect(() => {
    if (!document.getElementById('cdm-styles')) {
      const s = document.createElement('style');
      s.id = 'cdm-styles';
      s.textContent = PULSE_CSS;
      document.head.appendChild(s);
    }
  }, []);

  if (!gymClass) return null;

  const typeKey = getClassType(gymClass);
  const cfg = CLASS_TYPE_CONFIG[typeKey];
  const img = gymClass.image_url || CLASS_IMAGES[typeKey] || CLASS_IMAGES.default;
  const capacity = gymClass.capacity || gymClass.max_participants || null;
  const enrolled = gymClass.enrolled || gymClass.participants_count || 0;
  const spotsLeft = capacity ? capacity - enrolled : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const fillPct = capacity ? Math.min(100, Math.round((enrolled / capacity) * 100)) : null;
  const scheduleDays = getScheduleDays(gymClass);
  const isHot = spotsLeft !== null && spotsLeft <= 5 && !isFull;
  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleBook = () => {
    if (isFull && !booked) return;
    setBookAnimating(true);
    setTimeout(() => {
      setBooked(b => !b);
      setBookAnimating(false);
      onBook && onBook(gymClass.id);
    }, 320);
  };

  const handleShare = () => {
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2200);
  };

  const handleScroll = (e) => setScrolled(e.target.scrollTop > 10);

  // Upcoming sessions mock (based on schedule days)
  const today = new Date();
  const upcomingSessions = scheduleDays.slice(0, 3).map((day, i) => {
    const d = new Date(today);
    const dayIdx = DAYS_SHORT.indexOf(day);
    const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
    let diff = dayIdx - todayIdx;
    if (diff <= 0) diff += 7;
    d.setDate(today.getDate() + diff + i * 7);
    return { day, date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) };
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(2,4,10,0.82)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          />

          {/* Share toast */}
          <AnimatePresence>
            {showShareToast && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                style={{ position: 'fixed', bottom: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 10001, background: 'rgba(30,40,70,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', backdropFilter: 'blur(20px)' }}>
                🔗 Link copied to clipboard
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34, mass: 0.9 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
              maxHeight: '94vh', display: 'flex', flexDirection: 'column',
              borderRadius: '28px 28px 0 0',
              background: 'linear-gradient(160deg, #0c1228 0%, #060810 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              boxShadow: `0 -12px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(${cfg.colorRgb},0.08)`,
              overflow: 'hidden',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0, position: 'relative', zIndex: 2 }}>
              <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Scrollable content */}
            <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

              {/* ── Hero ── */}
              <div style={{ position: 'relative', height: 260, overflow: 'hidden', flexShrink: 0 }}>
                <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* Gradient overlays */}
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(6,8,16,0.97) 100%)` }} />
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 80% 20%, rgba(${cfg.colorRgb},0.12) 0%, transparent 60%)` }} />

                {/* Top bar actions */}
                <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Type badge */}
                  <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: cfg.color, background: 'rgba(0,0,0,0.55)', border: `1px solid ${cfg.border}`, borderRadius: 20, padding: '5px 10px', backdropFilter: 'blur(10px)' }}>
                    <span style={{ fontSize: 13 }}>{cfg.emoji}</span>
                    {cfg.label}
                    {isHot && <span style={{ marginLeft: 2, color: '#fbbf24' }}>🔥</span>}
                  </motion.div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18 }}
                      onClick={() => setSaved(s => !s)}
                      style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                      <Heart style={{ width: 15, height: 15, color: saved ? '#f472b6' : '#fff', fill: saved ? '#f472b6' : 'none', transition: 'all 0.2s' }} />
                    </motion.button>
                    <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.22 }}
                      onClick={handleShare}
                      style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                      <Share2 style={{ width: 14, height: 14, color: '#fff' }} />
                    </motion.button>
                    <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.26 }}
                      onClick={onClose}
                      style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                      <X style={{ width: 16, height: 16, color: '#fff' }} />
                    </motion.button>
                  </div>
                </div>

                {/* Title area */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 18px' }}>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 22 }}>
                    {/* Status pills */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      {booked && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#34d399', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 20, padding: '3px 9px' }}>
                          <CheckCircle style={{ width: 10, height: 10 }} /> Booked
                        </span>
                      )}
                      {isFull && !booked && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f87171', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20, padding: '3px 9px' }}>
                          Class Full
                        </span>
                      )}
                      {isHot && !isFull && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '3px 9px' }}>
                          🔥 {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.12, margin: '0 0 10px', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                      {gymClass.name || gymClass.title}
                    </h2>

                    {/* Instructor */}
                    {(gymClass.instructor || gymClass.coach_name) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${cfg.color}55, ${cfg.color}22)`, border: `1.5px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: cfg.color, flexShrink: 0, boxShadow: `0 0 10px ${cfg.glow}` }}>
                          {initials(gymClass.instructor || gymClass.coach_name)}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{gymClass.instructor || gymClass.coach_name}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 2 }}>Lead Instructor</div>
                        </div>
                        {gymClass.rating && (
                          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '4px 8px' }}>
                            <Star style={{ width: 11, height: 11, fill: '#fbbf24', color: '#fbbf24' }} />
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{gymClass.rating}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* ── Body ── */}
              <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── Key stats ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {/* Duration */}
                  {gymClass.duration_minutes && (
                    <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '14px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${cfg.color}88, transparent)` }} />
                      <Clock style={{ width: 18, height: 18, color: cfg.color, margin: '0 auto 7px', filter: `drop-shadow(0 0 6px ${cfg.glow})` }} />
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{gymClass.duration_minutes}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>mins</div>
                    </div>
                  )}

                  {/* Capacity / spots */}
                  {capacity !== null ? (
                    <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '14px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${isFull ? '#f87171' : cfg.color}88, transparent)` }} />
                      <div style={{ position: 'relative', width: 32, height: 32, margin: '0 auto 4px' }}>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ProgressRing pct={fillPct} color={isFull ? '#f87171' : cfg.color} size={32} stroke={3} />
                        </div>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: isFull ? '#f87171' : cfg.color }}>{fillPct}%</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: isFull ? '#f87171' : '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{isFull ? 'Full' : spotsLeft}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{isFull ? 'Waitlist' : 'Open'}</div>
                    </div>
                  ) : (
                    <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '14px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${cfg.color}88, transparent)` }} />
                      <Users style={{ width: 18, height: 18, color: cfg.color, margin: '0 auto 7px', filter: `drop-shadow(0 0 6px ${cfg.glow})` }} />
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>Open</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>spots</div>
                    </div>
                  )}

                  {/* Difficulty / Level */}
                  <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '14px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${cfg.color}88, transparent)` }} />
                    {gymClass.difficulty ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                          <IntensityBar level={gymClass.difficulty} color={cfg.color} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                          {gymClass.difficulty.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>level</div>
                      </>
                    ) : (
                      <>
                        <Star style={{ width: 18, height: 18, color: cfg.color, margin: '0 auto 7px', fill: cfg.color + '44', filter: `drop-shadow(0 0 6px ${cfg.glow})` }} />
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>All Levels</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>welcome</div>
                      </>
                    )}
                  </div>
                </motion.div>

                {/* ── Description ── */}
                {gymClass.description && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>About This Class</div>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>{gymClass.description}</p>
                  </motion.div>
                )}

                {/* ── What to expect ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                  style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>What to Expect</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { icon: Zap, label: 'Intensity', value: gymClass.difficulty ? gymClass.difficulty.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase()) : 'All Levels' },
                      { icon: Dumbbell, label: 'Equipment', value: gymClass.equipment || 'Standard gym equipment' },
                      { icon: TrendingUp, label: 'Calories', value: gymClass.calories ? `~${gymClass.calories} kcal` : gymClass.duration_minutes ? `~${Math.round(gymClass.duration_minutes * 7)} kcal` : 'Varies' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `rgba(${cfg.colorRgb},0.1)`, border: `1px solid rgba(${cfg.colorRgb},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                          <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 1 }}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* ── Schedule & upcoming ── */}
                {gymClass.schedule && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Schedule</div>

                    {/* Day pills */}
                    {scheduleDays.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {DAYS_SHORT.map((d, i) => {
                          const on = scheduleDays.includes(d);
                          return (
                            <div key={d} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 10, fontSize: 9, fontWeight: 900, letterSpacing: '0.04em', background: on ? `rgba(${cfg.colorRgb},0.15)` : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? cfg.border : 'rgba(255,255,255,0.06)'}`, color: on ? cfg.color : 'rgba(255,255,255,0.18)', boxShadow: on ? `0 0 8px rgba(${cfg.colorRgb},0.15)` : 'none', animation: on ? `cdm-tag-in 0.3s ease ${i * 0.04}s both` : 'none' }}>
                              {d}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Time card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD_BG, border: CARD_BORDER, borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: `rgba(${cfg.colorRgb},0.12)`, border: `1px solid rgba(${cfg.colorRgb},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Clock style={{ width: 16, height: 16, color: cfg.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{gymClass.schedule}</div>
                        {gymClass.duration_minutes && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{gymClass.duration_minutes} minutes per session</div>}
                      </div>
                    </div>

                    {/* Upcoming sessions */}
                    {upcomingSessions.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>Upcoming Sessions</div>
                        {upcomingSessions.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '9px 12px' }}>
                            <div style={{ width: 34, height: 34, borderRadius: 10, background: CARD_BG, border: CARD_BORDER, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{s.date.split(' ')[0]}</div>
                              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 1, marginTop: 1 }}>{s.date.split(' ')[1]}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{s.day}</div>
                              {gymClass.schedule && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{gymClass.schedule}</div>}
                            </div>
                            {!isOwner && (
                              <button onClick={handleBook} style={{ fontSize: 10, fontWeight: 800, color: booked ? '#34d399' : cfg.color, background: booked ? 'rgba(16,185,129,0.1)' : `rgba(${cfg.colorRgb},0.1)`, border: `1px solid ${booked ? 'rgba(52,211,153,0.3)' : `rgba(${cfg.colorRgb},0.25)`}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {booked ? '✓ Booked' : 'Book'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Location ── */}
                {gymClass.location && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Location</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD_BG, border: CARD_BORDER, borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin style={{ width: 16, height: 16, color: '#fb923c' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{gymClass.location}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>In-gym class</div>
                      </div>
                      <ChevronRight style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  </motion.div>
                )}

                {/* ── Capacity bar ── */}
                {fillPct !== null && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Class Capacity</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: isFull ? '#f87171' : fillPct > 65 ? '#fbbf24' : cfg.color }}>{enrolled} / {capacity} filled</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} transition={{ delay: 0.5, duration: 1, ease: [0.34, 1.2, 0.64, 1] }}
                        style={{ height: '100%', borderRadius: 99, background: isFull ? 'linear-gradient(90deg, #dc2626, #f87171)' : fillPct > 65 ? 'linear-gradient(90deg, #d97706, #fbbf24)' : `linear-gradient(90deg, ${cfg.color}aa, ${cfg.color})` }} />
                      {/* Shimmer */}
                      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 99 }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', animation: 'cdm-shimmer 2.5s ease-in-out infinite' }} />
                      </div>
                    </div>
                    {isFull && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Info style={{ width: 12, height: 12 }} /> Join the waitlist — you'll be notified if a spot opens
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Set reminder ── */}
                {!isOwner && !booked && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                    <button onClick={() => setReminded(r => !r)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1px solid ${reminded ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.1)'}`, background: reminded ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)', color: reminded ? '#fbbf24' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}>
                      <Bell style={{ width: 14, height: 14, fill: reminded ? '#fbbf24' : 'none' }} />
                      {reminded ? 'Reminder Set ✓' : 'Set a Reminder'}
                    </button>
                  </motion.div>
                )}

                {/* bottom spacer for CTA */}
                <div style={{ height: 8 }} />
              </div>
            </div>

            {/* ── Fixed CTA ── */}
            {!isOwner && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                style={{ flexShrink: 0, padding: '12px 18px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(to top, #060810 60%, transparent)', position: 'relative' }}>

                {/* Capacity mini bar above CTA */}
                {fillPct !== null && !isFull && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct > 65 ? '#fbbf24' : cfg.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: fillPct > 65 ? '#fbbf24' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                      {isFull ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleBook}
                  disabled={isFull && !booked}
                  style={{
                    width: '100%', padding: '17px', borderRadius: 18, fontSize: 16, fontWeight: 900,
                    cursor: (isFull && !booked) ? 'default' : 'pointer', border: 'none', letterSpacing: '-0.01em',
                    position: 'relative', overflow: 'hidden',
                    background: booked
                      ? 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.2))'
                      : isFull
                        ? 'rgba(255,255,255,0.05)'
                        : `linear-gradient(135deg, #2563eb, #1d4ed8)`,
                    color: booked ? '#34d399' : isFull ? 'rgba(255,255,255,0.2)' : '#fff',
                    boxShadow: (!booked && !isFull) ? '0 6px 28px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' : booked ? '0 4px 20px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                    outline: booked ? '1px solid rgba(52,211,153,0.3)' : 'none',
                    transform: bookAnimating ? 'scale(0.97)' : 'scale(1)',
                    transition: 'transform 0.15s ease, background 0.3s ease, box-shadow 0.3s ease',
                  }}>
                  {/* Shimmer on CTA */}
                  {!booked && !isFull && (
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', animation: 'cdm-shimmer 3s ease-in-out infinite 1s' }} />
                    </div>
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {bookAnimating ? '...' : booked ? '✓ Booked — Tap to Cancel' : isFull ? 'Join Waitlist' : spotsLeft !== null ? `Book Now — ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'Book Now'}
                  </span>
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
