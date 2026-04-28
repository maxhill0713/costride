import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import CoachProfileModal from './CoachProfileModal';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Users, MapPin, Star, Calendar, Dumbbell,
  ChevronRight, Zap, Bell, CheckCircle,
  TrendingUp, Info, QrCode, MessageSquare,
  ChevronDown, ChevronUp, Award, Repeat, ExternalLink,
  ThumbsUp, Tag, Wifi, AlertCircle, Flame,
} from 'lucide-react';

const pageSlideVariants = {
  hidden:  { y: '100%', opacity: 1 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 36, mass: 1 } },
  exit:    { y: '100%', opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 } },
};

const CARD_BG     = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';

const CFG = {
  hiit:     { label:'HIIT',     emoji:'⚡', color:'#f87171', rgb:'248,113,113', bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.25)',  glow:'rgba(239,68,68,0.3)'  },
  yoga:     { label:'Yoga',     emoji:'🧘', color:'#34d399', rgb:'52,211,153',  bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)', glow:'rgba(16,185,129,0.3)' },
  strength: { label:'Strength', emoji:'🏋️', color:'#818cf8', rgb:'129,140,248', bg:'rgba(99,102,241,0.12)', border:'rgba(99,102,241,0.25)', glow:'rgba(99,102,241,0.3)' },
  cardio:   { label:'Cardio',   emoji:'🏃', color:'#fb7185', rgb:'251,113,133', bg:'rgba(244,63,94,0.12)',  border:'rgba(244,63,94,0.25)',  glow:'rgba(244,63,94,0.3)'  },
  spin:     { label:'Spin',     emoji:'🚴', color:'#38bdf8', rgb:'56,189,248',  bg:'rgba(14,165,233,0.12)', border:'rgba(14,165,233,0.25)', glow:'rgba(14,165,233,0.3)' },
  boxing:   { label:'Boxing',   emoji:'🥊', color:'#fb923c', rgb:'251,146,60',  bg:'rgba(234,88,12,0.12)',  border:'rgba(234,88,12,0.25)',  glow:'rgba(234,88,12,0.3)'  },
  pilates:  { label:'Pilates',  emoji:'🌸', color:'#c084fc', rgb:'192,132,252', bg:'rgba(168,85,247,0.12)', border:'rgba(168,85,247,0.25)', glow:'rgba(168,85,247,0.3)' },
  default:  { label:'Class',    emoji:'🎯', color:'#94a3b8', rgb:'148,163,184', bg:'rgba(100,116,139,0.10)', border:'rgba(100,116,139,0.2)', glow:'rgba(100,116,139,0.2)' },
};

const IMGS = {
  hiit:'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=800&q=80',
  yoga:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  strength:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  cardio:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  spin:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  boxing:'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80',
  pilates:'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  default:'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
};

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const CSS = `
@keyframes cdm-shimmer {
  0%   { transform: translateX(-100%); opacity: 0; }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateX(220%); opacity: 0; }
}
@keyframes cdm-pop {
  0%   { transform: scale(0.6) translateY(10px); opacity: 0; }
  55%  { transform: scale(1.07) translateY(-2px); opacity: 1; }
  78%  { transform: scale(0.97) translateY(0); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes cdm-bar {
  from { width: 0; }
}
@keyframes cdm-fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cdm-hero-in {
  from { opacity: 0.6; transform: scale(1.05); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes cdm-slide-in {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}
`;

