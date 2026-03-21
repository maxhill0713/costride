import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Users, MapPin, Star, Calendar, Dumbbell,
  ChevronRight, Zap, Heart, Share2, Bell, CheckCircle,
  TrendingUp, Award, Repeat, ExternalLink, MessageSquare,
  AlertCircle, UserPlus, QrCode, Shield, Tag,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   SHARED DESIGN TOKENS — mirrors ClassDetailModal exactly
───────────────────────────────────────────────────────────────────────────── */
const CARD_BG     = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';
const SHEET_BG    = 'linear-gradient(160deg,#0c1128 0%,#060810 100%)';

/* Class-type palette — same object as ClassDetailModal */
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
  hiit:     'https://images.unsplash.com/photo-1517963879433-6ad2171073a4?w=800&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  cardio:   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
  spin:     'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  boxing:   'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80',
  pilates:  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
  default:  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  coach:    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
};

const CSS = `
@keyframes cpm-shimmer {
  0%   { transform: translateX(-100%); opacity: 0; }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateX(220%); opacity: 0; }
}
@keyframes cpm-bar    { from { width: 0; } }
@keyframes cpm-pop    { 0%{transform:scale(0.6) translateY(10px);opacity:0} 55%{transform:scale(1.07) translateY(-2px);opacity:1} 78%{transform:scale(0.97) translateY(0)} 100%{transform:scale(1) translateY(0);opacity:1} }
@keyframes cpm-fade-up{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes cpm-hero-in{ from{opacity:0.6;transform:scale(1.05)} to{opacity:1;transform:scale(1)} }
@keyframes cpm-pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes cpm-glow   { 0%,100%{opacity:.6} 50%{opacity:1} }
`;

