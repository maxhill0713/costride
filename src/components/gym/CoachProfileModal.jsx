import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Star, Award, Users, Clock, MapPin, Instagram, Twitter,
  Youtube, ChevronDown, ChevronUp, Heart, Share2, MessageSquare,
  Bell, CheckCircle, Calendar, Zap, TrendingUp, BookOpen,
  X, Play, ChevronRight, Dumbbell, Medal, Activity,
  Camera, Globe, Phone, Mail, ExternalLink, ThumbsUp,
  UserPlus, Repeat, Info, AlertCircle, Tag, Flame,
  Shield, Target, BarChart2, Sparkles, ArrowLeft,
} from 'lucide-react';

// ── Design tokens (same DNA as ClassDetailModal) ──────────────────────────────
const CARD_BG     = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';

const SPECIALTY_CFG = {
  hiit:     { label:'HIIT',      emoji:'⚡', color:'#f87171', rgb:'248,113,113', bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.25)',  glow:'rgba(239,68,68,0.3)'  },
  yoga:     { label:'Yoga',      emoji:'🧘', color:'#34d399', rgb:'52,211,153',  bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)', glow:'rgba(16,185,129,0.3)' },
  strength: { label:'Strength',  emoji:'🏋️', color:'#818cf8', rgb:'129,140,248', bg:'rgba(99,102,241,0.12)', border:'rgba(99,102,241,0.25)', glow:'rgba(99,102,241,0.3)' },
  cardio:   { label:'Cardio',    emoji:'🏃', color:'#fb7185', rgb:'251,113,133', bg:'rgba(244,63,94,0.12)',  border:'rgba(244,63,94,0.25)',  glow:'rgba(244,63,94,0.3)'  },
  spin:     { label:'Spin',      emoji:'🚴', color:'#38bdf8', rgb:'56,189,248',  bg:'rgba(14,165,233,0.12)', border:'rgba(14,165,233,0.25)', glow:'rgba(14,165,233,0.3)' },
  boxing:   { label:'Boxing',    emoji:'🥊', color:'#fb923c', rgb:'251,146,60',  bg:'rgba(234,88,12,0.12)',  border:'rgba(234,88,12,0.25)',  glow:'rgba(234,88,12,0.3)'  },
  pilates:  { label:'Pilates',   emoji:'🌸', color:'#c084fc', rgb:'192,132,252', bg:'rgba(168,85,247,0.12)', border:'rgba(168,85,247,0.25)', glow:'rgba(168,85,247,0.3)' },
  nutrition:{ label:'Nutrition', emoji:'🥗', color:'#4ade80', rgb:'74,222,128',  bg:'rgba(34,197,94,0.12)',  border:'rgba(34,197,94,0.25)',  glow:'rgba(34,197,94,0.3)'  },
};

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&family=Space+Grotesk:wght@600;700;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root { 
    background: #04060f; 
    color: #fff; 
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  ::-webkit-scrollbar { width: 0; }

  @keyframes cp-fade-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cp-shimmer {
    0%   { transform: translateX(-120%); }
    100% { transform: translateX(220%); }
  }
  @keyframes cp-pulse-ring {
    0%   { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes cp-bar {
    from { width: 0; }
  }
  @keyframes cp-hero-in {
    from { opacity: 0.5; transform: scale(1.08); }
    to   { opacity: 1;   transform: scale(1); }
  }
  @keyframes cp-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
  @keyframes cp-spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes cp-count {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes cp-glow-pulse {
    0%, 100% { box-shadow: 0 0 20px var(--accent-glow); }
    50%       { box-shadow: 0 0 40px var(--accent-glow), 0 0 80px var(--accent-glow); }
  }

  .cp-tab-btn {
    padding: 11px 18px;
    font-size: 12px;
    font-weight: 800;
    text-transform: capitalize;
    letter-spacing: 0.03em;
    cursor: pointer;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: rgba(255,255,255,0.28);
    transition: color 0.2s, border-color 0.2s;
    white-space: nowrap;
    font-family: 'DM Sans', sans-serif;
  }
  .cp-tab-btn.active {
    color: var(--accent-color);
    border-bottom-color: var(--accent-color);
  }
  .cp-btn-ghost {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 11px 14px; border-radius: 13px;
    font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    border: 1px solid rgba(255,255,255,0.09);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.45);
    font-family: 'DM Sans', sans-serif;
  }
  .cp-btn-ghost:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.16); }

  .cp-class-card {
    display: flex; align-items: center; gap: 12px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 13px 14px;
    cursor: pointer; transition: all 0.2s;
  }
  .cp-class-card:hover { background: rgba(255,255,255,0.045); border-color: rgba(255,255,255,0.12); }

  .cp-avail-slot {
    text-align: center; padding: 10px 6px; border-radius: 12px;
    font-size: 10px; font-weight: 800; letter-spacing: 0.03em;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.025);
    color: rgba(255,255,255,0.2);
    transition: all 0.2s; cursor: pointer;
  }
  .cp-avail-slot.active {
    background: rgba(var(--accent-rgb), 0.12);
    border-color: rgba(var(--accent-rgb), 0.3);
    color: var(--accent-color);
    box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.15);
  }
  .cp-avail-slot:hover:not(.active) { background: rgba(255,255,255,0.05); }