function injectCSS() {
  if (!document.getElementById('cdm-css')) {
    const s = document.createElement('style');
    s.id = 'cdm-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}

function classType(c) {
  if (c.category) {
    const cat = c.category.toLowerCase();
    if (cat.includes('hiit') || cat.includes('interval')) return 'hiit';
    if (cat.includes('yoga') || cat.includes('zen'))       return 'yoga';
    if (cat.includes('strength') || cat.includes('weight') || cat.includes('lift') || cat.includes('power')) return 'strength';
    if (cat.includes('cardio') || cat.includes('aerobic') || cat.includes('zumba')) return 'cardio';
    if (cat.includes('spin') || cat.includes('cycle') || cat.includes('bike')) return 'spin';
    if (cat.includes('box') || cat.includes('mma') || cat.includes('kickbox')) return 'boxing';
    if (cat.includes('pilates') || cat.includes('barre')) return 'pilates';
  }
  const n = (c.class_name || c.name || c.title || '').toLowerCase();
  if (n.includes('hiit') || n.includes('interval')) return 'hiit';
  if (n.includes('yoga') || n.includes('zen'))       return 'yoga';
  if (n.includes('strength') || n.includes('weight') || n.includes('lift') || n.includes('power')) return 'strength';
  if (n.includes('cardio') || n.includes('aerobic') || n.includes('zumba')) return 'cardio';
  if (n.includes('spin') || n.includes('cycle') || n.includes('bike')) return 'spin';
  if (n.includes('box') || n.includes('mma') || n.includes('kickbox')) return 'boxing';
  if (n.includes('pilates') || n.includes('barre')) return 'pilates';
  return 'default';
}

function scheduleDays(c) {
  const s = c.schedule;
  if (!s) return [];
  if (Array.isArray(s)) return DAYS.filter(d => s.some(x => (x.day || '').toLowerCase().includes(d.toLowerCase())));
  if (typeof s === 'string') return DAYS.filter(d => s.toLowerCase().includes(d.toLowerCase()));
  return [];
}

function ini(name = '') { return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

function getClassName(c)    { return c.class_name || c.name || c.title || 'Untitled Class'; }
function getInstructor(c)   { return c.instructor || c.coach_name || null; }
function getCoverImage(c, tk) { return c.cover_image_url || c.image_url || IMGS[tk] || IMGS.default; }
function getCapacity(c)     { return c.max_capacity ?? c.capacity ?? c.max_participants ?? null; }
function getEnrolled(c) {
  if (Array.isArray(c.attendees)) return c.attendees.filter(a => !a.status || a.status === 'booked').length;
  return c.enrolled ?? c.participants_count ?? 0;
}
function getIntensity(c) {
  const raw = c.intensity_level || c.difficulty || 'All Levels';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
function getEquipment(c) {
  if (!c.equipment_needed) return c.equipment || 'Standard gym equipment';
  if (Array.isArray(c.equipment_needed)) return c.equipment_needed.join(', ');
  return c.equipment_needed;
}
function getCalories(c) {
  if (c.estimated_calories) return `~${c.estimated_calories} kcal`;
  if (c.calories) return `~${c.calories} kcal`;
  if (c.duration_minutes) return `~${Math.round(c.duration_minutes * 7)} kcal`;
  return 'Varies';
}
function getCancellationPolicy(c) {
  return c.cancellation_policy || 'Cancel up to 4 hours before class starts for a full refund. Late cancellations may incur a fee.';
}
function getAverageRating(c, reviews) {
  if (c.average_rating != null) return parseFloat(c.average_rating).toFixed(1);
  if (reviews.length > 0) return (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
  return '0.0';
}
function getReviewCount(c, reviews) { return c.review_count ?? reviews.length; }
function getReviews(c) {
  if (Array.isArray(c.reviews) && c.reviews.length > 0) {
    return c.reviews.map(r => ({
      ...r,
      initials: r.initials || ini(r.name || r.reviewer_name || ''),
      name:     r.name || r.reviewer_name || 'Anonymous',
      date:     r.date || formatReviewDate(r.created_at),
      text:     r.text || r.comment || '',
      likes:    r.likes ?? 0,
    }));
  }
  return [
    { initials:'AJ', name:'Alex J.',  rating:5, date:'2 days ago',  text:'Absolutely loved this class. High energy throughout — left feeling genuinely accomplished.', likes:12 },
    { initials:'SK', name:'Sara K.',  rating:4, date:'1 week ago',  text:'Well structured session. Warm-up could be longer but overall highly recommend.', likes:7 },
    { initials:'MP', name:'Mike P.',  rating:5, date:'2 weeks ago', text:'Best class at this gym. Consistent quality every single week.', likes:4 },
    { initials:'LB', name:'Laura B.', rating:4, date:'3 weeks ago', text:'Great for all fitness levels. The instructor is really encouraging.', likes:3 },
  ];
}

function formatReviewDate(iso) {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7)  return `${days} days ago`;
    if (days < 14) return '1 week ago';
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  } catch { return ''; }
}

function formatDateTime(iso) {
  if (!iso) return { date: null, time: null };
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch { return { date: null, time: null }; }
}

function generateUpcomingSessions(gymClass, days, startDT, endDT) {
  const sessions = [];
  const now = new Date();
  const windowEnd = new Date(now);
  windowEnd.setDate(now.getDate() + 28);

  const cap = getCapacity(gymClass);
  const baseEnrolled = getEnrolled(gymClass);

  const timeLabel = startDT.time
    ? (endDT.time ? `${startDT.time} – ${endDT.time}` : startDT.time)
    : gymClass.duration_minutes
      ? `(${gymClass.duration_minutes} min)`
      : 'Time TBD';

  const spotsFor = (seedOffset) => {
    if (cap === null) return null;
    const variance = [0, 2, 0, 3, 1, 0, 4, 2][seedOffset % 8];
    const filled = Math.min(cap, baseEnrolled + variance);
    return Math.max(0, cap - filled);
  };

  if (days.length > 0) {
    let sessionIndex = 0;
    let current = new Date(now);
    current.setHours(0, 0, 0, 0);

    while (current <= windowEnd && sessions.length < 14) {
      const jsDay = current.getDay();
      const dayName = jsDay === 0 ? 'Sun' : DAYS[jsDay - 1];

      if (days.includes(dayName)) {
        const sessionDate = new Date(current);
        if (gymClass.start_time) {
          const ref = new Date(gymClass.start_time);
          sessionDate.setHours(ref.getHours(), ref.getMinutes(), 0, 0);
        } else {
          sessionDate.setHours(7, 0, 0, 0);
        }

        if (sessionDate > now) {
          const spots = spotsFor(sessionIndex);
          sessions.push({
            id: `s-${sessionDate.getTime()}`,
            date: sessionDate,
            dateLabel: sessionDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' }),
            dayShort: sessionDate.toLocaleDateString('en-GB', { weekday: 'short' }),
            monthLabel: sessionDate.toLocaleDateString('en-GB', { month: 'short' }),
            dayNum: sessionDate.getDate(),
            timeLabel,
            spots,
            full: spots !== null && spots <= 0,
            hot: spots !== null && spots > 0 && spots <= 4,
            cap,
          });
          sessionIndex++;
        }
      }
      current.setDate(current.getDate() + 1);
    }
  } else if (gymClass.start_time) {
    const sessionDate = new Date(gymClass.start_time);
    if (sessionDate > now) {
      const spots = spotsFor(0);
      sessions.push({
        id: `s-${sessionDate.getTime()}`,
        date: sessionDate,
        dateLabel: sessionDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' }),
        dayShort: sessionDate.toLocaleDateString('en-GB', { weekday: 'short' }),
        monthLabel: sessionDate.toLocaleDateString('en-GB', { month: 'short' }),
        dayNum: sessionDate.getDate(),
        timeLabel,
        spots,
        full: spots !== null && spots <= 0,
        hot: spots !== null && spots > 0 && spots <= 4,
        cap,
      });
    }
  }

  return sessions;
}

function availabilityBadge(session) {
  if (session.full) return { label: 'Full', color: '#f87171', bg: 'rgba(239,68,68,0.13)', border: 'rgba(239,68,68,0.25)' };
  if (session.hot) return { label: `${session.spots} left`, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.28)' };
  if (session.spots === null) return { label: 'Open', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' };
  return { label: 'Available', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' };
}

function Bar({ pct, color, anim = true, h = 6 }) {
  return (
    <div style={{ height: h, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, animation: anim ? 'cdm-bar 1.1s cubic-bezier(0.16,1,0.3,1) both' : 'none' }} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 99, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '50%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)', animation: 'cdm-shimmer 3.2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, subColor }) {
  return (
    <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '14px 10px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <Icon style={{ width: 17, height: 17, color, margin: '0 auto 7px', filter: `drop-shadow(0 0 5px ${color}55)` }} />
      <div style={{ fontSize: 13, fontWeight: 900, color: subColor || '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}

function SectionHead({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>;
}

function QRModal({ open, onClose, gymClass, c }) {
  const code = `CLASS-${(gymClass?.id || 'DEMO').toString().slice(-6).toUpperCase()}`;
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10100, background: 'rgba(2,4,10,0.92)', backdropFilter: 'blur(14px)' }} />
          <motion.div initial={{ scale: 0.82, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.82, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10101, width: 300,
              background: 'linear-gradient(160deg,#0d1232 0%,#060810 100%)',
              border: `1px solid rgba(${c.rgb},0.28)`, borderRadius: 24, padding: '26px 22px 22px',
              boxShadow: `0 0 60px rgba(${c.rgb},0.18)`, textAlign: 'center' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: 13, right: 13, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X style={{ width: 13, height: 13, color: '#fff' }} />
            </button>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.color, marginBottom: 14 }}>Check-In QR Code</div>
            <div style={{ width: 170, height: 170, margin: '0 auto 16px', background: '#fff', borderRadius: 14, padding: 10, display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 2 }}>
              {Array.from({ length: 81 }, (_, i) => {
                const row = Math.floor(i / 9), col = i % 9;
                const corner = (row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3);
                const dark = corner || Math.abs(Math.sin(i * 2.3 + 1.7)) > 0.45;
                return <div key={i} style={{ background: dark ? '#111' : '#fff', borderRadius: corner ? 2 : 1 }} />;
              })}
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', marginBottom: 5 }}>{code}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Show this at the front desk</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)' }}>
              Valid for {getClassName(gymClass)} only
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function RateSheet({ open, onClose, c, className }) {
  const [rating, setRating] = useState(0);
  const [hov, setHov] = useState(0);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState([]);
  const [done, setDone] = useState(false);
  const ALL_TAGS = ['Great instructor', 'High energy', 'Well paced', 'Challenging', 'Beginner friendly', 'Would repeat', 'Good music', 'Great atmosphere'];
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10200, background: 'rgba(2,4,10,0.88)', backdropFilter: 'blur(12px)' }} />
          <motion.div variants={pageSlideVariants} initial="hidden" animate="visible" exit="exit"
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10201, borderRadius: '24px 24px 0 0',
              background: 'linear-gradient(160deg,#0d1232 0%,#060810 100%)',
              border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', padding: '10px 18px 42px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
            </div>
            {done ? (
              <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                <div style={{ fontSize: 50, marginBottom: 12, animation: 'cdm-pop 0.4s ease both' }}>⭐</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Thanks for your review!</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Your feedback helps the community.</div>
                <button onClick={onClose} style={{ padding: '12px 32px', borderRadius: 14, background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 4 }}>Rate This Class</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 18 }}>{className}</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 18 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onMouseEnter={() => setHov(s)} onMouseLeave={() => setHov(0)} onClick={() => setRating(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Star style={{ width: 34, height: 34, fill: s <= (hov || rating) ? '#fbbf24' : 'rgba(255,255,255,0.1)', color: s <= (hov || rating) ? '#fbbf24' : 'rgba(255,255,255,0.15)', transform: s <= (hov || rating) ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s', filter: s <= (hov || rating) ? 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' : 'none' }} />
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                  {ALL_TAGS.map(t => {
                    const on = tags.includes(t);
                    return (
                      <button key={t} onClick={() => setTags(p => on ? p.filter(x => x !== t) : [...p, t])}
                        style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                          border: `1px solid ${on ? c.border : 'rgba(255,255,255,0.1)'}`,
                          background: on ? c.bg : 'rgba(255,255,255,0.03)',
                          color: on ? c.color : 'rgba(255,255,255,0.45)', transition: 'all 0.15s' }}>
                        {on && '✓ '}{t}
                      </button>
                    );
                  })}
                </div>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)…"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#fff', resize: 'none', height: 78, outline: 'none', fontFamily: 'inherit', marginBottom: 14 }} />
                <button onClick={() => { if (rating > 0) setDone(true); }} disabled={rating === 0}
                  style={{ width: '100%', padding: '15px', borderRadius: 16, fontSize: 15, fontWeight: 900,
                    cursor: rating > 0 ? 'pointer' : 'default', border: 'none',
                    background: rating > 0 ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'rgba(255,255,255,0.05)',
                    color: rating > 0 ? '#fff' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.2s' }}>
                  Submit Review
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ReviewCard({ r, c }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '13px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${c.color}44,${c.color}22)`, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: c.color, flexShrink: 0 }}>{r.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.name}</div>
          <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
            {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: 9, height: 9, fill: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.1)', color: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.1)' }} />)}
          </div>
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{r.date}</span>
      </div>
      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.62, margin: '0 0 8px' }}>{r.text || r.comment}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <ThumbsUp style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.22)' }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontWeight: 600 }}>{r.likes} helpful</span>
      </div>
    </div>
  );
}