function injectCSS() {
  if (!document.getElementById('cpm-css')) {
    const s = document.createElement('style');
    s.id = 'cpm-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function classType(name = '') {
  const n = name.toLowerCase();
  if (n.includes('hiit') || n.includes('interval'))               return 'hiit';
  if (n.includes('yoga') || n.includes('zen'))                    return 'yoga';
  if (n.includes('strength') || n.includes('weight') || n.includes('power') || n.includes('lift')) return 'strength';
  if (n.includes('cardio') || n.includes('aerobic') || n.includes('zumba')) return 'cardio';
  if (n.includes('spin') || n.includes('cycle') || n.includes('bike'))      return 'spin';
  if (n.includes('box') || n.includes('mma') || n.includes('kickbox'))      return 'boxing';
  if (n.includes('pilates') || n.includes('barre'))                          return 'pilates';
  return 'default';
}

/* ─── Shared micro-components ────────────────────────────────────────────────
   Identical API to ClassDetailModal so both files can share them             */
function Bar({ pct, color, anim = true, h = 6 }) {
  return (
    <div style={{ height: h, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, animation: anim ? 'cpm-bar 1.1s cubic-bezier(0.16,1,0.3,1) both' : 'none' }} />
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 99, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '50%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)', animation: 'cpm-shimmer 3.2s cubic-bezier(0.4,0,0.6,1) infinite' }} />
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

/* ─── Demo data ──────────────────────────────────────────────────────────────── */
const DEMO_COACH = {
  name: 'Serena Voss',
  title: 'Elite Performance Coach',
  rating: 4.9,
  review_count: 214,
  experience_years: 11,
  total_clients: 840,
  sessions_completed: 3200,
  response_time: '< 1 hr',
  bio: "I specialise in high-performance training and body recomposition. My philosophy: train smarter, recover harder, build habits that outlast any programme. Whether you're stepping on stage or just stepping up your game — I'll get you there.",
  location: 'New York, NY',
  member_since: '2019',
  image_url: IMGS.coach,
  specialties: ['Body Recomposition', 'Strength & Power', 'HIIT', 'Mobility', 'Nutrition'],
  certifications: [
    { name: 'NASM Certified Personal Trainer', org: 'NASM',               year: '2020' },
    { name: 'Precision Nutrition Level 2',      org: 'Precision Nutrition', year: '2021' },
    { name: 'FMS Specialist',                   org: 'FMS',                year: '2019' },
    { name: 'ISSA Strength & Conditioning',     org: 'ISSA',               year: '2022' },
  ],
  next_available: 'Tomorrow · 7:00 AM',
  price_per_session: 85,
  classes: [
    { id: 'c1', name: 'Power Hour',  duration_minutes: 60, difficulty: 'all_levels',   schedule: '6:00 AM', days: 'Mon · Wed · Fri', capacity: 12, enrolled: 9,  location: 'Studio 2' },
    { id: 'c2', name: 'HIIT Ignite', duration_minutes: 45, difficulty: 'intermediate', schedule: '7:30 AM', days: 'Tue · Thu',       capacity: 10, enrolled: 9,  location: 'Main Floor' },
    { id: 'c3', name: 'Strength Lab',duration_minutes: 75, difficulty: 'advanced',     schedule: '9:00 AM', days: 'Saturday',        capacity: 8,  enrolled: 3,  location: 'Weight Room' },
    { id: 'c4', name: 'Core & Flex', duration_minutes: 30, difficulty: 'all_levels',   schedule: '12:00 PM',days: 'Mon · Wed',       capacity: 15, enrolled: 8,  location: 'Studio 1' },
  ],
  reviews: [
    { initials: 'JR', name: 'Jamie R.',  rating: 5, date: '2 days ago',   text: "Transformed my approach to training. Down 18 kg in five months — Serena's programming is genuinely elite.", likes: 18, tag: 'Personal Training' },
    { initials: 'MT', name: 'Marcus T.', rating: 5, date: '1 week ago',   text: "Extraordinary ability to push you past your limits while keeping everything safe and purposeful. Best investment I've made.", likes: 12, tag: 'HIIT Ignite' },
    { initials: 'PS', name: 'Priya S.',  rating: 5, date: '1 month ago',  text: "Nutrition coaching alongside PT sessions is a game changer. I feel better at 38 than I did at 28.", likes: 9, tag: 'Nutrition' },
    { initials: 'DK', name: 'David K.',  rating: 5, date: '2 months ago', text: "Squat went from 80 kg to 140 kg in six months. Absolutely unreal.", likes: 7, tag: 'Strength Lab' },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════════ */
export default function CoachProfileModal({
  coach         = DEMO_COACH,
  open          = true,
  onClose       = () => {},
  onClassSelect = null,   // (classObj) => void — hook into ClassDetailModal
  bookedClasses = [],     // array of class IDs already booked
}) {
  const [liked,      setLiked]      = useState(false);
  const [reminded,   setReminded]   = useState(false);
  const [tab,        setTab]        = useState('about');
  const [toast,      setToast]      = useState('');
  const [moreRev,    setMoreRev]    = useState(false);
  const [bookAnim,   setBookAnim]   = useState(false);
  const [contacted,  setContacted]  = useState(false);

  useEffect(() => { injectCSS(); }, []);

  if (!coach) return null;

  const heroImg  = coach.image_url || IMGS.coach;
  const avgRating = coach.rating || (
    coach.reviews?.length
      ? (coach.reviews.reduce((a, r) => a + r.rating, 0) / coach.reviews.length).toFixed(1)
      : '—'
  );

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const handleContact = () => {
    setBookAnim(true);
    setTimeout(() => {
      setContacted(true);
      setBookAnim(false);
      showToast('Message sent! Serena typically replies in < 1 hr 💬');
    }, 260);
  };

  const reviews    = coach.reviews || [];
  const ratCounts  = [5, 4, 3, 2, 1].map(s => ({
    s, n: reviews.filter(r => r.rating === s).length,
    p: reviews.length ? Math.round(reviews.filter(r => r.rating === s).length / reviews.length * 100) : 0,
  }));

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="bd"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={onClose}
              style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(2,4,10,0.87)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            />

            {/* Toast — identical to ClassDetailModal */}
            <AnimatePresence>
              {toast && (
                <motion.div key="toast"
                  initial={{ opacity: 0, y: 18, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
                  style={{ position: 'fixed', bottom: 130, left: '50%', transform: 'translateX(-50%)', zIndex: 10300, background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '11px 20px', fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', backdropFilter: 'blur(20px)', boxShadow: '0 4px 24px rgba(37,99,235,0.22)' }}>
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sheet */}
            <motion.div
              key="sh"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32, mass: 1.1 }}
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, maxHeight: '95vh', display: 'flex', flexDirection: 'column', borderRadius: '26px 26px 0 0', background: SHEET_BG, border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none', boxShadow: '0 -16px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

              {/* Top colour accent — matches ClassDetailModal */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '26px 26px 0 0', background: 'linear-gradient(90deg,transparent 0%,#2563eb 30%,rgba(59,130,246,0.9) 50%,#2563eb 70%,transparent 100%)' }} />

              {/* Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0', flexShrink: 0 }}>
                <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

                {/* ── HERO (same pattern as ClassDetailModal) ─────────────── */}
                <div style={{ position: 'relative', height: 240, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={heroImg} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', animation: 'cpm-hero-in 0.6s cubic-bezier(0.16,1,0.3,1) both' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.15) 0%,rgba(6,8,18,0.97) 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 25%,rgba(37,99,235,0.14) 0%,transparent 60%)' }} />

                  {/* Action buttons — same layout as ClassDetailModal */}
                  <div style={{ position: 'absolute', top: 13, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08, duration: 0.35 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38bdf8', background: 'rgba(0,0,0,0.62)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 20, padding: '5px 11px', backdropFilter: 'blur(12px)' }}>
                      🏅 Coach
                    </motion.div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      {[
                        { I: Heart,  act: () => setLiked(l => !l),           on: liked,    ac: '#f472b6' },
                        { I: Share2, act: () => showToast('Link copied 🔗'), on: false,    ac: null     },
                        { I: X,      act: onClose,                            on: false,    ac: null     },
                      ].map(({ I, act, on, ac }, i) => (
                        <motion.button key={i}
                          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                          onClick={act}
                          style={{ width: 35, height: 35, borderRadius: '50%', background: 'rgba(0,0,0,0.58)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)' }}>
                          <I style={{ width: 14, height: 14, color: on ? ac : '#fff', fill: on && ac ? ac : 'none', transition: 'all 0.2s' }} />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Hero identity — same bottom layout as ClassDetailModal */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 16px' }}>
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 28 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#34d399', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 20, padding: '3px 9px' }}>
                          <CheckCircle style={{ width: 9, height: 9 }} />Verified Coach
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 20, padding: '3px 9px' }}>
                          🟢 Available
                        </span>
                      </div>
                      <h2 style={{ fontSize: 25, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.12, margin: '0 0 12px', textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
                        {coach.name}
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 33, height: 33, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(37,99,235,0.55),rgba(37,99,235,0.22))', border: '1.5px solid rgba(59,130,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#60a5fa', boxShadow: '0 0 10px rgba(37,99,235,0.3)' }}>
                            {ini(coach.name)}
                          </div>
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{coach.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                              <MapPin style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.35)' }} />
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>{coach.location}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ display: 'flex', gap: 1 }}>
                            {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 10, height: 10, fill: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.15)', color: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }}/>)}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{avgRating}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>({coach.review_count || reviews.length})</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* ── Tab bar — identical style to ClassDetailModal ──────── */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingLeft: 18 }}>
                  {['about', 'classes', 'reviews'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, textTransform: 'capitalize', letterSpacing: '0.02em', cursor: 'pointer', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#2563eb' : 'transparent'}`, color: tab === t ? '#60a5fa' : 'rgba(255,255,255,0.32)', transition: 'color 0.2s ease, border-color 0.2s ease', marginBottom: -1 }}>
                      {t}
                    </button>
                  ))}
                </div>

                {/* ── Tab content ──────────────────────────────────────────── */}
                <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <AnimatePresence mode="wait">

                    {/* ═══ ABOUT ═══════════════════════════════════════════ */}
                    {tab === 'about' && (
                      <motion.div key="about"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Stat cards — exact same StatCard component */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                          <StatCard icon={TrendingUp} label="Experience" value={`${coach.experience_years} yrs`}  color="#38bdf8" />
                          <StatCard icon={Users}      label="Clients"    value={`${coach.total_clients}`}          color="#818cf8" />
                          <StatCard icon={Zap}        label="Sessions"   value={`${(coach.sessions_completed/1000).toFixed(1)}k`} color="#34d399" />
                        </div>

                        {/* Bio */}
                        {coach.bio && (
                          <div>
                            <SectionHead>About</SectionHead>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{coach.bio}</p>
                          </div>
                        )}

                        {/* Quick facts — same card list style */}
                        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, overflow: 'hidden' }}>
                          <div style={{ padding: '12px 15px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <SectionHead>Details</SectionHead>
                          </div>
                          <div style={{ padding: '6px 15px 12px' }}>
                            {[
                              { I: Shield,    l: 'Member since',  v: coach.member_since },
                              { I: MapPin,    l: 'Location',      v: coach.location },
                              { I: Clock,     l: 'Response time', v: coach.response_time },
                              { I: Star,      l: 'Avg rating',    v: `${avgRating} / 5.0` },
                              ...(coach.price_per_session ? [{ I: Tag, l: 'Per session', v: `£${coach.price_per_session}` }] : []),
                            ].map(({ I, l, v }, i, arr) => (
                              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <I style={{ width: 13, height: 13, color: '#38bdf8' }} />
                                </div>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', fontWeight: 600, flex: 1 }}>{l}</span>
                                <span style={{ fontSize: 13, color: '#fff', fontWeight: 700, textAlign: 'right' }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Specialty pills */}
                        <div>
                          <SectionHead>Specialties</SectionHead>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                            {(coach.specialties || []).map((s, i) => {
                              const tk = classType(s);
                              const cc = CFG[tk];
                              return (
                                <span key={i} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: cc.bg, border: `1px solid ${cc.border}`, color: cc.color }}>
                                  {cc.emoji} {s}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Certifications — same list row style as ClassDetailModal details */}
                        {(coach.certifications || []).length > 0 && (
                          <div>
                            <SectionHead>Certifications</SectionHead>
                            <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, overflow: 'hidden' }}>
                              {coach.certifications.map((c, i, arr) => {
                                const name = typeof c === 'string' ? c : c.name;
                                const sub  = typeof c === 'string' ? null : `${c.org} · ${c.year}`;
                                return (
                                  <motion.div key={i}
                                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <Award style={{ width: 14, height: 14, color: '#38bdf8' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)', lineHeight: 1.3 }}>{name}</div>
                                      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{sub}</div>}
                                    </div>
                                    <CheckCircle style={{ width: 14, height: 14, color: '#34d399', flexShrink: 0 }} />
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Cancellation / booking policy — same alert style */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 14 }}>
                          <AlertCircle style={{ width: 14, height: 14, color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>Booking Policy</div>
                            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>Cancel up to 4 hours before your session for a full refund. Late cancellations may incur a fee.</div>
                          </div>
                        </div>

                        {/* Quick actions row — same style as ClassDetailModal */}
                        <div style={{ display: 'flex', gap: 9 }}>
                          <button onClick={() => { setReminded(r => !r); showToast(reminded ? 'Reminder removed' : '⏰ Reminder set!'); }}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1px solid ${reminded ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.09)'}`, background: reminded ? 'rgba(251,191,36,0.07)' : 'rgba(255,255,255,0.03)', color: reminded ? '#fbbf24' : 'rgba(255,255,255,0.42)', transition: 'all 0.2s' }}>
                            <Bell style={{ width: 13, height: 13, fill: reminded ? '#fbbf24' : 'none' }} />{reminded ? 'Notifying ✓' : 'Notify Me'}
                          </button>
                          <button onClick={() => showToast('Share link copied 🔗')}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.42)', transition: 'all 0.2s' }}>
                            <UserPlus style={{ width: 13, height: 13 }} />Refer a Friend
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* ═══ CLASSES ══════════════════════════════════════════ */}
                    {tab === 'classes' && (
                      <motion.div key="classes"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        <SectionHead>{(coach.classes || []).length} Classes Available</SectionHead>

                        {/* Class rows — styled exactly like ClassDetailModal's upcoming sessions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(coach.classes || []).map((cls, i) => {
                            const tk      = classType(cls.name);
                            const cc      = CFG[tk];
                            const cap     = cls.capacity || 0;
                            const enr     = cls.enrolled || 0;
                            const left    = cap - enr;
                            const pct     = cap ? Math.min(100, Math.round(enr / cap * 100)) : 0;
                            const full    = left <= 0;
                            const hot     = left > 0 && left <= 3;
                            const isBooked = bookedClasses.includes(cls.id);
                            const barColor = full ? 'linear-gradient(90deg,#dc2626,#f87171)' : pct > 65 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : `linear-gradient(90deg,${cc.color}88,${cc.color})`;

                            return (
                              <motion.div key={cls.id || i}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                onClick={() => onClassSelect && onClassSelect({ ...cls, instructor: coach.name, coach_name: coach.name })}
                                style={{ background: CARD_BG, border: isBooked ? `1px solid rgba(52,211,153,0.35)` : CARD_BORDER, borderRadius: 16, overflow: 'hidden', cursor: onClassSelect ? 'pointer' : 'default', position: 'relative', transition: 'border-color 0.2s' }}>

                                {/* Colour top line — same as ClassDetailModal */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${cc.color}88,transparent)` }} />

                                <div style={{ padding: '14px 15px 12px', display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                                  {/* Class type icon block */}
                                  <div style={{ width: 42, height: 42, borderRadius: 13, background: cc.bg, border: `1px solid ${cc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, boxShadow: `0 0 14px ${cc.glow}` }}>
                                    {cc.emoji}
                                  </div>

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Name row */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{cls.name}</span>
                                        {isBooked && <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ Booked</span>}
                                        {hot && !full && !isBooked && <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', textTransform: 'uppercase' }}>🔥 {left} left</span>}
                                        {full && !isBooked && <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', textTransform: 'uppercase' }}>Full</span>}
                                      </div>
                                      {onClassSelect && <ChevronRight style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />}
                                    </div>

                                    {/* Meta row */}
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                                      {[
                                        { I: Clock,    v: cls.schedule || cls.time },
                                        { I: Calendar, v: cls.days },
                                        { I: Zap,      v: `${cls.duration_minutes || cls.duration} min` },
                                        { I: MapPin,   v: cls.location },
                                      ].filter(x => x.v).map(({ I, v }, j) => (
                                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <I style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)' }} />
                                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', fontWeight: 600 }}>{v}</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Capacity bar — same Bar component */}
                                    {cap > 0 && (
                                      <div>
                                        <Bar pct={pct} color={barColor} h={4} />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{enr}/{cap} enrolled</span>
                                          <span style={{ fontSize: 10, fontWeight: 700, color: full ? '#f87171' : pct > 65 ? '#fbbf24' : cc.color }}>{full ? 'Class full' : `${left} spot${left === 1 ? '' : 's'} left`}</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Difficulty badge */}
                                    {cls.difficulty && (
                                      <div style={{ marginTop: 7 }}>
                                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: cc.bg, border: `1px solid ${cc.border}`, color: cc.color }}>
                                          {cls.difficulty.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Add to calendar — same style */}
                        <button onClick={() => showToast('Opening calendar…')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)' }}>
                          <Calendar style={{ width: 14, height: 14 }} />Add All Classes to Calendar<ExternalLink style={{ width: 12, height: 12, opacity: 0.4 }} />
                        </button>
                      </motion.div>
                    )}

                    {/* ═══ REVIEWS ══════════════════════════════════════════ */}
                    {tab === 'reviews' && (
                      <motion.div key="reviews"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.22 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Rating overview — same layout as ClassDetailModal */}
                        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '16px' }}>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                              <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{avgRating}</div>
                              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 5 }}>
                                {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 12, height: 12, fill: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.12)', color: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.12)' }} />)}
                              </div>
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 5, fontWeight: 600 }}>{coach.review_count || reviews.length} reviews</div>
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

                        {/* Write review button — identical to ClassDetailModal */}
                        <button onClick={() => showToast('Review form coming soon…')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.08)', color: '#38bdf8' }}>
                          <MessageSquare style={{ width: 14, height: 14 }} />Write a Review
                        </button>

                        {/* Review cards — exact ReviewCard pattern */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(moreRev ? reviews : reviews.slice(0, 2)).map((r, i) => (
                            <motion.div key={i}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '13px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(56,189,248,0.44),rgba(56,189,248,0.22))', border: '1px solid rgba(56,189,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#38bdf8', flexShrink: 0 }}>
                                  {r.initials}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.name}</div>
                                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                                    {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 9, height: 9, fill: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.1)', color: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.1)' }} />)}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{r.date}</span>
                                  {r.tag && <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8' }}>{r.tag}</span>}
                                </div>
                              </div>
                              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.62, margin: 0 }}>{r.text}</p>
                            </motion.div>
                          ))}
                        </div>

                        {reviews.length > 2 && (
                          <button onClick={() => setMoreRev(s => !s)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.38)' }}>
                            {moreRev ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div style={{ height: 8 }} />
                </div>
              </div>

              {/* ── Fixed CTA — mirrors ClassDetailModal exactly ─────────── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, type: 'spring', stiffness: 200, damping: 28 }}
                style={{ flexShrink: 0, padding: '12px 18px 34px', background: 'linear-gradient(to top,#060810 55%,transparent)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

                {/* Next availability */}
                {coach.next_available && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'cpm-pulse 2s ease-in-out infinite' }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Next available</span>
                      <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>{coach.next_available}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>£{coach.price_per_session}<span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>/session</span></span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  {/* Message */}
                  <button onClick={handleContact}
                    style={{ width: 52, height: 52, borderRadius: 16, border: `1px solid ${contacted ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.09)'}`, background: contacted ? 'rgba(52,211,153,0.07)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
                    <MessageSquare style={{ width: 18, height: 18, color: contacted ? '#34d399' : 'rgba(255,255,255,0.5)' }} />
                  </button>

                  {/* Book session — shimmer button identical to ClassDetailModal */}
                  <button
                    style={{ flex: 1, height: 52, borderRadius: 16, fontSize: 15, fontWeight: 900, cursor: 'pointer', border: 'none', letterSpacing: '-0.01em', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', boxShadow: '0 6px 28px rgba(37,99,235,0.5),inset 0 1px 0 rgba(255,255,255,0.2)', transform: bookAnim ? 'scale(0.96) translateY(2px)' : 'scale(1) translateY(0)', transition: 'transform 0.18s cubic-bezier(0.34,1.5,0.64,1)' }}>
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', animation: 'cpm-shimmer 4s cubic-bezier(0.4,0,0.6,1) infinite 2s' }} />
                    </div>
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Calendar style={{ width: 16, height: 16 }} />
                      Book a Session
                      <ChevronRight style={{ width: 15, height: 15 }} strokeWidth={2.5} />
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
