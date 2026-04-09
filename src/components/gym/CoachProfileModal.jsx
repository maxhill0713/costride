import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Clock, Users, MapPin, Star, Calendar, Dumbbell,
  ChevronRight, Zap, Heart, Share2, Bell, CheckCircle,
  TrendingUp, Award, Repeat, ExternalLink, MessageSquare,
  AlertCircle, UserPlus, Shield, Tag, ChevronDown, ChevronUp,
  Filter, Target, Languages, Sparkles, Send, Trophy,
  BadgeCheck, ScanFace, ClipboardCheck, Flame, Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SLIDE VARIANTS — identical to ClassDetailModal
// ─────────────────────────────────────────────────────────────────────────────
const pageSlideVariants = {
  hidden:  { y: '100%', opacity: 1 },
  visible: {
    y: 0, opacity: 1,
    transition: { type: 'spring', stiffness: 380, damping: 36, mass: 1 },
  },
  exit: {
    y: '100%', opacity: 1,
    transition: { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — shared with ClassDetailModal (identical values)
// ─────────────────────────────────────────────────────────────────────────────
const CARD_BG     = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';
const SHEET_BG    = 'linear-gradient(160deg,#0c1128 0%,#060810 100%)';

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
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  coach:    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
  before1:  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80',
  after1:   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
  before2:  'https://images.unsplash.com/photo-1524678714210-9917a6c619c2?w=400&q=80',
  after2:   'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80',
};

// ─────────────────────────────────────────────────────────────────────────────
// CSS — same animation keyframe names as ClassDetailModal
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');
@keyframes cpm-shimmer{0%{transform:translateX(-100%);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(220%);opacity:0}}
@keyframes cpm-bar{from{width:0}}
@keyframes cpm-hero-in{from{opacity:0.6;transform:scale(1.05)}to{opacity:1;transform:scale(1)}}
@keyframes cpm-pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes cpm-pop{0%{transform:scale(0.6) translateY(10px);opacity:0}55%{transform:scale(1.07) translateY(-2px);opacity:1}78%{transform:scale(0.97) translateY(0)}100%{transform:scale(1) translateY(0);opacity:1}}
@keyframes cpm-fade-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes cpm-slide-in{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
.cpm-root{font-family:'Figtree',system-ui,sans-serif}
.cpm-scroll{overflow-y:auto;-ms-overflow-style:none;scrollbar-width:none}
.cpm-scroll::-webkit-scrollbar{display:none}
.cpm-hscroll{overflow-x:auto;-ms-overflow-style:none;scrollbar-width:none}
.cpm-hscroll::-webkit-scrollbar{display:none}
.cpm-btn{border:none;outline:none;cursor:pointer;transition:opacity .12s,transform .12s}
.cpm-btn:active{transform:scale(0.95)!important;opacity:.85}
.cpm-slot-row:hover{background:rgba(37,99,235,0.05)!important}
`;

function injectCSS() {
  if (!document.getElementById('cpm-css3')) {
    const s = document.createElement('style');
    s.id = 'cpm-css3';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function classType(name = '') {
  const n = name.toLowerCase();
  if (n.includes('hiit') || n.includes('interval'))              return 'hiit';
  if (n.includes('yoga') || n.includes('zen'))                   return 'yoga';
  if (n.includes('strength') || n.includes('weight') || n.includes('power') || n.includes('lift')) return 'strength';
  if (n.includes('cardio') || n.includes('aerobic') || n.includes('zumba')) return 'cardio';
  if (n.includes('spin') || n.includes('cycle'))                 return 'spin';
  if (n.includes('box') || n.includes('mma'))                    return 'boxing';
  if (n.includes('pilates') || n.includes('barre'))              return 'pilates';
  return 'default';
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MICRO-COMPONENTS — identical API to ClassDetailModal
// ─────────────────────────────────────────────────────────────────────────────

/** Animated fill bar — identical to ClassDetailModal's Bar */
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

/** Stat tile — identical to ClassDetailModal's StatCard */
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

/** Section heading — identical to ClassDetailModal's SectionHead */
function SectionHead({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{children}</div>
      {action}
    </div>
  );
}

/** Review card — matches ClassDetailModal's ReviewCard */
function ReviewCard({ r }) {
  const c = { color: '#38bdf8', border: 'rgba(56,189,248,0.25)', bg: 'rgba(56,189,248,0.12)' };
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '13px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${c.color}44,${c.color}22)`, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: c.color, flexShrink: 0 }}>
          {r.initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.name}</div>
          <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
            {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 9, height: 9, fill: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.1)', color: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.1)' }} />)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{r.date}</span>
          {r.tag && <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{r.tag}</span>}
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.62, margin: '0 0 8px' }}>{r.text}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontWeight: 600 }}>👍 {r.likes} helpful</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SLOT ROW — mirrors ClassDetailModal's SessionRow
// Displays an availability slot with date-block + info + radio selection
// ─────────────────────────────────────────────────────────────────────────────
function SlotRow({ slot, isSelected, onSelect, isFirst }) {
  const c = { color: '#38bdf8', rgb: '56,189,248', border: 'rgba(56,189,248,0.25)', bg: 'rgba(56,189,248,0.09)' };
  const spots = slot.spots ?? null;
  const full  = spots !== null && spots <= 0;
  const hot   = spots !== null && spots > 0 && spots <= 3;

  const badge = full
    ? { label: 'Full',       color: '#f87171', bg: 'rgba(239,68,68,0.13)',   border: 'rgba(239,68,68,0.25)' }
    : hot
      ? { label: `${spots} left`, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.28)' }
      : { label: 'Available', color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' };

  // Parse date components from slot.date string (e.g. "Tomorrow", "Fri 22 Mar")
  const isToday    = slot.date === 'Today';
  const isTomorrow = slot.date === 'Tomorrow';

  return (
    <motion.button
      onClick={() => !full && onSelect(slot)}
      whileTap={!full ? { scale: 0.985 } : {}}
      className="cpm-slot-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: '13px 14px', borderRadius: 16, cursor: full ? 'not-allowed' : 'pointer',
        border: `1px solid ${isSelected ? c.border : 'rgba(255,255,255,0.06)'}`,
        background: isSelected ? `rgba(${c.rgb},0.09)` : 'rgba(255,255,255,0.025)',
        boxShadow: isSelected ? `0 0 0 1px ${c.border}, 0 4px 20px rgba(${c.rgb},0.08)` : 'none',
        transition: 'all 0.18s cubic-bezier(0.25,0.46,0.45,0.94)',
        opacity: full ? 0.55 : 1,
        textAlign: 'left',
        animation: `cpm-fade-up 0.28s ease both`,
        animationDelay: `${isFirst * 0.04}s`,
      }}
    >
      {/* Day badge block — mirrors ClassDetailModal's date block */}
      <div style={{
        width: 46, height: 50, borderRadius: 12, flexShrink: 0,
        background: isSelected ? `rgba(${c.rgb},0.15)` : 'rgba(255,255,255,0.05)',
        border: `1px solid ${isSelected ? c.border : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s',
      }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: isSelected ? c.color : 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
          {slot.day}
        </div>
        <div style={{ fontSize: 15, fontWeight: 900, color: isSelected ? c.color : '#fff', lineHeight: 1.2, marginTop: 2 }}>
          {slot.time.split(':')[0]}
        </div>
        <div style={{ fontSize: 8.5, fontWeight: 700, color: isSelected ? c.color : 'rgba(255,255,255,0.3)', lineHeight: 1, marginTop: 1 }}>
          {slot.time.split(' ')[1] || 'AM'}
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
            {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : slot.date}
          </span>
          {(isToday || isTomorrow) && (
            <span style={{
              fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: isToday ? '#34d399' : c.color,
              background: isToday ? 'rgba(52,211,153,0.12)' : c.bg,
              border: `1px solid ${isToday ? 'rgba(52,211,153,0.25)' : c.border}`,
              borderRadius: 6, padding: '2px 6px',
            }}>
              {isToday ? 'Today' : 'Tomorrow'}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock style={{ width: 10, height: 10, flexShrink: 0 }} />
          {slot.time}
        </div>
      </div>

      {/* Availability badge + radio */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '4px 9px', borderRadius: 20, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, whiteSpace: 'nowrap' }}>
          {badge.label}
        </span>
        {!full && (
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

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE SHEET — mirrors ClassDetailModal's RateSheet bottom sheet pattern
// ─────────────────────────────────────────────────────────────────────────────
function MessageSheet({ open, onClose, coach, preText = '' }) {
  const [msg, setMsg]   = useState(preText);
  const [sent, setSent] = useState(false);

  useEffect(() => { if (open) { setMsg(preText); setSent(false); } }, [open, preText]);

  const templates = [
    { label: 'HIIT Classes',       text: `Hi ${coach?.name?.split(' ')[0]}, I'm interested in your HIIT classes. When is the best time to start?` },
    { label: 'Personal Training',  text: `Hi ${coach?.name?.split(' ')[0]}, I'd love to book a personal training session. What does your typical programme look like?` },
    { label: 'Custom Plan',        text: `Hi ${coach?.name?.split(' ')[0]}, could you put together a custom training plan for me? My main goal is body recomposition.` },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10200, background: 'rgba(2,4,10,0.88)', backdropFilter: 'blur(12px)' }} />

          <motion.div
            variants={pageSlideVariants}
            initial="hidden" animate="visible" exit="exit"
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10201, borderRadius: '24px 24px 0 0',
              background: SHEET_BG, border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none',
              padding: '10px 18px 42px' }}>

            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14 }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
            </div>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                <div style={{ fontSize: 50, marginBottom: 12, animation: 'cpm-pop 0.4s ease both' }}>💬</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Message sent!</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  {coach?.name?.split(' ')[0]} typically replies in {coach?.response_time || '< 1 hr'}
                </div>
                <button className="cpm-btn" onClick={onClose}
                  style={{ padding: '12px 32px', borderRadius: 14, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: 13, fontWeight: 800 }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 4 }}>Message Coach</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 18 }}>{coach?.name}</div>

                {/* Quick-fill templates */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {templates.map((t, i) => (
                    <button key={i} className="cpm-btn" onClick={() => setMsg(t.text)}
                      style={{ padding: '5px 11px', borderRadius: 99, fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea value={msg} onChange={e => setMsg(e.target.value)}
                  placeholder="Write your message…"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', fontSize: 13, color: '#fff', resize: 'none', height: 100, outline: 'none', fontFamily: 'inherit', lineHeight: 1.65, marginBottom: 14 }} />

                <button className="cpm-btn" onClick={() => { if (msg.trim()) setSent(true); }} disabled={!msg.trim()}
                  style={{ width: '100%', padding: '15px', borderRadius: 16, fontSize: 15, fontWeight: 900, cursor: msg.trim() ? 'pointer' : 'default', border: 'none',
                    background: msg.trim() ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'rgba(255,255,255,0.05)',
                    color: msg.trim() ? '#fff' : 'rgba(255,255,255,0.2)',
                    boxShadow: msg.trim() ? '0 6px 24px rgba(37,99,235,0.4),inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                  <Send style={{ width: 15, height: 15 }} /> Send Message
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO DATA
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_COACH = {
  name: 'Serena Voss',
  title: 'Elite Performance Coach',
  rating: 4.9,
  review_count: 214,
  experience_years: 11,
  total_clients: 840,
  sessions_completed: 3200,
  response_time: '< 1 hr',
  match_score: 92,
  bio: "I specialise in high-performance training and body recomposition. My philosophy: train smarter, recover harder, build habits that outlast any programme.",
  philosophy: "I reject one-size-fits-all programming. Every plan I build starts from where you are, not where someone else is. I blend progressive overload, periodisation, and lifestyle-first habits — so results stick long after we finish working together.",
  location: 'New York, NY',
  member_since: '2019',
  image_url: IMGS.coach,
  languages: ['English', 'Spanish'],
  specialties: ['Body Recomposition', 'Strength & Power', 'HIIT', 'Mobility', 'Nutrition'],
  certifications: [
    { name: 'NASM Certified Personal Trainer', org: 'NASM',               year: '2020' },
    { name: 'Precision Nutrition Level 2',      org: 'Precision Nutrition', year: '2021' },
    { name: 'FMS Specialist',                  org: 'FMS',                year: '2019' },
    { name: 'ISSA Strength & Conditioning',    org: 'ISSA',               year: '2022' },
  ],
  verification: { id: true, certifications: true, background: true },
  next_available: 'Tomorrow · 7:00 AM',
  price_per_session: 85,
  free_consultation: true,
  packages: [
    { sessions: 1,  price: 85,  label: 'Single',  popular: false, discount: null      },
    { sessions: 5,  price: 380, label: '5 Pack',  popular: true,  discount: 'Save 10%' },
    { sessions: 10, price: 720, label: '10 Pack', popular: false, discount: 'Save 15%' },
  ],
  availability_slots: [
    { date: 'Tomorrow',  day: 'Thu', time: '7:00 AM',  spots: 3 },
    { date: 'Tomorrow',  day: 'Thu', time: '11:00 AM', spots: 2 },
    { date: 'Fri 22 Mar',day: 'Fri', time: '6:30 AM',  spots: 5 },
    { date: 'Sat 23 Mar',day: 'Sat', time: '9:00 AM',  spots: 4 },
    { date: 'Mon 25 Mar',day: 'Mon', time: '7:00 AM',  spots: 3 },
  ],
  achievements: [
    'Helped 120+ clients lose 10 kg+',
    '5 national competition winners coached',
    "Featured in Women's Health Magazine 2023",
    'Rated #1 PT at New York Fitness Club',
  ],
  transformations: [
    { before: IMGS.before1, after: IMGS.after1, caption: '12 weeks · Fat loss · -18 kg',    name: 'Jamie R.' },
    { before: IMGS.before2, after: IMGS.after2, caption: '16 weeks · Strength · +40 kg squat', name: 'David K.' },
  ],
  weekly_schedule: [
    { day: 'MON', slots: ['6:00 AM', '11:00 AM', '6:00 PM'] },
    { day: 'TUE', slots: ['7:30 AM', '5:00 PM']             },
    { day: 'WED', slots: ['6:00 AM', '11:00 AM', '6:00 PM'] },
    { day: 'THU', slots: ['7:00 AM', '11:00 AM']             },
    { day: 'FRI', slots: ['6:30 AM', '4:00 PM']              },
    { day: 'SAT', slots: ['9:00 AM']                         },
    { day: 'SUN', slots: []                                  },
  ],
  classes: [
    { id: 'c1', name: 'Power Hour',  duration_minutes: 60, difficulty: 'all_levels',   schedule: '6:00 AM',  days: 'Mon · Wed · Fri', capacity: 12, enrolled: 9,  location: 'Studio 2',   intensity: 7, best_for: ['Strength', 'Endurance'] },
    { id: 'c2', name: 'HIIT Ignite', duration_minutes: 45, difficulty: 'intermediate', schedule: '7:30 AM',  days: 'Tue · Thu',       capacity: 10, enrolled: 9,  location: 'Main Floor', intensity: 9, best_for: ['Fat Loss', 'Cardio']    },
    { id: 'c3', name: 'Strength Lab',duration_minutes: 75, difficulty: 'advanced',     schedule: '9:00 AM',  days: 'Saturday',        capacity: 8,  enrolled: 3,  location: 'Weight Room',intensity: 8, best_for: ['Muscle', 'Strength']   },
    { id: 'c4', name: 'Core & Flex', duration_minutes: 30, difficulty: 'all_levels',   schedule: '12:00 PM', days: 'Mon · Wed',        capacity: 15, enrolled: 8,  location: 'Studio 1',  intensity: 4, best_for: ['Flexibility', 'Recovery']},
  ],
  reviews: [
    { initials: 'JR', name: 'Jamie R.',  rating: 5, date: '2 days ago',   text: "Transformed my approach to training. Down 18 kg in five months — genuinely elite programming.", likes: 18, tag: 'Personal Training' },
    { initials: 'MT', name: 'Marcus T.', rating: 5, date: '1 week ago',   text: "Extraordinary ability to push you past your limits while keeping everything safe and purposeful.", likes: 12, tag: 'HIIT Ignite'        },
    { initials: 'PS', name: 'Priya S.',  rating: 5, date: '1 month ago',  text: "Nutrition coaching alongside PT is a game changer. I feel better at 38 than I did at 28.",       likes: 9,  tag: 'Nutrition'           },
    { initials: 'DK', name: 'David K.',  rating: 4, date: '2 months ago', text: "Squat went from 80 kg to 140 kg in six months. Absolutely unreal.",                               likes: 7,  tag: 'Strength Lab'        },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CLASSES TAB — kept from original, styled to match ClassDetailModal detail rows
// ─────────────────────────────────────────────────────────────────────────────
const DIFF_FILTERS = ['All', 'All Levels', 'Intermediate', 'Advanced'];
const TIME_FILTERS = ['All', 'Morning', 'Afternoon', 'Evening'];

function IntensityMeter({ value }) {
  const segments = 10;
  const getColor = i => {
    if (i >= value) return 'rgba(255,255,255,0.07)';
    if (value <= 3) return '#34d399';
    if (value <= 6) return '#fbbf24';
    if (value <= 8) return '#fb923c';
    return '#f87171';
  };
  return (
    <div style={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
      {Array.from({ length: segments }, (_, i) => (
        <div key={i} style={{ width: 14, height: 5, borderRadius: 2, background: getColor(i), transition: 'background 0.3s' }} />
      ))}
      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>{value}/10</span>
    </div>
  );
}

function ClassesTab({ coach, bookedClasses, onClassSelect, showToast }) {
  const [diffFilter, setDiffFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const classes    = coach.classes || [];
  const classTypes = ['All', ...new Set(classes.map(c => CFG[classType(c.name)].label))];

  const filtered = classes.filter(cls => {
    if (diffFilter !== 'All') {
      const map = { 'All Levels': 'all_levels', 'Intermediate': 'intermediate', 'Advanced': 'advanced' };
      if (cls.difficulty !== map[diffFilter]) return false;
    }
    if (timeFilter !== 'All') {
      const h = parseInt((cls.schedule || '').split(':')[0] || '0');
      if (timeFilter === 'Morning'   && (h < 5  || h >= 12)) return false;
      if (timeFilter === 'Afternoon' && (h < 12 || h >= 17)) return false;
      if (timeFilter === 'Evening'   && h < 17)              return false;
    }
    if (typeFilter !== 'All' && CFG[classType(cls.name)].label !== typeFilter) return false;
    return true;
  });

  return (
    <motion.div key="classes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{filtered.length} Classes</div>
        <button className="cpm-btn" onClick={() => setShowFilters(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800,
            border: `1px solid ${showFilters ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
            background: showFilters ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.04)',
            color: showFilters ? '#60a5fa' : 'rgba(255,255,255,0.45)' }}>
          <Filter style={{ width: 11, height: 11 }} /> Filters{(diffFilter !== 'All' || timeFilter !== 'All' || typeFilter !== 'All') && ' •'}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 4 }}>
              {[
                { label: 'Difficulty', opts: DIFF_FILTERS, val: diffFilter, set: setDiffFilter },
                { label: 'Time',       opts: TIME_FILTERS, val: timeFilter, set: setTimeFilter },
                { label: 'Type',       opts: classTypes,   val: typeFilter, set: setTypeFilter },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{f.label}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {f.opts.map(o => (
                      <button key={o} className="cpm-btn" onClick={() => f.set(o)}
                        style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                          border: `1px solid ${f.val === o ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.09)'}`,
                          background: f.val === o ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
                          color: f.val === o ? '#60a5fa' : 'rgba(255,255,255,0.45)' }}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18 }}>
          <Dumbbell style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.18)', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No classes match these filters.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((cls, i) => {
          const tk  = classType(cls.name);
          const cc  = CFG[tk];
          const cap = cls.capacity || 0;
          const enr = cls.enrolled || 0;
          const left = cap - enr;
          const pct  = cap ? Math.min(100, Math.round(enr / cap * 100)) : 0;
          const full = left <= 0;
          const hot  = left > 0 && left <= 3;
          const isBooked = (bookedClasses || []).includes(cls.id);
          const barColor = full
            ? 'linear-gradient(90deg,#dc2626,#f87171)'
            : pct > 65 ? 'linear-gradient(90deg,#d97706,#fbbf24)'
            : `linear-gradient(90deg,${cc.color}88,${cc.color})`;

          return (
            <motion.div key={cls.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              onClick={() => onClassSelect && onClassSelect({ ...cls, instructor: coach.name, coach_name: coach.name })}
              style={{ background: CARD_BG, border: isBooked ? '1px solid rgba(52,211,153,0.35)' : CARD_BORDER, borderRadius: 16, overflow: 'hidden', cursor: onClassSelect ? 'pointer' : 'default', position: 'relative' }}>

              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${cc.color}88,transparent)` }} />

              <div style={{ padding: '14px 15px 12px', display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                {/* Class icon */}
                <div style={{ width: 44, height: 44, borderRadius: 14, background: cc.bg, border: `1px solid ${cc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, boxShadow: `0 0 14px ${cc.glow}` }}>
                  {cc.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + badges */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{cls.name}</span>
                      {isBooked && <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', textTransform: 'uppercase' }}>✓ Booked</span>}
                      {hot && !full && !isBooked && <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', textTransform: 'uppercase' }}>🔥 {left} left</span>}
                      {full && !isBooked && <span style={{ fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 99, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', textTransform: 'uppercase' }}>Full</span>}
                    </div>
                    {onClassSelect && <ChevronRight style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />}
                  </div>

                  {/* Meta row */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    {[{ I: Clock, v: cls.schedule }, { I: Calendar, v: cls.days }, { I: Zap, v: `${cls.duration_minutes}min` }, { I: MapPin, v: cls.location }].filter(x => x.v).map(({ I, v }, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <I style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.3)' }} />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {cls.intensity && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Intensity</div>
                      <IntensityMeter value={cls.intensity} />
                    </div>
                  )}

                  {cls.best_for?.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                      {cls.best_for.map((tag, j) => (
                        <span key={j} style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: cc.bg, border: `1px solid ${cc.border}`, color: cc.color }}>{tag}</span>
                      ))}
                    </div>
                  )}

                  {cap > 0 && (
                    <div>
                      <Bar pct={pct} color={barColor} h={4} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{enr}/{cap} enrolled</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: full ? '#f87171' : pct > 65 ? '#fbbf24' : cc.color }}>{full ? 'Class full' : `${left} spot${left === 1 ? '' : 's'} left`}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — CoachProfileModal
// Structure mirrors ClassDetailModal exactly:
//   backdrop → toast → sheet(handle → scroll(hero → tabs → tab-content) → footer)
// ─────────────────────────────────────────────────────────────────────────────
export default function CoachProfileModal({
  coach: rawCoach = null,
  open = true,
  onClose = () => {},
  onClassSelect = null,
  bookedClasses = [],
  userGoals = ['Fat Loss', 'Strength'],
  gymClasses = [],
}) {
  // Merge real entity data with display defaults — same pattern as original
  const coach = rawCoach ? {
    title: 'Personal Coach',
    review_count: 0,
    sessions_completed: (rawCoach.total_clients || 0) * 8,
    response_time: '< 2 hrs',
    location: rawCoach.gym_name || 'At the gym',
    member_since: rawCoach.created_date ? new Date(rawCoach.created_date).getFullYear().toString() : '2023',
    languages: ['English'],
    price_per_session: null,
    free_consultation: false,
    packages: [],
    availability_slots: [],
    transformations: [],
    achievements: [],
    weekly_schedule: [],
    philosophy: null,
    verification: null,
    match_score: null,
    reviews: [],
    classes: gymClasses,
    ...rawCoach,
  } : DEMO_COACH;

  const [liked,           setLiked]           = useState(false);
  const [reminded,        setReminded]         = useState(false);
  const [tab,             setTab]             = useState('about');
  const [toast,           setToast]           = useState('');
  const [moreRev,         setMoreRev]         = useState(false);
  const [msgOpen,         setMsgOpen]         = useState(false);
  const [msgPreText,      setMsgPreText]      = useState('');
  const [selPkg,          setSelPkg]          = useState(1);
  const [bookAnim,        setBookAnim]        = useState(false);
  const [consultAnim,     setConsultAnim]     = useState(false);
  const [selectedSlot,    setSelectedSlot]    = useState(null);

  useEffect(() => { injectCSS(); }, []);
  useEffect(() => { if (!open) setSelectedSlot(null); }, [open]);

  if (!coach) return null;

  // Derived values
  const heroImg    = coach.image_url || IMGS.coach;
  const avgRating  = coach.rating ?? 0;
  const reviews    = coach.reviews || [];
  const reviewCount = coach.review_count ?? reviews.length;
  const ratCounts  = [5, 4, 3, 2, 1].map(s => ({
    s, n: reviews.filter(r => r.rating === s).length,
    p:    reviews.length ? Math.round(reviews.filter(r => r.rating === s).length / reviews.length * 100) : 0,
  }));
  const selPkgObj     = (coach.packages || [])[selPkg];
  const slots         = coach.availability_slots || [];
  const priceDisplay  = selPkgObj
    ? `£${selPkgObj.price} for ${selPkgObj.sessions} session${selPkgObj.sessions > 1 ? 's' : ''}`
    : coach.price_per_session ? `£${coach.price_per_session}/session` : null;

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2300); };
  const openMsg   = (pre = '') => { setMsgPreText(pre); setMsgOpen(true); };

  // CTA label — mirrors ClassDetailModal's ctaLabel pattern
  const ctaLabel = (() => {
    if (bookAnim)      return '…';
    if (selectedSlot)  return `Book for ${selectedSlot.day} at ${selectedSlot.time}`;
    if (tab === 'schedule' && slots.length > 0) return 'Select a Time Slot';
    return 'Book Now';
  })();

  const ctaDisabled = !selectedSlot && tab === 'schedule';

  const handleBook = () => {
    if (!selectedSlot && tab === 'schedule') {
      showToast('Select a time slot first 👆');
      return;
    }
    setBookAnim(true);
    setTimeout(() => {
      setBookAnim(false);
      const label = selectedSlot
        ? `Booked for ${selectedSlot.day} at ${selectedSlot.time} 🎉`
        : 'Booking confirmed! Check your email 🎉';
      showToast(label);
    }, 260);
  };

  const handleConsult = () => {
    setConsultAnim(true);
    setTimeout(() => { setConsultAnim(false); showToast('Free consultation booked! 📅'); }, 260);
  };

  return (
    <>
      <style>{CSS}</style>
      <AnimatePresence>
        {open && (
          <>
            {/* ── Backdrop — identical to ClassDetailModal ── */}
            <motion.div key="bd"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              onClick={onClose}
              style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(2,4,10,0.87)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} />

            {/* ── Toast — identical to ClassDetailModal ── */}
            <AnimatePresence>
              {toast && (
                <motion.div key="toast"
                  initial={{ opacity: 0, y: 18, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.28, ease: [0.34, 1.1, 0.64, 1] }}
                  style={{ position: 'fixed', bottom: 130, left: '50%', transform: 'translateX(-50%)', zIndex: 10300,
                    background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
                    padding: '11px 20px', fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
                    backdropFilter: 'blur(20px)', boxShadow: '0 4px 24px rgba(37,99,235,0.22)' }}>
                  {toast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Sheet — uses pageSlideVariants, identical to ClassDetailModal ── */}
            <motion.div key="sh"
              className="cpm-root"
              variants={pageSlideVariants}
              initial="hidden" animate="visible" exit="exit"
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
                maxHeight: '95vh', display: 'flex', flexDirection: 'column',
                borderRadius: '26px 26px 0 0', background: SHEET_BG,
                border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
                boxShadow: '0 -16px 60px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.06)' }}>

              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
                <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
              </div>

              {/* ── Scroll body ── */}
              <div className="cpm-scroll" style={{ flex: 1 }}>

                {/* ════════════════════════════════════════════════
                    HERO — same structure as ClassDetailModal
                ════════════════════════════════════════════════ */}
                <div style={{ position: 'relative', height: 245, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={heroImg} alt={coach.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', animation: 'cpm-hero-in 0.6s cubic-bezier(0.16,1,0.3,1) both' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,rgba(6,8,18,0.97) 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 75% 25%,rgba(37,99,235,0.14) 0%,transparent 60%)' }} />

                  {/* Actions row */}
                  <div style={{ position: 'absolute', top: 13, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08, duration: 0.35 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38bdf8', background: 'rgba(0,0,0,0.62)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 20, padding: '5px 11px', backdropFilter: 'blur(12px)' }}>
                      🏅 Coach
                    </motion.div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      {[
                        { I: Heart,  act: () => setLiked(l => !l), on: liked,  ac: '#f472b6' },
                        { I: Share2, act: () => showToast('Link copied 🔗') },
                        { I: X,      act: onClose },
                      ].map(({ I, act, on, ac }, i) => (
                        <motion.button key={i} className="cpm-btn"
                          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                          onClick={act}
                          style={{ width: 35, height: 35, borderRadius: '50%', background: 'rgba(0,0,0,0.58)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                          <I style={{ width: 14, height: 14, color: on ? ac : '#fff', fill: on && ac ? ac : 'none', transition: 'all 0.2s' }} />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Title block */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 16px' }}>
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 28 }}>
                      {/* Status badges — same pattern as ClassDetailModal */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 9, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 900, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#34d399', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(52,211,153,0.35)', borderRadius: 20, padding: '3px 9px' }}>
                          <CheckCircle style={{ width: 9, height: 9 }} />Verified Coach
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 20, padding: '3px 9px' }}>
                          🟢 Available
                        </span>
                        {coach.match_score && (
                          <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#c084fc', background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 20, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Sparkles style={{ width: 9, height: 9 }} />{coach.match_score}% Match
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <h2 style={{ fontSize: 25, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.12, margin: '0 0 12px', textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
                        {coach.name}
                      </h2>

                      {/* Instructor row — matches ClassDetailModal's instructor row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 33, height: 33, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(37,99,235,0.55),rgba(37,99,235,0.22))', border: '1.5px solid rgba(59,130,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#60a5fa', flexShrink: 0, boxShadow: '0 0 10px rgba(37,99,235,0.3)' }}>
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
                            {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 10, height: 10, fill: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.15)', color: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }} />)}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>{avgRating}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>({reviewCount})</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* ── Tab bar — identical structure to ClassDetailModal ── */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingLeft: 18 }}>
                  {['about', 'schedule', 'classes', 'reviews'].map(t => (
                    <button key={t} className="cpm-btn" onClick={() => setTab(t)}
                      style={{ padding: '12px 16px', fontSize: 12, fontWeight: 800, textTransform: 'capitalize', letterSpacing: '0.02em', cursor: 'pointer', background: 'none', border: 'none',
                        borderBottom: `2px solid ${tab === t ? '#2563eb' : 'transparent'}`,
                        color: tab === t ? '#60a5fa' : 'rgba(255,255,255,0.32)',
                        transition: 'color 0.2s ease, border-color 0.2s ease', marginBottom: -1, position: 'relative' }}>
                      {t}
                      {t === 'schedule' && selectedSlot && (
                        <span style={{ position: 'absolute', top: 8, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#2563eb', boxShadow: '0 0 6px #2563eb' }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Tab content ── */}
                <div style={{ padding: '18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <AnimatePresence mode="wait">

                    {/* ════════════════════════════════════════════════
                        ABOUT TAB — mirrors ClassDetailModal's "details"
                    ════════════════════════════════════════════════ */}
                    {tab === 'about' && (
                      <motion.div key="about"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Stat cards — 3-column grid, same as ClassDetailModal */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                          <StatCard icon={TrendingUp} label="Experience" value={`${coach.experience_years || '—'} yrs`} color="#38bdf8" />
                          <StatCard icon={Users}      label="Clients"    value={`${coach.total_clients || '—'}`}        color="#818cf8" />
                          <StatCard icon={Zap}        label="Sessions"   value={coach.sessions_completed >= 1000 ? `${(coach.sessions_completed / 1000).toFixed(1)}k` : `${coach.sessions_completed || '—'}`} color="#34d399" />
                        </div>

                        {/* Match score — coach-specific widget */}
                        {coach.match_score && (
                          <div style={{ padding: '12px 16px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(168,85,247,0.1),rgba(99,102,241,0.08))', border: '1px solid rgba(168,85,247,0.22)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Sparkles style={{ width: 18, height: 18, color: '#c084fc' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{coach.match_score}% match for your goals</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Based on: {userGoals.join(', ')}</div>
                            </div>
                            <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                              <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="3" />
                                <circle cx="20" cy="20" r="16" fill="none" stroke="#c084fc" strokeWidth="3" strokeLinecap="round"
                                  strokeDasharray={`${2 * Math.PI * 16}`}
                                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - coach.match_score / 100)}`}
                                  style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }} />
                              </svg>
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#c084fc' }}>{coach.match_score}</div>
                            </div>
                          </div>
                        )}

                        {/* Verification — uses same card pattern as ClassDetailModal's detail rows */}
                        {coach.verification && (
                          <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '13px 15px' }}>
                            <SectionHead>Verification</SectionHead>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {[
                                { icon: ScanFace,      label: 'ID Verified',        ok: coach.verification.id             },
                                { icon: BadgeCheck,    label: 'Certs Verified',     ok: coach.verification.certifications },
                                { icon: ClipboardCheck,label: 'Background Checked', ok: coach.verification.background     },
                              ].map(({ icon: Ic, label, ok }, i) => (
                                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 6px', borderRadius: 12,
                                  background: ok ? 'rgba(52,211,153,0.07)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${ok ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                                  <Ic style={{ width: 16, height: 16, color: ok ? '#34d399' : 'rgba(255,255,255,0.2)', margin: '0 auto 5px' }} />
                                  <div style={{ fontSize: 9, fontWeight: 800, color: ok ? '#34d399' : 'rgba(255,255,255,0.25)', lineHeight: 1.3 }}>{label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bio */}
                        {coach.bio && (
                          <div>
                            <SectionHead>About</SectionHead>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{coach.bio}</p>
                          </div>
                        )}

                        {/* Philosophy — uses same amber policy card style from ClassDetailModal */}
                        {coach.philosophy && (
                          <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.6),transparent)' }} />
                            <SectionHead>My Approach</SectionHead>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>"{coach.philosophy}"</p>
                          </div>
                        )}

                        {/* Coach details — same detail-row pattern as ClassDetailModal's "Class Details" card */}
                        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, overflow: 'hidden' }}>
                          <div style={{ padding: '12px 15px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <SectionHead>Coach Details</SectionHead>
                          </div>
                          <div style={{ padding: '6px 15px 12px' }}>
                            {[
                              { I: Shield,    l: 'Member since',  v: coach.member_since                           },
                              { I: MapPin,    l: 'Location',      v: coach.location                              },
                              { I: Clock,     l: 'Response time', v: coach.response_time                         },
                              { I: Star,      l: 'Avg rating',    v: `${avgRating} / 5.0`                        },
                              { I: Languages, l: 'Languages',     v: (coach.languages || []).join(', ')           },
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

                        {/* Specialties */}
                        {(coach.specialties || []).length > 0 && (
                          <div>
                            <SectionHead>Specialties</SectionHead>
                            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                              {coach.specialties.map((s, i) => (
                                <span key={i} style={{ fontSize: 12, fontWeight: 700, padding: '5px 13px', borderRadius: 20,
                                  background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa' }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Client achievements */}
                        {(coach.achievements || []).length > 0 && (
                          <div>
                            <SectionHead>Client Achievements</SectionHead>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                              {coach.achievements.map((a, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 14, background: CARD_BG, border: CARD_BORDER }}>
                                  <Trophy style={{ width: 15, height: 15, color: '#fbbf24', flexShrink: 0, filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.5))' }} />
                                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.82)' }}>{a}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Before / After transformations */}
                        {(coach.transformations || []).length > 0 && (
                          <div>
                            <SectionHead>Client Transformations</SectionHead>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {coach.transformations.map((t, i) => (
                                <div key={i} style={{ borderRadius: 16, overflow: 'hidden', background: CARD_BG, border: CARD_BORDER }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'relative' }}>
                                    <div style={{ position: 'relative' }}>
                                      <img src={t.before} alt="Before" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                                      <div style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 9.5, fontWeight: 900, textTransform: 'uppercase', color: '#fff', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: 6 }}>Before</div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                      <img src={t.after} alt="After" style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                                      <div style={{ position: 'absolute', bottom: 6, right: 6, fontSize: 9.5, fontWeight: 900, textTransform: 'uppercase', color: '#34d399', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: 6 }}>After</div>
                                    </div>
                                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: 'rgba(6,8,18,1)', transform: 'translateX(-50%)' }} />
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 24, height: 24, borderRadius: '50%', background: '#060810', border: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 800, zIndex: 2 }}>→</div>
                                  </div>
                                  <div style={{ padding: '9px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{t.caption}</span>
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{t.name}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Certifications */}
                        {(coach.certifications || []).length > 0 && (
                          <div>
                            <SectionHead>Certifications</SectionHead>
                            <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, overflow: 'hidden' }}>
                              {coach.certifications.map((cert, i, arr) => {
                                const name = typeof cert === 'string' ? cert : cert.name;
                                const sub  = typeof cert === 'string' ? null : `${cert.org} · ${cert.year}`;
                                return (
                                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
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

                        {/* Booking policy — same amber warning card as ClassDetailModal */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 14 }}>
                          <AlertCircle style={{ width: 14, height: 14, color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>Booking Policy</div>
                            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>Cancel up to 4 hours before your session for a full refund. Late cancellations may incur a fee.</div>
                          </div>
                        </div>

                        {/* Quick actions — same 2-column grid as ClassDetailModal's action buttons */}
                        <div>
                          <SectionHead>Quick Actions</SectionHead>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {[
                              { label: 'Ask a Question',    sub: 'Get a reply in < 1hr',    icon: MessageSquare, pre: `Hi ${coach.name?.split(' ')[0]}, I have a quick question about your coaching…`        },
                              { label: 'Request Custom Plan',sub: 'Tailored to your goals',  icon: Target,        pre: `Hi ${coach.name?.split(' ')[0]}, I'd love a custom training plan. My goals are…`        },
                              { label: 'Check Availability', sub: 'See open slots',           icon: Calendar,      pre: `Hi ${coach.name?.split(' ')[0]}, when do you have availability this week?`              },
                              { label: 'Refer a Friend',    sub: 'You both get 10% off',    icon: UserPlus,      act: () => showToast('Referral link copied!') },
                            ].map((a, i) => (
                              <button key={i} className="cpm-btn" onClick={() => a.act ? a.act() : openMsg(a.pre)}
                                style={{ padding: '13px', borderRadius: 14, background: CARD_BG, border: CARD_BORDER, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                <a.icon style={{ width: 16, height: 16, color: '#38bdf8' }} />
                                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{a.label}</div>
                                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{a.sub}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                      </motion.div>
                    )}

                    {/* ════════════════════════════════════════════════
                        SCHEDULE TAB — mirrors ClassDetailModal's "schedule"
                        Uses SlotRow which mirrors SessionRow exactly
                    ════════════════════════════════════════════════ */}
                    {tab === 'schedule' && (
                      <motion.div key="schedule"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                          <div>
                            <SectionHead>Available Sessions</SectionHead>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginTop: -6 }}>
                              Next available · {slots.length} slots
                            </div>
                          </div>
                          {selectedSlot && (
                            <motion.button initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="cpm-btn"
                              onClick={() => setSelectedSlot(null)}
                              style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.38)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '5px 10px' }}>
                              Clear
                            </motion.button>
                          )}
                        </div>

                        {/* Selected slot chip — same as ClassDetailModal's selected session chip */}
                        <AnimatePresence>
                          {selectedSlot && (
                            <motion.div key="chip"
                              initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.96 }} transition={{ duration: 0.2 }}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 14, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)' }}>
                              <CheckCircle style={{ width: 15, height: 15, color: '#38bdf8', flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Selected</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                                  {selectedSlot.date} · {selectedSlot.time}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {slots.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {slots.map((slot, idx) => (
                              <SlotRow
                                key={`${slot.date}-${slot.time}`}
                                slot={slot}
                                isSelected={selectedSlot?.date === slot.date && selectedSlot?.time === slot.time}
                                onSelect={setSelectedSlot}
                                isFirst={idx}
                              />
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18 }}>
                            <Calendar style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.18)', margin: '0 auto 12px' }} />
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>No slots available</div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>Message the coach to request a time.</div>
                          </div>
                        )}

                        {/* Weekly schedule snapshot */}
                        {(coach.weekly_schedule || []).length > 0 && (
                          <div style={{ marginTop: 4 }}>
                            <SectionHead>Typical Weekly Schedule</SectionHead>
                            <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, overflow: 'hidden' }}>
                              {coach.weekly_schedule.map((d, i, arr) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: d.slots.length === 0 ? 0.35 : 1 }}>
                                  <div style={{ width: 34, fontSize: 10, fontWeight: 800, color: d.slots.length ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>{d.day}</div>
                                  {d.slots.length > 0 ? (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      {d.slots.map((s, j) => (
                                        <span key={j} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#60a5fa' }}>{s}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>Rest day</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Add to calendar — same as ClassDetailModal */}
                        <button className="cpm-btn" onClick={() => showToast('Opening calendar…')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                          <Calendar style={{ width: 14, height: 14 }} />Add to Calendar<ExternalLink style={{ width: 12, height: 12, opacity: 0.4 }} />
                        </button>

                      </motion.div>
                    )}

                    {/* ════════════════════════════════════════════════
                        CLASSES TAB
                    ════════════════════════════════════════════════ */}
                    {tab === 'classes' && (
                      <ClassesTab
                        coach={coach}
                        bookedClasses={bookedClasses}
                        onClassSelect={onClassSelect}
                        showToast={showToast}
                      />
                    )}

                    {/* ════════════════════════════════════════════════
                        REVIEWS TAB — identical to ClassDetailModal's reviews tab
                    ════════════════════════════════════════════════ */}
                    {tab === 'reviews' && (
                      <motion.div key="reviews"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Rating summary */}
                        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: '16px' }}>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ textAlign: 'center', flexShrink: 0 }}>
                              <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{avgRating}</div>
                              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 5 }}>
                                {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 12, height: 12, fill: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.12)', color: s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(255,255,255,0.12)' }} />)}
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

                        {/* Write review CTA — same as ClassDetailModal */}
                        <button className="cpm-btn" onClick={() => showToast('Review form coming soon…')}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: '1px solid rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.08)', color: '#38bdf8' }}>
                          <MessageSquare style={{ width: 14, height: 14 }} />Write a Review
                        </button>

                        {/* Review list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(moreRev ? reviews : reviews.slice(0, 2)).map((r, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                              <ReviewCard r={r} />
                            </motion.div>
                          ))}
                        </div>

                        {reviews.length > 2 && (
                          <button className="cpm-btn" onClick={() => setMoreRev(s => !s)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.38)' }}>
                            {moreRev
                              ? <><ChevronUp style={{ width: 14, height: 14 }} />Show Less</>
                              : <><ChevronDown style={{ width: 14, height: 14 }} />Show All {reviewCount} Reviews</>}
                          </button>
                        )}
                      </motion.div>
                    )}

                  </AnimatePresence>
                  <div style={{ height: 8 }} />
                </div>
              </div>

              {/* ════════════════════════════════════════════════
                  FIXED FOOTER — mirrors ClassDetailModal's CTA footer exactly:
                  nudge hint → mini capacity bar → primary CTA + secondary actions
              ════════════════════════════════════════════════ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, type: 'spring', stiffness: 200, damping: 28 }}
                style={{ flexShrink: 0, padding: '12px 18px 34px', background: 'linear-gradient(to top,#060810 55%,transparent)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

                {/* Package selector */}
                {(coach.packages || []).length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Session Packages</div>
                    <div style={{ display: 'flex', gap: 7 }}>
                      {coach.packages.map((pkg, i) => (
                        <motion.button key={i} className="cpm-btn" onClick={() => setSelPkg(i)}
                          animate={{ scale: selPkg === i ? 1 : 0.97 }}
                          style={{ flex: 1, padding: '10px 6px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', position: 'relative',
                            border: `1.5px solid ${selPkg === i ? '#2563eb' : 'rgba(255,255,255,0.09)'}`,
                            background: selPkg === i ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
                            transition: 'border-color 0.2s,background 0.2s' }}>
                          {pkg.popular && (
                            <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 8.5, fontWeight: 900, color: '#fbbf24', background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.35)', borderRadius: 99, padding: '2px 8px', whiteSpace: 'nowrap', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Popular</div>
                          )}
                          <div style={{ fontSize: 13, fontWeight: 900, color: selPkg === i ? '#fff' : 'rgba(255,255,255,0.6)' }}>{pkg.sessions}x</div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: selPkg === i ? '#fff' : 'rgba(255,255,255,0.7)', letterSpacing: '-0.02em', margin: '3px 0 1px' }}>£{pkg.price}</div>
                          {pkg.discount && <div style={{ fontSize: 9.5, fontWeight: 800, color: selPkg === i ? '#34d399' : 'rgba(52,211,153,0.6)' }}>{pkg.discount}</div>}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule nudge hint — same as ClassDetailModal */}
                <AnimatePresence>
                  {!selectedSlot && tab === 'schedule' && slots.length > 0 && (
                    <motion.div key="nudge" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, fontSize: 11.5, color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>
                      <Info style={{ width: 12, height: 12, flexShrink: 0 }} />
                      Tap a slot above to select your time
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Price + status line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'cpm-pulse 2s ease-in-out infinite' }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Responds in {coach.response_time}</span>
                  </div>
                  {priceDisplay && (
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{priceDisplay}</span>
                  )}
                </div>

                {/* CTA row — same 3-slot layout as ClassDetailModal */}
                <div style={{ display: 'flex', gap: 9 }}>

                  {/* Message icon button */}
                  <button className="cpm-btn" onClick={() => openMsg('')}
                    style={{ width: 52, height: 52, borderRadius: 16, border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageSquare style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.5)' }} />
                  </button>

                  {/* Free consult — same green secondary CTA */}
                  {coach.free_consultation && (
                    <button className="cpm-btn" onClick={handleConsult}
                      style={{ flex: 1, height: 52, borderRadius: 16, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        border: '1px solid rgba(52,211,153,0.35)',
                        background: consultAnim ? 'rgba(52,211,153,0.2)' : 'rgba(52,211,153,0.08)',
                        color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        transition: 'all 0.2s', transform: consultAnim ? 'scale(0.96)' : 'scale(1)' }}>
                      <Calendar style={{ width: 15, height: 15 }} />Free Consult
                    </button>
                  )}

                  {/* Primary Book CTA — identical structure/styles to ClassDetailModal */}
                  <button className="cpm-btn" onClick={handleBook}
                    disabled={ctaDisabled}
                    style={{ flex: 2, height: 52, borderRadius: 16, fontSize: 15, fontWeight: 900,
                      cursor: ctaDisabled ? 'default' : 'pointer',
                      border: 'none', letterSpacing: '-0.01em', position: 'relative', overflow: 'hidden',
                      background: selectedSlot || tab !== 'schedule'
                        ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
                        : 'rgba(255,255,255,0.05)',
                      color: selectedSlot || tab !== 'schedule' ? '#fff' : 'rgba(255,255,255,0.22)',
                      boxShadow: selectedSlot || tab !== 'schedule'
                        ? '0 6px 28px rgba(37,99,235,0.5),inset 0 1px 0 rgba(255,255,255,0.2)'
                        : 'none',
                      transform: bookAnim ? 'scale(0.96) translateY(2px)' : 'scale(1) translateY(0)',
                      transition: 'transform 0.18s cubic-bezier(0.34,1.5,0.64,1),background 0.3s,box-shadow 0.3s,color 0.3s' }}>
                    {(selectedSlot || tab !== 'schedule') && (
                      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', animation: 'cpm-shimmer 4s cubic-bezier(0.4,0,0.6,1) infinite 2s' }} />
                      </div>
                    )}
                    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                      {ctaLabel} {(selectedSlot || tab !== 'schedule') && <ChevronRight style={{ width: 15, height: 15 }} strokeWidth={2.5} />}
                    </span>
                  </button>
                </div>
              </motion.div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Message sheet — uses same pageSlideVariants as ClassDetailModal's RateSheet */}
      <MessageSheet open={msgOpen} onClose={() => setMsgOpen(false)} coach={coach} preText={msgPreText} />
    </>
  );
}
