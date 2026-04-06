import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Users, MapPin, Star, Calendar, Dumbbell,
  ChevronRight, Zap, Heart, Share2, Bell, CheckCircle,
  TrendingUp, Info, QrCode, UserPlus, MessageSquare,
  ChevronDown, ChevronUp, Award, Repeat, ExternalLink,
  ThumbsUp, Tag, Wifi, AlertCircle, Flame,
} from 'lucide-react';
// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA SHAPE (documents the expected data model for this component)
// ─────────────────────────────────────────────────────────────────────────────
//
// CLASS_SESSION {
//   id                  : string | number       — unique session identifier
//   class_name          : string                — e.g. "CrossFit Madness"
//   instructor_id       : string                — FK → INSTRUCTOR.id
//   instructor          : string                — resolved display name (denorm)
//   cover_image_url     : string                — URL for hero background
//   description         : string                — overview text
//   start_time          : ISO string | Date     — exact session start datetime
//   end_time            : ISO string | Date     — exact session end datetime
//   duration_minutes    : number                — e.g. 60
//   max_capacity        : number                — total spots
//   attendees           : Attendee[]            — booked attendees (status='booked')
//   intensity_level     : string                — "All Levels" | "Beginner" | "Intermediate" | "Advanced"
//   equipment_needed    : string | string[]     — e.g. "Dumbbells, Mat"
//   estimated_calories  : number                — e.g. 420
//   category            : string                — "HIIT" | "Yoga" | "Strength" | …
//   cancellation_policy : string                — policy text
//   average_rating      : number                — e.g. 4.7
//   review_count        : number                — total review count
//   reviews             : Review[]              — Review objects (see below)
//   location            : string                — room / studio name
//   is_virtual          : boolean
//   price_drop_in       : number | null
//   price_member        : number | null
//   schedule            : string | object[]     — legacy or recurring schedule info
// }
//
// ATTENDEE { id, name, avatar?, color?, status: 'booked'|'waitlisted'|'cancelled' }
//
// REVIEW {
//   id          : string
//   reviewer_id : string
//   name        : string
//   initials    : string
//   rating      : number   (1–5)
//   comment     : string
//   created_at  : ISO string | Date
//   likes       : number
// }
// ─────────────────────────────────────────────────────────────────────────────
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
  default:  { label:'Class',    emoji:'🎯', color:'#38bdf8', rgb:'56,189,248',  bg:'rgba(14,165,233,0.10)', border:'rgba(14,165,233,0.2)',  glow:'rgba(14,165,233,0.2)' },
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
`;
function injectCSS(){if(!document.getElementById('cdm-css')){const s=document.createElement('style');s.id='cdm-css';s.textContent=CSS;document.head.appendChild(s);}}
// ── Derive category/type from class_name OR category field ────────────────────
function classType(c) {
  // Prefer explicit category field from schema
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
  // Fallback: infer from class_name
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
// ── Helpers for new schema fields ─────────────────────────────────────────────
/** Resolve display name — uses class_name first, falls back to legacy name/title */
function getClassName(c) {
  return c.class_name || c.name || c.title || 'Untitled Class';
}
/** Resolve instructor name — uses instructor field (string) or coach_name */
function getInstructor(c) {
  return c.instructor || c.coach_name || null;
}
/** Resolve cover image — uses cover_image_url first, then image_url, then type-based default */
function getCoverImage(c, tk) {
  return c.cover_image_url || c.image_url || IMGS[tk] || IMGS.default;
}
/** Resolve capacity — uses max_capacity first, then capacity/max_participants */
function getCapacity(c) {
  return c.max_capacity ?? c.capacity ?? c.max_participants ?? null;
}
/** Resolve enrolled count from attendees array (booked only) or fallback integer fields */
function getEnrolled(c) {
  if (Array.isArray(c.attendees)) {
    return c.attendees.filter(a => !a.status || a.status === 'booked').length;
  }
  return c.enrolled ?? c.participants_count ?? 0;
}
/** Resolve intensity — uses intensity_level first, then difficulty */
function getIntensity(c) {
  const raw = c.intensity_level || c.difficulty || 'All Levels';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
/** Resolve equipment — handles string or array */
function getEquipment(c) {
  if (!c.equipment_needed) return c.equipment || 'Standard gym equipment';
  if (Array.isArray(c.equipment_needed)) return c.equipment_needed.join(', ');
  return c.equipment_needed;
}
/** Resolve estimated calories */
function getCalories(c) {
  if (c.estimated_calories) return `~${c.estimated_calories} kcal`;
  if (c.calories) return `~${c.calories} kcal`;
  if (c.duration_minutes) return `~${Math.round(c.duration_minutes * 7)} kcal`;
  return 'Varies';
}
/** Resolve cancellation policy */
function getCancellationPolicy(c) {
  return c.cancellation_policy || 'Cancel up to 4 hours before class starts for a full refund. Late cancellations may incur a fee.';
}
/** Resolve average rating — uses average_rating first, then falls back to computing from reviews */
function getAverageRating(c, reviews) {
  if (c.average_rating != null) return parseFloat(c.average_rating).toFixed(1);
  if (reviews.length > 0) return (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
  return '0.0';
}
/** Resolve review count */
function getReviewCount(c, reviews) {
  return c.review_count ?? reviews.length;
}
/** Resolve reviews array — uses c.reviews if present, otherwise mock data */
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
  // Mock fallback for demo/dev
  return [
    { initials:'AJ', name:'Alex J.',  rating:5, date:'2 days ago',  text:'Absolutely loved this class. High energy throughout — left feeling genuinely accomplished.', likes:12 },
    { initials:'SK', name:'Sara K.',  rating:4, date:'1 week ago',  text:'Well structured session. Warm-up could be longer but overall highly recommend.', likes:7 },
    { initials:'MP', name:'Mike P.',  rating:5, date:'2 weeks ago', text:'Best class at this gym. Consistent quality every single week.', likes:4 },
    { initials:'LB', name:'Laura B.', rating:4, date:'3 weeks ago', text:'Great for all fitness levels. The instructor is really encouraging.', likes:3 },
  ];
}
/** Format ISO date string to relative time label */
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
/** Format datetime for display — returns { date, time } strings */
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
// ── Reusable micro-components ─────────────────────────────────────────────────
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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color}99,transparent)` }} />
      <Icon style={{ width: 17, height: 17, color, margin: '0 auto 7px', filter: `drop-shadow(0 0 5px ${color}55)` }} />
      <div style={{ fontSize: 13, fontWeight: 900, color: subColor || '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );
}
function SectionHead({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>;
}
// ── QR Check-in ───────────────────────────────────────────────────────────────
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
// ── Rate & Review sheet ───────────────────────────────────────────────────────
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
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32, mass: 1.1 }}
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
                    boxShadow: rating > 0 ? '0 6px 24px rgba(37,99,235,0.4),inset 0 1px 0 rgba(255,255,255,0.2)' : 'none', transition: 'all 0.2s' }}>
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
// ── Review card ───────────────────────────────────────────────────────────────
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
// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function ClassDetailModal({
  gymClass,
  open,
  onClose,
  booked: initBooked = false,
  onBook,
  isOwner = false,
  friendsBooked = [],
}) {
  const [booked, setBooked]           = useState(initBooked);
  const [waitlist, setWaitlist]       = useState(false);
  const [saved, setSaved]             = useState(false);
  const [reminded, setReminded]       = useState(false);
  const [recurring, setRecurring]     = useState(false);
  const [showQR, setShowQR]           = useState(false);
  const [showRate, setShowRate]       = useState(false);
  const [toast, setToast]             = useState('');
  const [moreReviews, setMoreReviews] = useState(false);
  const [bookAnim, setBookAnim]       = useState(false);
  const [tab, setTab]                 = useState('details');
  useEffect(() => { setBooked(initBooked); }, [initBooked]);
  useEffect(() => { injectCSS(); }, []);
  if (!gymClass) return null;
  // ── Resolve all schema fields ──────────────────────────────────────────────
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
  // Resolve reviews
  const REVIEWS     = getReviews(gymClass);
  const avg         = getAverageRating(gymClass, REVIEWS);
  const reviewCount = getReviewCount(gymClass, REVIEWS);
  // Resolve start/end times
  const startDT     = formatDateTime(gymClass.start_time);
  const endDT       = formatDateTime(gymClass.end_time);
  const barColor    = full
    ? 'linear-gradient(90deg,#dc2626,#f87171)'
    : pct > 65
      ? 'linear-gradient(90deg,#d97706,#fbbf24)'
      : `linear-gradient(90deg,${c.color}88,${c.color})`;
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2300); };
  const handleBook = () => {
    if (full && !booked && !waitlist) { setWaitlist(true); showToast("Added to waitlist — you'll be notified!"); return; }
    setBookAnim(true);
    setTimeout(() => {
      const nb = !booked;
      setBooked(nb); if (nb) setWaitlist(false);
      setBookAnim(false);
      onBook && onBook(gymClass.id);
      if (nb) showToast('Booked! See you there 🎉');
    }, 280);
  };
  const ratCounts = [5, 4, 3, 2, 1].map(s => ({
    s,
    n: REVIEWS.filter(r => r.rating === s).length,
    p: Math.round(REVIEWS.filter(r => r.rating === s).length / REVIEWS.length * 100),
  }));
  // Build upcoming sessions list
  const today    = new Date();
  const sessions = days.slice(0, 4).map((d, i) => {
    const dt   = new Date(today);
    const di   = DAYS.indexOf(d);
    const ti   = today.getDay() === 0 ? 6 : today.getDay() - 1;
    let diff   = di - ti; if (diff <= 0) diff += 7;
    dt.setDate(today.getDate() + diff + (i > 0 ? 7 : 0));
    return {
      d,
      date: dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      spots: left !== null ? Math.max(0, left - i * 2) : null,
      isNext: i === 0,
    };
  });
  // Attendees list (merge friendsBooked + attendees from schema + mock fill)
  const MOCK_ATT = [
    { id: 'a1', name: 'Alex M.', color: '#3b82f6' },
    { id: 'a2', name: 'Sara K.', color: '#8b5cf6' },
    { id: 'a3', name: 'Tom B.',  color: '#10b981' },
    { id: 'a4', name: 'Jen L.',  color: '#f59e0b' },
  ];
  const schemaAttendees = Array.isArray(gymClass.attendees)
    ? gymClass.attendees.filter(a => !a.status || a.status === 'booked').slice(0, 4)
    : [];
  const att   = [...friendsBooked, ...(schemaAttendees.length ? schemaAttendees : MOCK_ATT)].slice(0, 5);
  const extra = Math.max(0, enr - att.length);
  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={onClose}
              style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(2,4,10,0.87)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} />
            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div key="t" initial={{ opacity: 0, y: 18, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
                  style={{ position: 'fixed', bottom: 130, left: '50%', transform: 'translateX(-50%)', zIndex: 10300,
                    background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
                    padding: '11px 20px', fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
                    backdropFilter: 'blur(20px)', boxShadow: `0 4px 24px rgba(${c.rgb},0.22)` }}>
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>
            {/* Sheet */}
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32, mass: 1.1 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
                maxHeight: '95vh', display: 'flex', flexDirection: 'column',
                borderRadius: '26px 26px 0 0',
                background: 'linear-gradient(160deg,#0c1128 0%,#060810 100%)',
                border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
                boxShadow: `0 -16px 60px rgba(0,0,0,0.7),0 0 0 1px rgba(${c.rgb},0.07),inset 0 1px 0 rgba(255,255,255,0.06)` }}>
              {/* Colour top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '26px 26px 0 0', background: `linear-gradient(90deg,transparent 0%,${c.color} 30%,rgba(${c.rgb},0.9) 50%,${c.color} 70%,transparent 100%)` }} />
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0', flexShrink: 0 }}>
                <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
              </div>
              {/* Scroll body */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
                {/* ── HERO ── */}
                <div style={{ position: 'relative', height: 245, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={img} alt={className} style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'cdm-hero-in 0.6s cubic-bezier(0.16,1,0.3,1) both' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(6,8,18,0.97) 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 75% 25%,rgba(${c.rgb},0.14) 0%,transparent 60%)` }} />
                  {/* Actions row */}
                  <div style={{ position: 'absolute', top: 13, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.color, background: 'rgba(0,0,0,0.62)', border: `1px solid ${c.border}`, borderRadius: 20, padding: '5px 11px', backdropFilter: 'blur(12px)' }}>
                      <span style={{ fontSize: 13 }}>{c.emoji}</span>{category}
                      {gymClass.is_virtual && <><span style={{ margin: '0 2px', opacity: 0.4 }}>·</span><Wifi style={{ width: 10, height: 10 }} />Virtual</>}
                    </motion.div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      {[
                        { I: Heart, act: () => setSaved(s => !s), on: saved, ac: '#f472b6' },
                        { I: Share2, act: () => { try { navigator.clipboard.writeText(className); } catch {} showToast('Link copied 🔗'); } },
                        { I: X, act: onClose },
                      ].map(({ I, act, on, ac }, i) => (
                        <motion.button key={i} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                          onClick={act}
                          style={{ width: 35, height: 35, borderRadius: '50%', background: 'rgba(0,0,0,0.58)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)' }}>
                          <I style={{ width: 14, height: 14, color: on ? ac : '#fff', fill: on && ac ? ac : 'none', transition: 'all 0.2s' }} />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {/* Title */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 16px' }}>
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 28, mass: 1.05 }}>
                      {/* Status pills */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
                        {booked && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#34d399', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 20, padding: '3px 9px' }}><CheckCircle style={{ width: 9, height: 9 }} />Booked</span>}
                        {waitlist && !booked && <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '3px 9px' }}>⏳ On Waitlist</span>}
                        {full && !booked && !waitlist && <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#f87171', background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 20, padding: '3px 9px' }}>Class Full</span>}
                        {hot && !full && <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 20, padding: '3px 9px' }}>🔥 {left} left</span>}
                      </div>
                      <h2 style={{ fontSize: 25, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.12, margin: '0 0 12px', textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
                        {className}
                      </h2>
                      {/* Instructor + rating */}
                      {instructor && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 33, height: 33, borderRadius: '50%', background: `linear-gradient(135deg,${c.color}55,${c.color}22)`, border: `1.5px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: c.color, flexShrink: 0, boxShadow: `0 0 10px ${c.glow}` }}>
                              {ini(instructor)}
                            </div>
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{instructor}</div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 600, marginTop: 2 }}>Lead Instructor</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ display: 'flex', gap: 1 }}>
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: 10, height: 10, fill: s <= Math.round(parseFloat(avg)) ? '#fbbf24' : 'rgba(255,255,255,0.15)', color: s <= Math.round(parseFloat(avg)) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }} />)}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{avg}</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>({reviewCount})</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
                {/* ── Section tabs ── */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingLeft: 18 }}>
                  {['details', 'schedule', 'reviews'].map(s => (
                    <button key={s} onClick={() => setTab(s)}
                      style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, textTransform: 'capitalize', letterSpacing: '0.02em', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === s ? c.color : 'transparent'}`, color: tab === s ? c.color : 'rgba(255,255,255,0.32)', transition: 'color 0.2s ease, border-color 0.2s ease', marginBottom: -1 }}>
                      {s}
                    </button>
                  ))}
                </div>
                {/* ── Tab content ── */}
                <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* ===== DETAILS ===== */}
                  {tab === 'details' && (
                    <motion.div key="d" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {/* Stats row — uses schema fields */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                        <StatCard icon={Clock}  label="Duration" value={gymClass.duration_minutes ? `${gymClass.duration_minutes} min` : '—'} color={c.color} />
                        <StatCard icon={Users}  label={cap ? `${enr}/${cap}` : 'Spots'} value={full ? 'Full' : left !== null ? `${left} open` : 'Open'} color={full ? '#f87171' : c.color} subColor={full ? '#f87171' : '#fff'} />
                        <StatCard icon={Zap}    label="Level"    value={intensity} color={c.color} />
                      </div>
                      {/* Start / End time — new schema fields */}
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
                      {/* Who's going — uses attendees from schema */}
                      {att.length > 0 && (
                        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '13px 15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                            <SectionHead>Who's Going</SectionHead>
                            {enr > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.38)' }}>{enr} attending</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {att.map((a, i) => (
                                <div key={a.id || i} style={{ width: 32, height: 32, borderRadius: '50%', background: a.color || c.color, border: '2px solid rgba(6,8,18,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', marginLeft: i > 0 ? -10 : 0, zIndex: att.length - i, overflow: 'hidden', flexShrink: 0 }}>
                                  {a.avatar ? <img src={a.avatar} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(a.name)}
                                </div>
                              ))}
                              {extra > 0 && <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(6,8,18,1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginLeft: -10, flexShrink: 0 }}>+{extra}</div>}
                            </div>
                            {friendsBooked.length > 0 && <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{friendsBooked[0]?.name}{friendsBooked.length > 1 ? ` +${friendsBooked.length - 1} friend${friendsBooked.length > 2 ? 's' : ''} ` : ' '}going</div>}
                            <button onClick={() => showToast('Invite link copied!')}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: c.color, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '6px 11px', cursor: 'pointer', flexShrink: 0 }}>
                              <UserPlus style={{ width: 11, height: 11 }} />Invite
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Description — uses description field */}
                      {gymClass.description && (
                        <div>
                          <SectionHead>About This Class</SectionHead>
                          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{gymClass.description}</p>
                        </div>
                      )}
                      {/* Details list — all resolved from schema helpers */}
                      <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 15px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <SectionHead>Class Details</SectionHead>
                        </div>
                        <div style={{ padding: '6px 15px 12px' }}>
                          {[
                            { I: Zap,        l: 'Intensity',       v: intensity },
                            { I: Dumbbell,   l: 'Equipment',       v: equipment },
                            { I: Flame,      l: 'Est. Calories',   v: calories },
                            { I: Award,      l: 'Category',        v: category },
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
                      {/* Cancellation policy — uses cancellation_policy field */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 14 }}>
                        <AlertCircle style={{ width: 14, height: 14, color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>Cancellation Policy</div>
                          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>{cancelPolicy}</div>
                        </div>
                      </div>
                      {/* Location */}
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
                      {/* Capacity bar — dynamically calculated from max_capacity & attendees */}
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
                      {/* Quick actions */}
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
                    <motion.div key="s" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Day pills */}
                      {days.length > 0 && (
                        <div>
                          <SectionHead>Weekly Days</SectionHead>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {DAYS.map(d => { const on = days.includes(d); return (
                              <div key={d} style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 11, fontSize: 9, fontWeight: 900, letterSpacing: '0.04em',
                                background: on ? `rgba(${c.rgb},0.15)` : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${on ? c.border : 'rgba(255,255,255,0.06)'}`,
                                color: on ? c.color : 'rgba(255,255,255,0.2)',
                                boxShadow: on ? `0 0 10px rgba(${c.rgb},0.15)` : 'none' }}>
                                {d}
                              </div>
                            ); })}
                          </div>
                        </div>
                      )}
                      {/* Recurring toggle (only if booked) */}
                      {booked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD_BG, border: CARD_BORDER, borderRadius: 14, padding: '13px 15px' }}>
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
                      {/* Upcoming sessions */}
                      {sessions.length > 0 && (
                        <div>
                          <SectionHead>Upcoming Sessions</SectionHead>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {sessions.map((s, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12,
                                background: s.isNext ? `rgba(${c.rgb},0.06)` : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${s.isNext ? c.border : 'rgba(255,255,255,0.05)'}`,
                                borderRadius: 14, padding: '11px 13px' }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: CARD_BG, border: CARD_BORDER, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 900, color: s.isNext ? c.color : '#fff', lineHeight: 1 }}>{s.date.split(' ')[0]}</div>
                                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', lineHeight: 1, marginTop: 2 }}>{s.date.split(' ')[1]}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.d}</span>
                                    {s.isNext && <span style={{ fontSize: 9, fontWeight: 900, color: c.color, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '1px 6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Next</span>}
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                                    {/* Show start_time if available, else legacy schedule string */}
                                    {startDT.time
                                      ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>{startDT.time}{endDT.time ? ` – ${endDT.time}` : ''}</span>
                                      : gymClass.schedule && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>{typeof gymClass.schedule === 'string' ? gymClass.schedule : ''}</span>
                                    }
                                    {s.spots !== null && <span style={{ fontSize: 11, color: s.spots <= 3 ? '#fbbf24' : 'rgba(255,255,255,0.28)', fontWeight: 600 }}>{s.spots <= 0 ? 'Full' : `${s.spots} spots`}</span>}
                                  </div>
                                </div>
                                {!isOwner && (
                                  <button onClick={handleBook}
                                    style={{ fontSize: 11, fontWeight: 800, color: booked && s.isNext ? '#34d399' : c.color, background: booked && s.isNext ? 'rgba(16,185,129,0.1)' : c.bg, border: `1px solid ${booked && s.isNext ? 'rgba(52,211,153,0.3)' : c.border}`, borderRadius: 10, padding: '7px 13px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                                    {booked && s.isNext ? '✓ Booked' : 'Book'}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Add to calendar */}
                      <button onClick={() => showToast('Opening calendar…')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)' }}>
                        <Calendar style={{ width: 14, height: 14 }} />Add to Calendar<ExternalLink style={{ width: 12, height: 12, opacity: 0.4 }} />
                      </button>
                    </motion.div>
                  )}
                  {/* ===== REVIEWS ===== */}
                  {tab === 'reviews' && (
                    <motion.div key="r" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Rating overview — uses average_rating & review_count from schema */}
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
                      {/* Reviews — resolved from c.reviews or mock */}
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
              {/* ── Fixed CTA ── */}
              {!isOwner && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, type: 'spring', stiffness: 200, damping: 28 }}
                  style={{ flexShrink: 0, padding: '12px 18px 34px', background: 'linear-gradient(to top,#060810 55%,transparent)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {pct !== null && !full && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Bar pct={pct} color={barColor} anim={false} h={4} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: pct > 65 ? '#fbbf24' : 'rgba(255,255,255,0.32)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {left} spot{left === 1 ? '' : 's'} left
                      </span>
                    </div>
                  )}
                  <button onClick={handleBook}
                    style={{ width: '100%', padding: '16px', borderRadius: 18, fontSize: 15, fontWeight: 900, cursor: 'pointer', border: 'none', letterSpacing: '-0.01em', position: 'relative', overflow: 'hidden',
                      background: booked ? 'linear-gradient(135deg,rgba(16,185,129,0.25),rgba(5,150,105,0.2))' : waitlist ? 'linear-gradient(135deg,rgba(251,191,36,0.2),rgba(217,119,6,0.15))' : full ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                      color: booked ? '#34d399' : waitlist ? '#fbbf24' : full ? 'rgba(255,255,255,0.28)' : '#fff',
                      boxShadow: booked ? '0 4px 20px rgba(16,185,129,0.25),inset 0 1px 0 rgba(255,255,255,0.1)' : waitlist ? '0 4px 20px rgba(251,191,36,0.2)' : full ? 'none' : '0 6px 28px rgba(37,99,235,0.5),inset 0 1px 0 rgba(255,255,255,0.2)',
                      outline: booked ? '1px solid rgba(52,211,153,0.3)' : waitlist ? '1px solid rgba(251,191,36,0.3)' : 'none',
                      transform: bookAnim ? 'scale(0.96) translateY(2px)' : 'scale(1) translateY(0)', transition: 'transform 0.18s cubic-bezier(0.34,1.5,0.64,1),background 0.3s ease,box-shadow 0.3s ease' }}>
                    {!booked && !waitlist && !full && (
                      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', animation: 'cdm-shimmer 4s cubic-bezier(0.4,0,0.6,1) infinite 2s' }} />
                      </div>
                    )}
                    <span style={{ position: 'relative', zIndex: 1 }}>
                      {bookAnim ? '…' : booked ? '✓ Booked — Tap to Cancel' : waitlist ? '⏳ On Waitlist — Tap to Leave' : full ? 'Join Waitlist' : left !== null ? `Book Now — ${left} spot${left === 1 ? '' : 's'} left` : 'Book Now'}
                    </span>
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <QRModal open={showQR} onClose={() => setShowQR(false)} gymClass={gymClass} c={c} />
      <RateSheet open={showRate} onClose={() => setShowRate(false)} c={c} className={className} />
    </>
  );
}