function SessionRow({ session, isSelected, onSelect, c, isFirst }) {
  const badge = availabilityBadge(session);
  const isToday = session.date.toDateString() === new Date().toDateString();
  const isTomorrow = (() => {
    const tom = new Date(); tom.setDate(tom.getDate() + 1);
    return session.date.toDateString() === tom.toDateString();
  })();

  return (
    <motion.button
      onClick={() => !session.full && onSelect(session)}
      whileTap={!session.full ? { scale: 0.985 } : {}}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '13px 14px', borderRadius: 16, cursor: session.full ? 'not-allowed' : 'pointer',
        border: `1px solid ${isSelected ? c.border : 'rgba(255,255,255,0.06)'}`,
        background: isSelected ? `rgba(${c.rgb},0.09)` : 'rgba(255,255,255,0.025)',
        boxShadow: isSelected ? `0 0 0 1px ${c.border}, 0 4px 20px rgba(${c.rgb},0.08)` : 'none',
        transition: 'all 0.18s cubic-bezier(0.25,0.46,0.45,0.94)',
        opacity: session.full ? 0.55 : 1,
        textAlign: 'left',
        animation: `cdm-fade-up 0.28s ease both`,
        animationDelay: `${isFirst * 0.04}s`,
      }}
    >
      <div style={{
        width: 46, height: 50, borderRadius: 12, flexShrink: 0,
        background: isSelected ? `rgba(${c.rgb},0.15)` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isSelected ? c.border : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
      }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: isSelected ? c.color : 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>{session.dayShort}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: isSelected ? c.color : '#fff', lineHeight: 1, marginTop: 2 }}>{session.dayNum}</div>
        <div style={{ fontSize: 8.5, fontWeight: 700, color: isSelected ? c.color : 'rgba(255,255,255,0.3)', lineHeight: 1, marginTop: 1 }}>{session.monthLabel}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
            {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : session.dateLabel.split(' ').slice(0, 2).join(' ')}
          </span>
          {(isToday || isTomorrow) && (
            <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: isToday ? '#34d399' : c.color, background: isToday ? 'rgba(52,211,153,0.12)' : c.bg,
              border: `1px solid ${isToday ? 'rgba(52,211,153,0.25)' : c.border}`,
              borderRadius: 6, padding: '2px 6px' }}>
              {isToday ? 'Today' : 'Tomorrow'}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock style={{ width: 10, height: 10, flexShrink: 0 }} />{session.timeLabel}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '4px 9px', borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, whiteSpace: 'nowrap' }}>
          {badge.label}
        </span>
        {!session.full && (
          <div style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${isSelected ? c.color : 'rgba(255,255,255,0.18)'}`,
            background: isSelected ? c.color : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s cubic-bezier(0.25,0.46,0.45,0.94)',
            boxShadow: isSelected ? `0 0 8px rgba(${c.rgb},0.4)` : 'none',
          }}>
            {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function ClassDetailModal({
  gymClass,
  open,
  onClose,
  booked: initBooked = false,
  onBook,
  isOwner = false,
  friendsBooked = [],
  currentUser: currentUserProp = null,
}) {
  const [booked, setBooked]             = useState(initBooked);
  const [waitlist, setWaitlist]         = useState(false);
  const [reminded, setReminded]         = useState(false);
  const [recurring, setRecurring]       = useState(false);
  const [showQR, setShowQR]             = useState(false);
  const [showRate, setShowRate]         = useState(false);
  const [toast, setToast]               = useState('');
  const [moreReviews, setMoreReviews]   = useState(false);
  const [tab, setTab]                   = useState('details');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCoachProfile, setShowCoachProfile] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [joinLoading, setJoinLoading]   = useState(false);
  const [liveAttendeeIds, setLiveAttendeeIds] = useState(null);
  const [btnPressed, setBtnPressed]     = useState(false);

  const [resolvedUser, setResolvedUser] = useState(currentUserProp);
  useEffect(() => {
    if (currentUserProp) { setResolvedUser(currentUserProp); return; }
    base44.auth.me().then(u => setResolvedUser(u)).catch(() => {});
  }, [currentUserProp]);

  useEffect(() => {
    if (!open || !gymClass?.id) return;
    setLiveAttendeeIds(gymClass.attendee_ids || []);
  }, [open, gymClass?.id]);

  // Auto-book after successful Stripe payment redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookedClassId = params.get('class_booked');
    if (!bookedClassId || bookedClassId !== gymClass?.id || !resolvedUser) return;
    // Remove query param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('class_booked');
    window.history.replaceState({}, '', url.toString());
    // Add user to class attendees if not already
    const currentIds = gymClass.attendee_ids || [];
    if (!currentIds.includes(resolvedUser.id)) {
      const newIds = [...currentIds, resolvedUser.id];
      base44.entities.GymClass.update(gymClass.id, { attendee_ids: newIds })
        .then(() => { setLiveAttendeeIds(newIds); setBooked(true); showToast('Booking confirmed! See you there 🎉'); })
        .catch(() => {});
    }
  }, [gymClass?.id, resolvedUser]);

  const attendeeIds = liveAttendeeIds ?? (gymClass?.attendee_ids || []);
  const isJoined = resolvedUser ? attendeeIds.includes(resolvedUser.id) : false;

  useEffect(() => { setBooked(initBooked || isJoined); }, [initBooked, isJoined]);
  useEffect(() => { injectCSS(); }, []);
  useEffect(() => { if (!open) { setSelectedSession(null); setShowLeaveConfirm(false); } }, [open]);

  const handleJoinLeave = async () => {
    if (!resolvedUser || !gymClass?.id) return;

    // If class has a price and user is not yet joined, go to Stripe checkout
    const classPrice = gymClass.price;
    if (classPrice > 0 && !isJoined) {
      setJoinLoading(true);
      try {
        // Build a clean success URL with just the gym id and class_booked param
        const successUrl = new URL(window.location.origin + '/GymCommunity');
        const currentParams = new URLSearchParams(window.location.search);
        const gymId = currentParams.get('id');
        if (gymId) successUrl.searchParams.set('id', gymId);
        successUrl.searchParams.set('class_booked', gymClass.id);
        const res = await base44.functions.invoke('createClassCheckout', {
          classId: gymClass.id,
          successUrl: successUrl.toString(),
          cancelUrl: window.location.href,
        });
        if (res.data?.url) {
          window.location.href = res.data.url;
        } else {
          showToast('Could not start checkout');
        }
      } catch (e) {
        showToast('Could not start checkout');
      } finally {
        setJoinLoading(false);
      }
      return;
    }

    setJoinLoading(true);
    try {
      const currentIds = [...attendeeIds];
      const newIds = isJoined
        ? currentIds.filter(id => id !== resolvedUser.id)
        : [...currentIds, resolvedUser.id];
      await base44.entities.GymClass.update(gymClass.id, { attendee_ids: newIds });
      setLiveAttendeeIds(newIds);
      setBooked(!isJoined);
      onBook && onBook(gymClass.id);
      showToast(isJoined ? 'Left class' : 'Joined! See you there 🎉');
    } catch (e) {
      showToast('Something went wrong');
    } finally {
      setJoinLoading(false);
      setShowLeaveConfirm(false);
    }
  };

  if (!gymClass) return null;

  const tk          = classType(gymClass);
  const c           = CFG[tk];
  const className   = getClassName(gymClass);
  const instructor  = getInstructor(gymClass);
  const img         = getCoverImage(gymClass, tk);
  const cap         = getCapacity(gymClass);
  const enr         = getEnrolled(gymClass);
  const left        = cap ? cap - enr : null;
  const full        = left !== null && left <= 0;
  const pct         = cap ? Math.min(100, Math.round(enr / cap * 100)) : null;
  const hot         = left !== null && left <= 5 && !full;
  const days        = scheduleDays(gymClass);
  const intensity   = getIntensity(gymClass);
  const equipment   = getEquipment(gymClass);
  const calories    = getCalories(gymClass);
  const cancelPolicy = getCancellationPolicy(gymClass);
  const category    = gymClass.category ? (CFG[tk]?.label || gymClass.category) : CFG[tk]?.label;

  const REVIEWS     = getReviews(gymClass);
  const avg         = getAverageRating(gymClass, REVIEWS);
  const reviewCount = getReviewCount(gymClass, REVIEWS);

  const startDT     = formatDateTime(gymClass.start_time);
  const endDT       = formatDateTime(gymClass.end_time);

  const upcomingSessions = generateUpcomingSessions(gymClass, days, startDT, endDT);

  const barColor = full
    ? 'linear-gradient(90deg,#dc2626,#f87171)'
    : pct > 65
      ? 'linear-gradient(90deg,#d97706,#fbbf24)'
      : `linear-gradient(90deg,${c.color}88,${c.color})`;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2300); };

  const handleBook = () => {
    if (isJoined) { setShowLeaveConfirm(true); return; }
    handleJoinLeave();
  };

  const ctaLabel = (() => {
    if (joinLoading) return '…';
    if (isJoined)   return '✓ Joined — Tap to Leave';
    if (waitlist)   return '⏳ On Waitlist — Tap to Leave';
    if (gymClass.price > 0) return `Pay £${gymClass.price} & Join`;
    return 'Join Class';
  })();

  const ratCounts = [5, 4, 3, 2, 1].map(s => ({
    s, n: REVIEWS.filter(r => r.rating === s).length,
    p: Math.round(REVIEWS.filter(r => r.rating === s).length / REVIEWS.length * 100),
  }));

  const schemaAttendees = Array.isArray(gymClass.attendees)
    ? gymClass.attendees.filter(a => !a.status || a.status === 'booked').slice(0, 4)
    : [];

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — clicking the top 40% (outside the sheet) closes it */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={onClose}
              style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(2,4,10,0.87)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            />

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div key="t" initial={{ opacity: 0, y: 18, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
                  style={{ position: 'fixed', bottom: 130, left: '50%', transform: 'translateX(-50%)', zIndex: 10300,
                    background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
                    padding: '11px 20px', fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
                    backdropFilter: 'blur(20px)' }}>
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sheet — 60% of screen height, anchored to bottom */}
            <motion.div
              variants={pageSlideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              // Stop clicks inside the sheet from bubbling to the backdrop
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
                height: '60vh',
                display: 'flex', flexDirection: 'column',
                borderRadius: '26px 26px 0 0',
                background: 'linear-gradient(160deg,#0c1128 0%,#060810 100%)',
                border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
                boxShadow: '0 -16px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.06)',
              }}>

              {/* Drag handle — tap above sheet (on backdrop) to dismiss */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
                <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
              </div>

              {/* Scroll body */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

                {/* ── HERO — flush to top of sheet, no gap ── */}
                <div style={{ position: 'relative', height: 220, overflow: 'hidden', flexShrink: 0, marginTop: 0 }}>
                  <img src={img} alt={className} style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'cdm-hero-in 0.6s cubic-bezier(0.16,1,0.3,1) both', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(6,8,18,0.97) 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 75% 25%,rgba(${c.rgb},0.14) 0%,transparent 60%)` }} />

                  {/* Title block */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 16px' }}>
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 28 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
                        {booked && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#34d399', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 20, padding: '3px 9px' }}><CheckCircle style={{ width: 9, height: 9 }} />Booked</span>}
                        {waitlist && !booked && <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '3px 9px' }}>⏳ On Waitlist</span>}
                        {full && !booked && !waitlist && <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#f87171', background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20, padding: '3px 9px' }}>Class Full</span>}
                        {hot && !full && <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '3px 9px' }}>🔥 {left} left</span>}
                      </div>
                      <h2 style={{ fontSize: 25, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.12, margin: '0 0 12px', textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
                        {className}
                      </h2>
                      {instructor && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
                            <div style={{ width: 33, height: 33, borderRadius: '50%', background: `linear-gradient(135deg,${c.color}55,${c.color}22)`, border: `1.5px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: c.color, flexShrink: 0, boxShadow: `0 0 10px ${c.glow}` }}>
                              {ini(instructor)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{instructor}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 600, marginTop: 2 }}>Lead Instructor</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ display: 'flex', gap: 1 }}>
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: 9, height: 9, fill: s <= Math.round(parseFloat(avg)) ? '#fbbf24' : 'rgba(255,255,255,0.15)', color: s <= Math.round(parseFloat(avg)) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }} />)}
                              </div>
                              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#fbbf24' }}>{avg}</span>
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Class Rating</div>
                          </div>
                          <button onClick={() => setShowCoachProfile(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 20, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: `1px solid ${c.border}`, background: c.bg, color: c.color, flexShrink: 0, whiteSpace: 'nowrap' }}>
                            View Profile
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* ── Tabs ── */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingLeft: 18 }}>
                  {['details', 'schedule', 'reviews'].map(s => (
                    <button key={s} onClick={() => setTab(s)}
                      style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, textTransform: 'capitalize', letterSpacing: '0.02em', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === s ? c.color : 'transparent'}`, color: tab === s ? c.color : 'rgba(255,255,255,0.32)', transition: 'color 0.2s ease, border-color 0.2s ease', marginBottom: -1, position: 'relative' }}>
                      {s}
                      {s === 'schedule' && selectedSession && (
                        <span style={{ position: 'absolute', top: 8, right: 6, width: 6, height: 6, borderRadius: '50%', background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Tab content ── */}
                <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* ===== DETAILS ===== */}
                  {tab === 'details' && (
                    <motion.div key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                        <StatCard icon={Clock}  label="Duration" value={gymClass.duration_minutes ? `${gymClass.duration_minutes} min` : '—'} color={c.color} />
                        <StatCard icon={Users}  label={cap ? `${enr}/${cap}` : 'Spots'} value={full ? 'Full' : left !== null ? `${left} open` : 'Open'} color={full ? '#f87171' : c.color} subColor={full ? '#f87171' : '#fff'} />
                        <StatCard icon={Zap}    label="Level"    value={intensity} color={c.color} />
                      </div>

                      {(startDT.date || endDT.date) && (
                        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '13px 15px' }}>
                          <SectionHead>Session Time</SectionHead>
                          <div style={{ display: 'flex', gap: 12 }}>
                            {startDT.date && (
                              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 12px' }}>
                                <div style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Starts</div>
                                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{startDT.time}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{startDT.date}</div>
                              </div>
                            )}
                            {endDT.date && (
                              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 12px' }}>
                                <div style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Ends</div>
                                <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{endDT.time}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{endDT.date}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Who's Going — invite button removed */}
                      {schemaAttendees.length > 0 && (
                        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '13px 15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <SectionHead>Who's Going</SectionHead>
                            {enr > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.38)' }}>{enr} attending</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {schemaAttendees.map((a, i) => (
                                <div key={a.id || i} style={{ width: 32, height: 32, borderRadius: '50%', background: a.color || c.color, border: '2px solid rgba(6,8,18,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', marginLeft: i > 0 ? -10 : 0, zIndex: schemaAttendees.length - i, overflow: 'hidden', flexShrink: 0 }}>
                                  {a.avatar ? <img src={a.avatar} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(a.name)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {gymClass.description && (
                        <div>
                          <SectionHead>About This Class</SectionHead>
                          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{gymClass.description}</p>
                        </div>
                      )}

                      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 15px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <SectionHead>Class Details</SectionHead>
                        </div>
                        <div style={{ padding: '6px 15px 12px' }}>
                          {[
                            { I: Zap,      l: 'Intensity',     v: intensity },
                            { I: Dumbbell, l: 'Equipment',     v: equipment },
                            { I: Flame,    l: 'Est. Calories', v: calories },
                            { I: Award,    l: 'Category',      v: category },
                            ...(gymClass.price_drop_in  ? [{ I: Tag, l: 'Drop-In',      v: `$${gymClass.price_drop_in}` }]  : []),
                            ...(gymClass.price_member   ? [{ I: Tag, l: 'Member Price', v: `$${gymClass.price_member}` }]   : []),
                          ].map(({ I, l, v }, i, arr) => (
                            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                              <div style={{ width: 30, height: 30, borderRadius: 9, background: `rgba(${c.rgb},0.1)`, border: `1px solid rgba(${c.rgb},0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <I style={{ width: 13, height: 13, color: c.color }} />
                              </div>
                              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', fontWeight: 600, flex: 1 }}>{l}</span>
                              <span style={{ fontSize: 13, color: '#fff', fontWeight: 700, textAlign: 'right' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 14 }}>
                        <AlertCircle style={{ width: 14, height: 14, color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>Cancellation Policy</div>
                          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>{cancelPolicy}</div>
                        </div>
                      </div>

                      {gymClass.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD_BG, border: CARD_BORDER, borderRadius: 14, padding: '13px 15px', cursor: 'pointer' }}>
                          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MapPin style={{ width: 15, height: 15, color: '#fb923c' }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{gymClass.location}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>In-gym · View map</div>
                          </div>
                          <ExternalLink style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                        </div>
                      )}

                      {pct !== null && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                            <SectionHead>Class Capacity</SectionHead>
                            <span style={{ fontSize: 11, fontWeight: 800, color: full ? '#f87171' : pct > 65 ? '#fbbf24' : c.color }}>{enr} / {cap} filled</span>
                          </div>
                          <Bar pct={pct} color={barColor} />
                          {full && <div style={{ marginTop: 7, fontSize: 11.5, color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}><Info style={{ width: 12, height: 12 }} />Join the waitlist — you'll be notified when a spot opens</div>}
                        </div>
                      )}

                      {!isOwner && (
                        <div style={{ display: 'flex', gap: 9 }}>
                          <button onClick={() => { setReminded(r => !r); showToast(reminded ? 'Reminder removed' : '⏰ Reminder set for 1hr before!'); }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              border: `1px solid ${reminded ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.09)'}`,
                              background: reminded ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.03)',
                              color: reminded ? '#fbbf24' : 'rgba(255,255,255,0.42)', transition: 'all 0.2s' }}>
                            <Bell style={{ width: 13, height: 13, fill: reminded ? '#fbbf24' : 'none' }} />{reminded ? 'Reminded ✓' : 'Remind Me'}
                          </button>
                          {booked ? (
                            <button onClick={() => setShowQR(true)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${c.border}`, background: c.bg, color: c.color, transition: 'all 0.2s' }}>
                              <QrCode style={{ width: 13, height: 13 }} />Check-In QR
                            </button>
                          ) : (
                            <button onClick={() => setShowRate(true)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.42)', transition: 'all 0.2s' }}>
                              <Star style={{ width: 13, height: 13 }} />Rate Class
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ===== SCHEDULE ===== */}
                  {tab === 'schedule' && (
                    <motion.div key="s" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div>
                          <SectionHead>Upcoming Sessions</SectionHead>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: -6 }}>
                            Next 4 weeks · {upcomingSessions.length} sessions
                          </div>
                        </div>
                        {selectedSession && (
                          <motion.button initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSelectedSession(null)}
                            style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.38)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>
                            Clear
                          </motion.button>
                        )}
                      </div>

                      <AnimatePresence>
                        {selectedSession && (
                          <motion.div key="chip" initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.96 }} transition={{ duration: 0.2 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14, background: `rgba(${c.rgb},0.1)`, border: `1px solid ${c.border}` }}>
                            <CheckCircle style={{ width: 15, height: 15, color: c.color, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: c.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Selected</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{selectedSession.dateLabel} · {selectedSession.timeLabel}</div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {upcomingSessions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {upcomingSessions.map((session, idx) => (
                            <SessionRow key={session.id} session={session} isSelected={selectedSession?.id === session.id} onSelect={setSelectedSession} c={c} isFirst={idx} />
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18 }}>
                          <Calendar style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.18)', margin: '0 auto 12px' }} />
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No upcoming sessions</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>Check back soon for new dates.</div>
                        </div>
                      )}

                      {booked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD_BG, border: CARD_BORDER, borderRadius: 14, padding: '13px 15px', marginTop: 4 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 12, background: `rgba(${c.rgb},0.1)`, border: `1px solid rgba(${c.rgb},0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Repeat style={{ width: 15, height: 15, color: c.color }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Book every week</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>Auto-book this class weekly</div>
                          </div>
                          <div onClick={() => { setRecurring(r => !r); showToast(recurring ? 'Recurring booking removed' : 'Weekly booking enabled 🔄'); }}
                            style={{ width: 44, height: 26, borderRadius: 13, background: recurring ? c.color : 'rgba(255,255,255,0.12)', position: 'relative', cursor: 'pointer', transition: 'background 0.25s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0 }}>
                            <div style={{ position: 'absolute', top: 3, left: recurring ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.25s cubic-bezier(0.34,1.4,0.64,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                          </div>
                        </div>
                      )}

                      <button onClick={() => showToast('Opening calendar…')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                        <Calendar style={{ width: 14, height: 14 }} />Add to Calendar<ExternalLink style={{ width: 12, height: 12, opacity: 0.4 }} />
                      </button>
                    </motion.div>
                  )}

                  {/* ===== REVIEWS ===== */}
                  {tab === 'reviews' && (
                    <motion.div key="r" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '16px' }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{avg}</div>
                            <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 5 }}>
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: 12, height: 12, fill: s <= Math.round(parseFloat(avg)) ? '#fbbf24' : 'rgba(255,255,255,0.12)', color: s <= Math.round(parseFloat(avg)) ? '#fbbf24' : 'rgba(255,255,255,0.12)' }} />)}
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 5, fontWeight: 600 }}>{reviewCount} reviews</div>
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {ratCounts.map(({ s, n, p }) => (
                              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontWeight: 700, width: 8, flexShrink: 0 }}>{s}</span>
                                <Star style={{ width: 9, height: 9, fill: '#fbbf24', color: '#fbbf24', flexShrink: 0 }} />
                                <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${p}%`, background: '#fbbf24', borderRadius: 99, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
                                </div>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', width: 12, textAlign: 'right', flexShrink: 0 }}>{n}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button onClick={() => setShowRate(true)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: `1px solid ${c.border}`, background: c.bg, color: c.color }}>
                        <MessageSquare style={{ width: 14, height: 14 }} />Write a Review
                      </button>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(moreReviews ? REVIEWS : REVIEWS.slice(0, 2)).map((r, i) => <ReviewCard key={r.id || i} r={r} c={c} />)}
                      </div>

                      {REVIEWS.length > 2 && (
                        <button onClick={() => setMoreReviews(s => !s)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.38)' }}>
                          {moreReviews ? <><ChevronUp style={{ width: 14, height: 14 }} />Show Less</> : <><ChevronDown style={{ width: 14, height: 14 }} />Show All {reviewCount} Reviews</>}
                        </button>
                      )}
                    </motion.div>
                  )}

                  <div style={{ height: 8 }} />
                </div>
              </div>

              {/* ── Fixed CTA — 3D button style, no glow ── */}
              {!isOwner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, type: 'spring', stiffness: 200, damping: 28 }}
                  style={{ flexShrink: 0, padding: '12px 18px 28px', background: 'linear-gradient(to top,#060810 55%,transparent)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    onMouseDown={() => setBtnPressed(true)}
                    onMouseUp={() => setBtnPressed(false)}
                    onMouseLeave={() => setBtnPressed(false)}
                    onTouchStart={() => setBtnPressed(true)}
                    onTouchEnd={() => setBtnPressed(false)}
                    onClick={handleBook}
                    disabled={joinLoading}
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: 18,
                      fontSize: 15,
                      fontWeight: 900,
                      cursor: joinLoading ? 'default' : 'pointer',
                      letterSpacing: '-0.01em',
                      border: 'none',
                      // 3D effect: solid background + bottom border for depth + top highlight
                      background: isJoined
                        ? 'linear-gradient(180deg, rgba(16,185,129,0.28) 0%, rgba(5,150,105,0.22) 100%)'
                        : 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: isJoined ? '#34d399' : '#fff',
                      // Inset top highlight + bottom shadow for 3D depth
                      boxShadow: btnPressed
                        ? (isJoined
                            ? 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 0 rgba(0,0,0,0.4)'
                            : 'inset 0 2px 4px rgba(0,0,0,0.3), 0 1px 0 rgba(0,0,0,0.4)')
                        : (isJoined
                            ? 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(3,100,70,0.8), 0 5px 6px rgba(0,0,0,0.4)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 rgba(29,78,216,0.9), 0 5px 6px rgba(0,0,0,0.4)'),
                      transform: btnPressed ? 'translateY(3px)' : 'translateY(0)',
                      outline: isJoined ? '1px solid rgba(52,211,153,0.3)' : 'none',
                      opacity: joinLoading ? 0.7 : 1,
                      transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.3s ease, color 0.3s ease',
                    }}>
                    {ctaLabel}
                  </button>
                </motion.div>
              )}

              {/* Leave confirmation modal */}
              <AnimatePresence>
                {showLeaveConfirm && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setShowLeaveConfirm(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 10400, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                      style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10401, width: 320, maxWidth: '90vw',
                        background: 'linear-gradient(160deg,#0d1232 0%,#060810 100%)',
                        border: '1px solid rgba(248,113,113,0.25)', borderRadius: 20, padding: '24px 22px 20px' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Leave this class?</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55, marginBottom: 20 }}>
                        You'll be removed from <strong style={{ color: '#fff' }}>{className}</strong>. You can rejoin at any time.
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setShowLeaveConfirm(false)}
                          style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          Cancel
                        </button>
                        <button onClick={handleJoinLeave} disabled={joinLoading}
                          style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: joinLoading ? 0.7 : 1 }}>
                          {joinLoading ? 'Leaving…' : 'Leave Class'}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <QRModal open={showQR} onClose={() => setShowQR(false)} gymClass={gymClass} c={c} />
      <RateSheet open={showRate} onClose={() => setShowRate(false)} c={c} className={className} />
      <CoachProfileModal
        open={showCoachProfile}
        onClose={() => setShowCoachProfile(false)}
        coach={gymClass.instructor || gymClass.coach_name ? { name: instructor, title: 'Coach', gym_name: gymClass.gym_name } : null}
      />
    </>
  );
}