`;

function injectCSS() {
  if (!document.getElementById('cp-css')) {
    const s = document.createElement('style');
    s.id = 'cp-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ini = (name = '') => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

function Bar({ pct, color, h = 5, delay = 0 }) {
  return (
    <div style={{ height: h, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, animation: `cp-bar 1.1s ${delay}s cubic-bezier(0.16,1,0.3,1) both` }} />
    </div>
  );
}

function SectionHead({ children, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{children}</div>
      {right}
    </div>
  );
}

function StatBubble({ icon: Icon, value, label, color, rgb, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        background: CARD_BG, border: CARD_BORDER, borderRadius: 18, padding: '14px 10px',
        textAlign: 'center', position: 'relative', overflow: 'hidden', flex: 1,
      }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color}aa,transparent)` }} />
      <Icon style={{ width: 16, height: 16, color, margin: '0 auto 7px', filter: `drop-shadow(0 0 6px ${color}66)` }} />
      <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, animation: 'cp-count 0.5s ease both' }}>{value}</div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
    </motion.div>
  );
}

// ── Achievement badge ─────────────────────────────────────────────────────────
function AchievementBadge({ icon: Icon, label, sub, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '11px 13px',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: `rgba(${color},0.12)`, border: `1px solid rgba(${color},0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon style={{ width: 17, height: 17, color: `rgb(${color})` }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ r, accentColor, accentBorder, accentBg }) {
  const [helpful, setHelpful] = useState(false);
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 15px' }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg,${accentColor}44,${accentColor}18)`,
          border: `1px solid ${accentBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, color: accentColor,
        }}>{r.initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.name}</div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{r.date}</span>
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
            {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 10, height: 10, fill: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.1)', color: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.1)' }} />)}
          </div>
        </div>
      </div>
      {r.class && (
        <div style={{ fontSize: 10, fontWeight: 700, color: accentColor, background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginBottom: 8 }}>
          {r.class}
        </div>
      )}
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.65, margin: '0 0 10px' }}>{r.text}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <button onClick={() => setHelpful(h => !h)} style={{
          display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
          cursor: 'pointer', padding: 0,
        }}>
          <ThumbsUp style={{ width: 12, height: 12, color: helpful ? accentColor : 'rgba(255,255,255,0.22)', fill: helpful ? accentColor : 'none' }} />
          <span style={{ fontSize: 11, color: helpful ? accentColor : 'rgba(255,255,255,0.22)', fontWeight: 600 }}>{r.likes + (helpful ? 1 : 0)} helpful</span>
        </button>
        {r.verified && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
            <CheckCircle style={{ width: 10, height: 10, color: '#34d399' }} />
            <span style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>Verified client</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Class card ────────────────────────────────────────────────────────────────
function ClassCard({ cls, accentColor, accentBorder, accentBg, accentRgb, onBook }) {
  const [booked, setBooked] = useState(cls.booked || false);
  const sc = SPECIALTY_CFG[cls.type] || SPECIALTY_CFG.hiit;
  return (
    <div className="cp-class-card" onClick={() => {}}>
      <div style={{
        width: 46, height: 46, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
        background: `rgba(${sc.rgb},0.12)`, border: `1px solid ${sc.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, position: 'relative',
      }}>
        <span>{sc.emoji}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 3 }}>{cls.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock style={{ width: 9, height: 9 }} />{cls.duration}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Users style={{ width: 9, height: 9 }} />{cls.spots} spots
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '1px 7px' }}>{sc.label}</span>
        </div>
        {cls.time && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>{cls.time}</div>}
      </div>
      <button
        onClick={e => { e.stopPropagation(); setBooked(b => !b); onBook && onBook(cls.id, !booked); }}
        style={{
          flexShrink: 0, padding: '8px 14px', borderRadius: 11, fontSize: 12, fontWeight: 800,
          cursor: 'pointer', border: `1px solid ${booked ? 'rgba(52,211,153,0.35)' : accentBorder}`,
          background: booked ? 'rgba(16,185,129,0.12)' : accentBg,
          color: booked ? '#34d399' : accentColor, transition: 'all 0.2s',
        }}>
        {booked ? '✓' : 'Book'}
      </button>
    </div>
  );
}

// ── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ open, onClose, coach, accentColor, accentBorder, accentBg, accentRgb }) {
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedType, setSelectedType] = useState('1on1');
  const [done, setDone] = useState(false);

  const TIMES = ['7:00 AM','8:00 AM','9:00 AM','10:00 AM','12:00 PM','1:00 PM','4:00 PM','5:00 PM','6:00 PM'];
  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i + 1);
    return { date: d, label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) };
  });

  const TYPES = [
    { id: '1on1', label: '1-on-1 Session', desc: '60 min private session', price: '$85' },
    { id: 'group', label: 'Small Group', desc: 'Up to 6 clients', price: '$35' },
    { id: 'assessment', label: 'Assessment', desc: 'Initial fitness evaluation', price: '$55' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10200, background: 'rgba(2,4,10,0.92)', backdropFilter: 'blur(16px)' }} />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32, mass: 1.1 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10201,
              borderRadius: '26px 26px 0 0',
              background: 'linear-gradient(160deg,#0c1128 0%,#060810 100%)',
              border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none',
              padding: '0 0 40px', maxHeight: '90vh', overflowY: 'auto',
            }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '26px 26px 0 0', background: `linear-gradient(90deg,transparent,${accentColor},transparent)` }} />
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
            </div>
            <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X style={{ width: 14, height: 14, color: '#fff' }} />
            </button>

            <div style={{ padding: '14px 20px 0' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 4 }}>Book a Session</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', marginBottom: 20 }}>with {coach?.name}</div>

              {!done ? (
                <>
                  {/* Step 0: Type */}
                  {step === 0 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <SectionHead>Session Type</SectionHead>
                      {TYPES.map(t => (
                        <div key={t.id} onClick={() => setSelectedType(t.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px',
                            borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
                            border: `1px solid ${selectedType === t.id ? accentBorder : 'rgba(255,255,255,0.07)'}`,
                            background: selectedType === t.id ? accentBg : 'rgba(255,255,255,0.025)',
                          }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: selectedType === t.id ? accentColor : '#fff' }}>{t.label}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{t.desc}</div>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: selectedType === t.id ? accentColor : 'rgba(255,255,255,0.6)' }}>{t.price}</div>
                          {selectedType === t.id && <CheckCircle style={{ width: 16, height: 16, color: accentColor, flexShrink: 0 }} />}
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Step 1: Date */}
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <SectionHead>Pick a Date</SectionHead>
                      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                        {dates.map((d, i) => (
                          <button key={i} onClick={() => setSelectedDate(i)}
                            style={{
                              flexShrink: 0, width: 58, padding: '10px 6px', borderRadius: 14,
                              border: `1px solid ${selectedDate === i ? accentBorder : 'rgba(255,255,255,0.07)'}`,
                              background: selectedDate === i ? accentBg : 'rgba(255,255,255,0.025)',
                              color: selectedDate === i ? accentColor : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer', textAlign: 'center',
                            }}>
                            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, opacity: 0.7 }}>{d.label.split(' ')[0]}</div>
                            <div style={{ fontSize: 16, fontWeight: 900 }}>{d.label.split(' ')[1]}</div>
                          </button>
                        ))}
                      </div>
                      {selectedDate !== null && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <SectionHead>Available Times</SectionHead>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                            {TIMES.map((t, i) => (
                              <button key={i} onClick={() => setSelectedTime(t)}
                                style={{
                                  padding: '10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                                  border: `1px solid ${selectedTime === t ? accentBorder : 'rgba(255,255,255,0.07)'}`,
                                  background: selectedTime === t ? accentBg : 'rgba(255,255,255,0.025)',
                                  color: selectedTime === t ? accentColor : 'rgba(255,255,255,0.5)',
                                  cursor: 'pointer',
                                }}>{t}</button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: Confirm */}
                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <SectionHead>Confirm Booking</SectionHead>
                      {[
                        { l: 'Coach', v: coach?.name },
                        { l: 'Session', v: TYPES.find(t => t.id === selectedType)?.label },
                        { l: 'Date', v: selectedDate !== null ? dates[selectedDate]?.label : '—' },
                        { l: 'Time', v: selectedTime || '—' },
                        { l: 'Price', v: TYPES.find(t => t.id === selectedType)?.price },
                      ].map(({ l, v }) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>{l}</span>
                          <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
                        Free cancellation up to 24 hours before your session.
                      </div>
                    </motion.div>
                  )}

                  {/* Nav */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                    {step > 0 && (
                      <button onClick={() => setStep(s => s - 1)} className="cp-btn-ghost" style={{ flex: 1 }}>
                        <ArrowLeft style={{ width: 13, height: 13 }} />Back
                      </button>
                    )}
                    <button
                      onClick={() => { if (step < 2) setStep(s => s + 1); else setDone(true); }}
                      disabled={step === 1 && (!selectedDate || !selectedTime)}
                      style={{
                        flex: 2, padding: '15px', borderRadius: 16, fontSize: 14, fontWeight: 900,
                        cursor: 'pointer', border: 'none',
                        background: step === 1 && (!selectedDate || !selectedTime) ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg,#2563eb,#1d4ed8)`,
                        color: step === 1 && (!selectedDate || !selectedTime) ? 'rgba(255,255,255,0.2)' : '#fff',
                        boxShadow: step === 1 && (!selectedDate || !selectedTime) ? 'none' : '0 6px 24px rgba(37,99,235,0.4)',
                      }}>
                      {step < 2 ? 'Continue →' : 'Confirm & Pay'}
                    </button>
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}
                  style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                  <div style={{ fontSize: 56, marginBottom: 14, animation: 'cp-float 2s ease-in-out infinite' }}>🎉</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Session Booked!</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                    You're booked with <span style={{ color: accentColor, fontWeight: 700 }}>{coach?.name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
                    {selectedDate !== null ? dates[selectedDate]?.label : ''} · {selectedTime}
                  </div>
                  <button onClick={onClose} style={{ padding: '13px 32px', borderRadius: 14, background: accentBg, border: `1px solid ${accentBorder}`, color: accentColor, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                    Done
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Message Sheet ─────────────────────────────────────────────────────────────
function MessageSheet({ open, onClose, coach, accentColor, accentBorder, accentBg }) {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const TEMPLATES = ['Hi! I\'d love to book a session.', 'What classes do you recommend for beginners?', 'Do you offer nutrition coaching?', 'What are your rates?'];
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10200, background: 'rgba(2,4,10,0.88)', backdropFilter: 'blur(14px)' }} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10201, borderRadius: '26px 26px 0 0', background: 'linear-gradient(160deg,#0c1128,#060810)', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none', padding: '0 18px 40px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', marginBottom: 16 }}>
              <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
            </div>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>📩</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Message Sent!</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>{coach?.name} will respond shortly.</div>
                <button onClick={onClose} style={{ padding: '12px 32px', borderRadius: 14, background: accentBg, border: `1px solid ${accentBorder}`, color: accentColor, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 4 }}>Message</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 16 }}>{coach?.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                  {TEMPLATES.map(t => (
                    <button key={t} onClick={() => setMsg(t)} style={{ fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${msg === t ? accentBorder : 'rgba(255,255,255,0.1)'}`, background: msg === t ? accentBg : 'rgba(255,255,255,0.03)', color: msg === t ? accentColor : 'rgba(255,255,255,0.45)' }}>{t}</button>
                  ))}
                </div>
                <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder={`Write a message to ${coach?.name}…`}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '13px 15px', fontSize: 13, color: '#fff', resize: 'none', height: 100, outline: 'none', fontFamily: 'inherit', marginBottom: 14 }} />
                <button onClick={() => { if (msg.trim()) setSent(true); }}
                  disabled={!msg.trim()}
                  style={{ width: '100%', padding: '15px', borderRadius: 16, fontSize: 14, fontWeight: 900, cursor: msg.trim() ? 'pointer' : 'default', border: 'none', background: msg.trim() ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'rgba(255,255,255,0.05)', color: msg.trim() ? '#fff' : 'rgba(255,255,255,0.2)', boxShadow: msg.trim() ? '0 6px 24px rgba(37,99,235,0.4)' : 'none' }}>
                  Send Message
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CoachProfilePage({ coach: propCoach, onBack, open, onClose }) {
  const handleBack = onBack || onClose;
  if (open === false) return null;
  const [tab, setTab] = useState('about');
  const [following, setFollowing] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [toast, setToast] = useState('');
  const [moreReviews, setMoreReviews] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const scrollRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    injectCSS();
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  // ── Mock coach data ─────────────────────────────────────────────────────────
  const coach = propCoach || {
    id: 'c001',
    name: 'Jordan Rivera',
    title: 'Elite Performance Coach',
    avatar_url: null,
    cover_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80',
    bio: 'I\'ve spent 11 years transforming how people think about movement. My approach blends sports science with mindful training — building strength, resilience, and confidence that extends far beyond the gym floor.',
    philosophy: 'Every body is different. I design programmes that adapt to you, not the other way around. Progress isn\'t linear — and that\'s exactly the point.',
    specialties: ['HIIT', 'Strength & Conditioning', 'Sports Performance', 'Injury Recovery', 'Nutrition Coaching'],
    primarySpecialty: 'strength',
    experience_years: 11,
    total_clients: 340,
    classes_taught: 2800,
    rating: 4.9,
    total_reviews: 218,
    certifications: [
      { name: 'NASM Certified Personal Trainer', issuer: 'NASM', year: 2014 },
      { name: 'CSCS — Strength & Conditioning', issuer: 'NSCA', year: 2016 },
      { name: 'Precision Nutrition Level 2', issuer: 'Precision Nutrition', year: 2018 },
      { name: 'FMS Level 2', issuer: 'Functional Movement Systems', year: 2019 },
      { name: 'First Aid & CPR/AED', issuer: 'Red Cross', year: 2023 },
    ],
    location: 'Manchester City Centre',
    gym: 'Apex Performance Studio',
    social: { instagram: '@jordanfits', youtube: 'Jordan Rivera Fitness', twitter: '@jordanrivera' },
    languages: ['English', 'Spanish'],
    availability: {
      Mon: ['7:00','8:00','9:00','17:00','18:00'],
      Tue: ['6:00','7:00','12:00','18:00'],
      Wed: ['7:00','8:00','9:00','16:00','17:00'],
      Thu: ['6:00','7:00','18:00','19:00'],
      Fri: ['7:00','8:00','9:00','17:00'],
      Sat: ['9:00','10:00','11:00'],
      Sun: [],
    },
    achievements: [
      { icon: Medal, label: 'Top Coach 2024', sub: 'Voted #1 at Apex Studio', color: '251,191,36' },
      { icon: Flame, label: '2,800+ Classes', sub: 'Taught over 11 years', color: '251,146,60' },
      { icon: Shield, label: '5-Star Average', sub: 'Across 218 reviews', color: '99,102,241' },
      { icon: Target, label: '96% Retention', sub: 'Client satisfaction rate', color: '52,211,153' },
    ],
    classes: [
      { id: 'cl1', name: 'Power HIIT', type: 'hiit', duration: '45 min', spots: 4, time: 'Mon / Wed · 7:00 AM', booked: false },
      { id: 'cl2', name: 'Heavy Strength', type: 'strength', duration: '60 min', spots: 12, time: 'Tue / Thu · 6:00 PM', booked: false },
      { id: 'cl3', name: 'Cardio Blast', type: 'cardio', duration: '30 min', spots: 2, time: 'Fri · 8:00 AM', booked: true },
      { id: 'cl4', name: 'Boxing Conditioning', type: 'boxing', duration: '50 min', spots: 8, time: 'Sat · 10:00 AM', booked: false },
    ],
  };

  const sc = SPECIALTY_CFG[coach.primarySpecialty] || SPECIALTY_CFG.strength;

  const REVIEWS = [
    { initials:'AK', name:'Alex K.',    rating:5, date:'3 days ago',  class:'Power HIIT',       text:'Jordan completely changed my relationship with fitness. The attention to form and personalised cues are unmatched. I\'ve seen more progress in 3 months than in 2 years of training alone.', likes:24, verified:true },
    { initials:'SK', name:'Sarah M.',   rating:5, date:'1 week ago',  class:'Heavy Strength',   text:'Incredibly knowledgeable and motivating. Jordan remembers every detail about your goals and pushes you exactly the right amount. Highly recommend the 1-on-1 sessions.', likes:18, verified:true },
    { initials:'TW', name:'Tom W.',     rating:4, date:'2 weeks ago', class:'Boxing Conditioning', text:'Best conditioning class I\'ve attended. The warmup structure is excellent and the session flies by. Would love slightly longer cooldowns.', likes:11, verified:false },
    { initials:'LB', name:'Laura B.',   rating:5, date:'3 weeks ago', class:'Power HIIT',       text:'I was nervous starting after an injury. Jordan adapted every exercise and made me feel completely safe. Back to full strength now.', likes:9, verified:true },
    { initials:'MP', name:'Marcus P.',  rating:5, date:'1 month ago', class:'Heavy Strength',   text:'Programming is elite. Jordan tracks everything and the progression model is scientifically grounded. Results speak for themselves.', likes:7, verified:true },
  ];

  const avg = (REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length).toFixed(1);
  const ratCounts = [5,4,3,2,1].map(s => ({
    s, n: REVIEWS.filter(r => r.rating === s).length,
    p: Math.round(REVIEWS.filter(r => r.rating === s).length / REVIEWS.length * 100),
  }));

  const heroOpacity = Math.max(0, 1 - scrollY / 180);
  const headerOpacity = Math.min(1, (scrollY - 120) / 80);

  return (
    <div style={{
      '--accent-color': sc.color,
      '--accent-rgb': sc.rgb,
      '--accent-glow': sc.glow,
      position: 'relative', maxWidth: 480, margin: '0 auto',
      background: '#04060f', minHeight: '100vh', overflow: 'hidden',
    }}>
      {/* ── Sticky header (fades in on scroll) ── */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, zIndex: 200,
        padding: '12px 18px 10px',
        background: `rgba(4,6,15,${headerOpacity * 0.96})`,
        backdropFilter: scrollY > 120 ? 'blur(20px)' : 'none',
        borderBottom: `1px solid rgba(255,255,255,${headerOpacity * 0.07})`,
        transition: 'background 0.2s, border-color 0.2s',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {onBack && (
          <button onClick={onBack} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <ArrowLeft style={{ width: 15, height: 15, color: '#fff' }} />
          </button>
        )}
        <div style={{ opacity: headerOpacity, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg,${sc.color}55,${sc.color}22)`,
            border: `1.5px solid ${sc.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 900, color: sc.color,
          }}>{ini(coach.name)}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{coach.name}</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{coach.title}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => { try { navigator.clipboard.writeText(coach.name); } catch {} showToast('Profile link copied 🔗'); }}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Share2 style={{ width: 14, height: 14, color: '#fff' }} />
          </button>
        </div>
      </div>

      {/* ── Scroll body ── */}
      <div ref={scrollRef} style={{ overflowY: 'auto', height: '100vh', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>

        {/* ── HERO ── */}
        <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
          <img src={coach.cover_url} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'cp-hero-in 0.7s ease both' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(4,6,15,1) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 80% 20%, rgba(${sc.rgb},0.18) 0%, transparent 65%)` }} />

          {/* Back button */}
          {onBack && (
            <button onClick={onBack} style={{ position: 'absolute', top: 52, left: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)' }}>
              <ArrowLeft style={{ width: 15, height: 15, color: '#fff' }} />
            </button>
          )}

          {/* Action buttons */}
          <div style={{ position: 'absolute', top: 52, right: 16, display: 'flex', gap: 8 }}>
            {[
              { I: Heart, act: () => { setFollowing(f => !f); showToast(following ? 'Removed from favourites' : '❤️ Added to favourites!'); }, on: following, ac: '#f472b6' },
              { I: Share2, act: () => { try { navigator.clipboard.writeText(coach.name); } catch {} showToast('Link copied 🔗'); } },
            ].map(({ I, act, on, ac }, i) => (
              <motion.button key={i} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                onClick={act} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(12px)' }}>
                <I style={{ width: 14, height: 14, color: on ? ac : '#fff', fill: on && ac ? ac : 'none', transition: 'all 0.2s' }} />
              </motion.button>
            ))}
          </div>

          {/* Coach identity */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 18px 0' }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, type: 'spring', stiffness: 220, damping: 28 }}>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 14 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 82, height: 82, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    background: `linear-gradient(135deg,${sc.color}55,${sc.color}22)`,
                    border: `3px solid #fbbf24`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, fontWeight: 900, color: '#fff',
                    boxShadow: `0 0 0 3px rgba(251,191,36,0.3), 0 8px 24px rgba(${sc.rgb},0.4)`,
                  }}>
                    {coach.avatar_url
                      ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : ini(coach.name)}
                  </div>
                  {/* Online indicator */}
                  <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: '#34d399', border: '2px solid #04060f', boxShadow: '0 0 8px rgba(52,211,153,0.8)' }} />
                </div>

                <div style={{ flex: 1, paddingBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '3px 10px' }}>
                      {sc.emoji} Coach
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 20, padding: '3px 10px' }}>
                      ● Available
                    </span>
                  </div>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 4, fontFamily: "'Space Grotesk', sans-serif" }}>{coach.name}</h1>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{coach.title}</div>
                </div>
              </div>

              {/* Rating + location row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ display: 'flex', gap: 1.5 }}>
                    {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 12, height: 12, fill: s <= Math.round(coach.rating) ? '#fbbf24' : 'transparent', color: s <= Math.round(coach.rating) ? '#fbbf24' : 'rgba(255,255,255,0.2)' }} />)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>{coach.rating}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>({coach.total_reviews} reviews)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>
                  <MapPin style={{ width: 11, height: 11 }} />{coach.location}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ padding: '16px 16px 0', display: 'flex', gap: 10 }}>
          <StatBubble icon={TrendingUp}  value={`${coach.experience_years}yr`} label="Experience"   color={sc.color} rgb={sc.rgb} delay={0.05} />
          <StatBubble icon={Users}       value={`${coach.total_clients}+`}     label="Clients"      color={sc.color} rgb={sc.rgb} delay={0.1} />
          <StatBubble icon={Dumbbell}    value={`${(coach.classes_taught/1000).toFixed(1)}k`} label="Classes" color={sc.color} rgb={sc.rgb} delay={0.15} />
          <StatBubble icon={Star}        value={avg}                            label="Avg Rating"   color='#fbbf24'  rgb='251,191,36' delay={0.2} />
        </div>

        {/* ── CTA buttons ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          style={{ display: 'flex', gap: 10, padding: '14px 16px 0' }}>
          <button onClick={() => setShowBooking(true)}
            style={{
              flex: 2, padding: '14px', borderRadius: 16, fontSize: 14, fontWeight: 900,
              cursor: 'pointer', border: 'none', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color: '#fff', boxShadow: '0 6px 28px rgba(37,99,235,0.5),inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', animation: 'cp-shimmer 4s ease infinite 2s' }} />
            </div>
            <span style={{ position: 'relative', zIndex: 1 }}>📅 Book a Session</span>
          </button>
          <button onClick={() => setShowMessage(true)} className="cp-btn-ghost" style={{ flex: 1, padding: '14px', borderRadius: 16, fontSize: 13 }}>
            <MessageSquare style={{ width: 14, height: 14 }} />Message
          </button>
          <button
            onClick={() => { setFollowing(f => !f); showToast(following ? 'Unfollowed' : `Following ${coach.name}! 🎉`); }}
            style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              border: `1px solid ${following ? sc.border : 'rgba(255,255,255,0.1)'}`,
              background: following ? sc.bg : 'rgba(255,255,255,0.04)',
            }}>
            <UserPlus style={{ width: 17, height: 17, color: following ? sc.color : 'rgba(255,255,255,0.45)' }} />
          </button>
        </motion.div>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginTop: 18, paddingLeft: 6, overflowX: 'auto' }}>
          {['about','classes','schedule','reviews'].map(t => (
            <button key={t} className={`cp-tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)} style={{ '--accent-color': sc.color, marginBottom: -1 }}>
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div style={{ padding: '18px 16px 120px' }}>

          {/* ===== ABOUT ===== */}
          {tab === 'about' && (
            <motion.div key="about" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Bio */}
              <div>
                <SectionHead>About</SectionHead>
                <p style={{ fontSize: 14, color: 'rgba(226,232,240,0.72)', lineHeight: 1.72, marginBottom: 12 }}>{coach.bio}</p>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Philosophy</div>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.68, fontStyle: 'italic' }}>"{coach.philosophy}"</p>
              </div>

              {/* Specialties */}
              <div>
                <SectionHead>Specialties</SectionHead>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {coach.specialties.map((s, i) => (
                    <span key={i} style={{ padding: '6px 13px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              {coach.achievements?.length > 0 && (
              <div>
                <SectionHead>Achievements</SectionHead>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                  {coach.achievements.map((a, i) => <AchievementBadge key={i} {...a} />)}
                </div>
              </div>
              )}

              {/* Certifications */}
              <div>
                <SectionHead>Certifications & Credentials</SectionHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: CARD_BG, border: CARD_BORDER, borderRadius: 18, overflow: 'hidden' }}>
                  {coach.certifications.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderBottom: i < coach.certifications.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Award style={{ width: 15, height: 15, color: '#fbbf24' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{c.issuer} · {c.year}</div>
                      </div>
                      <CheckCircle style={{ width: 14, height: 14, color: '#34d399', flexShrink: 0 }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info grid */}
              <div>
                <SectionHead>Info</SectionHead>
                <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 18, overflow: 'hidden' }}>
                  {[
                    { I: MapPin, l: 'Location', v: coach.location },
                    { I: Activity, l: 'Gym', v: coach.gym },
                    { I: Globe, l: 'Languages', v: coach.languages.join(', ') },
                    { I: Instagram, l: 'Instagram', v: coach.social.instagram, link: true },
                    { I: Youtube, l: 'YouTube', v: coach.social.youtube, link: true },
                  ].map(({ I, l, v, link }, i, arr) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: link ? 'pointer' : 'default' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: `rgba(${sc.rgb},0.1)`, border: `1px solid rgba(${sc.rgb},0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <I style={{ width: 13, height: 13, color: sc.color }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600, flex: 1 }}>{l}</span>
                      <span style={{ fontSize: 12.5, color: link ? sc.color : '#fff', fontWeight: 700 }}>{v}</span>
                      {link && <ExternalLink style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* ===== CLASSES ===== */}
          {tab === 'classes' && (
            <motion.div key="classes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div>
                <SectionHead>Active Classes</SectionHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {coach.classes.map(cls => (
                    <ClassCard key={cls.id} cls={cls} accentColor={sc.color} accentBorder={sc.border} accentBg={sc.bg} accentRgb={sc.rgb} />
                  ))}
                </div>
              </div>

              {/* Quick booking CTA */}
              <div style={{ background: `rgba(${sc.rgb},0.07)`, border: `1px solid rgba(${sc.rgb},0.2)`, borderRadius: 18, padding: '18px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Want a private session?</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>1-on-1 coaching tailored entirely to your goals.</div>
                <button onClick={() => setShowBooking(true)}
                  style={{ padding: '12px 28px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color }}>
                  Book 1-on-1 Session
                </button>
              </div>

              {/* Training packages */}
              <div>
                <SectionHead>Training Packages</SectionHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {[
                    { name: 'Starter Pack', sessions: 4,  price: '$320', saving: '',       popular: false, desc: 'Perfect for getting started' },
                    { name: 'Transform',    sessions: 8,  price: '$560', saving: 'Save $80', popular: true,  desc: 'Most popular — 8 week plan' },
                    { name: 'Elite',        sessions: 12, price: '$780', saving: 'Save $240', popular: false, desc: 'Full immersive programme' },
                  ].map(pkg => (
                    <div key={pkg.name} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 15px', borderRadius: 16, cursor: 'pointer',
                      background: pkg.popular ? `rgba(${sc.rgb},0.07)` : 'rgba(255,255,255,0.025)',
                      border: `1px solid ${pkg.popular ? sc.border : 'rgba(255,255,255,0.07)'}`,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {pkg.popular && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${sc.color},transparent)` }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{pkg.name}</span>
                          {pkg.popular && <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '1px 6px' }}>Popular</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)' }}>{pkg.sessions} sessions · {pkg.desc}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: pkg.popular ? sc.color : '#fff' }}>{pkg.price}</div>
                        {pkg.saving && <div style={{ fontSize: 10, fontWeight: 700, color: '#34d399', marginTop: 2 }}>{pkg.saving}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== SCHEDULE ===== */}
          {tab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Day selector */}
              <div>
                <SectionHead>Weekly Availability</SectionHead>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
                  {DAYS.map(d => {
                    const slots = coach.availability[d] || [];
                    const hasSlots = slots.length > 0;
                    const active = selectedDay === d;
                    return (
                      <button key={d}
                        className={`cp-avail-slot${active ? ' active' : ''}`}
                        style={{ '--accent-color': sc.color, '--accent-rgb': sc.rgb, opacity: hasSlots ? 1 : 0.4 }}
                        onClick={() => setSelectedDay(active ? null : d)}>
                        <div>{d}</div>
                        <div style={{ fontSize: 8, marginTop: 3, fontWeight: 700 }}>{hasSlots ? `${slots.length}` : '—'}</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.25)', marginTop: 8, textAlign: 'center' }}>Tap a day to see available slots</div>
              </div>

              {/* Time slots */}
              <AnimatePresence>
                {selectedDay && (
                  <motion.div key={selectedDay} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <SectionHead>{selectedDay} — Available Times</SectionHead>
                    {(coach.availability[selectedDay] || []).length === 0 ? (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0' }}>No sessions available this day.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
                        {(coach.availability[selectedDay] || []).map(time => (
                          <button key={time} onClick={() => setShowBooking(true)}
                            style={{
                              padding: '12px 8px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                              border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, textAlign: 'center',
                            }}>
                            {time}:00
                            <div style={{ fontSize: 9, fontWeight: 600, color: `rgba(${sc.rgb},0.6)`, marginTop: 3 }}>Book</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upcoming 1:1 sessions */}
              <div>
                <SectionHead>Upcoming Available Sessions</SectionHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { day: 'Mon', date: '24 Mar', time: '7:00 AM', type: 'Power HIIT', spots: 4, isNext: true },
                    { day: 'Tue', date: '25 Mar', time: '6:00 AM', type: 'Strength', spots: 12 },
                    { day: 'Wed', date: '26 Mar', time: '7:00 AM', type: 'Power HIIT', spots: 4 },
                    { day: 'Sat', date: '29 Mar', time: '10:00 AM', type: '1-on-1', spots: 1 },
                  ].map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
                      background: s.isNext ? `rgba(${sc.rgb},0.07)` : 'rgba(255,255,255,0.025)',
                      border: `1px solid ${s.isNext ? sc.border : 'rgba(255,255,255,0.06)'}`,
                    }}>
                      <div style={{ width: 44, height: 44, borderRadius: 13, background: CARD_BG, border: CARD_BORDER, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: s.isNext ? sc.color : '#fff', lineHeight: 1 }}>{s.date.split(' ')[0]}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1, marginTop: 2 }}>{s.date.split(' ')[1]}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.day}</span>
                          {s.isNext && <span style={{ fontSize: 9, fontWeight: 900, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '1px 6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Next</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', gap: 8 }}>
                          <span>{s.time}</span>
                          <span style={{ color: s.spots <= 2 ? '#fbbf24' : 'rgba(255,255,255,0.28)' }}>{s.spots} spot{s.spots !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <button onClick={() => setShowBooking(true)}
                        style={{ fontSize: 11, fontWeight: 800, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10, padding: '7px 13px', cursor: 'pointer' }}>
                        Book
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add to calendar */}
              <button onClick={() => showToast('Opening calendar…')} className="cp-btn-ghost" style={{ padding: '13px', borderRadius: 14, justifyContent: 'center', gap: 8 }}>
                <Calendar style={{ width: 14, height: 14 }} />Add Coach to Calendar<ExternalLink style={{ width: 12, height: 12, opacity: 0.4 }} />
              </button>
            </motion.div>
          )}

          {/* ===== REVIEWS ===== */}
          {tab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Rating overview */}
              <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 20, padding: '18px' }}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>{avg}</div>
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 6 }}>
                      {[1,2,3,4,5].map(s => <Star key={s} style={{ width: 13, height: 13, fill: s <= Math.round(parseFloat(avg)) ? '#fbbf24' : 'rgba(255,255,255,0.12)', color: s <= Math.round(parseFloat(avg)) ? '#fbbf24' : 'rgba(255,255,255,0.12)' }} />)}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 6, fontWeight: 600 }}>{coach.total_reviews} reviews</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ratCounts.map(({ s, n, p }) => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', fontWeight: 700, width: 8, flexShrink: 0 }}>{s}</span>
                        <Star style={{ width: 9, height: 9, fill: '#fbbf24', color: '#fbbf24', flexShrink: 0 }} />
                        <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p}%`, background: '#fbbf24', borderRadius: 99, animation: 'cp-bar 1s ease both' }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', width: 14, textAlign: 'right', flexShrink: 0 }}>{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sentiment tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {['Great form cues', 'Motivating', 'Punctual', 'Personalised', 'Results-focused', 'Encouraging'].map(t => (
                  <span key={t} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>✓ {t}</span>
                ))}
              </div>

              {/* Reviews list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(moreReviews ? REVIEWS : REVIEWS.slice(0, 3)).map((r, i) => (
                  <ReviewCard key={i} r={r} accentColor={sc.color} accentBorder={sc.border} accentBg={sc.bg} />
                ))}
              </div>

              {REVIEWS.length > 3 && (
                <button onClick={() => setMoreReviews(s => !s)} className="cp-btn-ghost" style={{ justifyContent: 'center', padding: '12px', borderRadius: 14 }}>
                  {moreReviews ? <><ChevronUp style={{ width: 14, height: 14 }} />Show Less</> : <><ChevronDown style={{ width: 14, height: 14 }} />Show All {REVIEWS.length} Reviews</>}
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Sticky CTA ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 28 }}
        style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, zIndex: 100, padding: '12px 16px 30px', background: 'linear-gradient(to top,#04060f 60%,transparent)', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', gap: 10, pointerEvents: 'all' }}>
          <button onClick={() => setShowBooking(true)}
            style={{
              flex: 1, padding: '15px', borderRadius: 18, fontSize: 15, fontWeight: 900, cursor: 'pointer', border: 'none', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff',
              boxShadow: '0 6px 28px rgba(37,99,235,0.5),inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)', animation: 'cp-shimmer 4s ease infinite 1.5s' }} />
            </div>
            <span style={{ position: 'relative', zIndex: 1 }}>Book a Session</span>
          </button>
          <button onClick={() => setShowMessage(true)}
            style={{ width: 52, borderRadius: 18, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <MessageSquare style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.55)' }} />
          </button>
        </div>
      </motion.div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div key="t" initial={{ opacity: 0, y: 18, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ duration: 0.28, ease: [0.34,1.1,0.64,1] }}
            style={{ position: 'fixed', bottom: 110, left: '50%', transform: 'translateX(-50%)', zIndex: 10300, background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '11px 20px', fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', backdropFilter: 'blur(20px)', boxShadow: `0 4px 24px rgba(${sc.rgb},0.22)` }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <BookingModal open={showBooking} onClose={() => setShowBooking(false)} coach={coach}
        accentColor={sc.color} accentBorder={sc.border} accentBg={sc.bg} accentRgb={sc.rgb} />
      <MessageSheet open={showMessage} onClose={() => setShowMessage(false)} coach={coach}
        accentColor={sc.color} accentBorder={sc.border} accentBg={sc.bg} />
    </div>
  );
}