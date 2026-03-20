import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, MapPin, Star, Calendar, Dumbbell } from 'lucide-react';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';

const CLASS_TYPE_CONFIG = {
  hiit:     { label:'HIIT',     emoji:'⚡', color:'#f87171', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)'   },
  yoga:     { label:'Yoga',     emoji:'🧘', color:'#34d399', bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)'  },
  strength: { label:'Strength', emoji:'🏋️', color:'#818cf8', bg:'rgba(99,102,241,0.12)',  border:'rgba(99,102,241,0.25)'  },
  cardio:   { label:'Cardio',   emoji:'🏃', color:'#fb7185', bg:'rgba(244,63,94,0.12)',   border:'rgba(244,63,94,0.25)'   },
  spin:     { label:'Spin',     emoji:'🚴', color:'#38bdf8', bg:'rgba(14,165,233,0.12)',  border:'rgba(14,165,233,0.25)'  },
  boxing:   { label:'Boxing',   emoji:'🥊', color:'#fb923c', bg:'rgba(234,88,12,0.12)',   border:'rgba(234,88,12,0.25)'   },
  pilates:  { label:'Pilates',  emoji:'🌸', color:'#c084fc', bg:'rgba(168,85,247,0.12)',  border:'rgba(168,85,247,0.25)'  },
  default:  { label:'Class',    emoji:'🎯', color:'#38bdf8', bg:'rgba(14,165,233,0.10)',  border:'rgba(14,165,233,0.2)'   },
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
  if (Array.isArray(schedule)) {
    return DAYS_SHORT.filter(d => schedule.some(s => (s.day || '').toLowerCase().includes(d.toLowerCase())));
  }
  if (typeof schedule === 'string') {
    return DAYS_SHORT.filter(d => schedule.toLowerCase().includes(d.toLowerCase()));
  }
  return [];
}

export default function ClassDetailModal({ gymClass, open, onClose, booked, onBook, isOwner }) {
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
  const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(2,4,10,0.75)', backdropFilter: 'blur(6px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
              maxHeight: '92vh', overflowY: 'auto',
              borderRadius: '24px 24px 0 0',
              background: 'linear-gradient(160deg, #0d1232 0%, #02040a 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Hero image */}
            <div style={{ position: 'relative', height: 220, overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
              <img src={img} alt={gymClass.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(2,4,10,0.9) 100%)' }} />

              {/* Close button */}
              <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X style={{ width: 16, height: 16, color: '#fff' }} />
              </button>

              {/* Type badge */}
              <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, background: 'rgba(0,0,0,0.6)', border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '4px 10px', backdropFilter: 'blur(6px)' }}>
                {cfg.emoji} {cfg.label}
              </div>

              {/* Title over image */}
              <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, margin: 0 }}>
                  {gymClass.name || gymClass.title}
                </h2>
                {(gymClass.instructor || gymClass.coach_name) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${cfg.color}55, ${cfg.color}22)`, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: cfg.color, flexShrink: 0 }}>
                      {initials(gymClass.instructor || gymClass.coach_name)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{gymClass.instructor || gymClass.coach_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 18px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {gymClass.duration_minutes && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                    <Clock style={{ width: 18, height: 18, color: cfg.color, margin: '0 auto 6px' }} />
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{gymClass.duration_minutes}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>minutes</div>
                  </div>
                )}
                {capacity !== null && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                    <Users style={{ width: 18, height: 18, color: isFull ? '#f87171' : cfg.color, margin: '0 auto 6px' }} />
                    <div style={{ fontSize: 15, fontWeight: 900, color: isFull ? '#f87171' : '#fff' }}>{spotsLeft ?? '∞'}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>spots left</div>
                  </div>
                )}
                {gymClass.difficulty && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' }}>
                    <Star style={{ width: 18, height: 18, color: cfg.color, margin: '0 auto 6px' }} />
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                      {gymClass.difficulty.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>level</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {gymClass.description && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>About This Class</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: 0 }}>{gymClass.description}</p>
                </div>
              )}

              {/* Schedule */}
              {gymClass.schedule && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Schedule</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px' }}>
                    <Calendar style={{ width: 15, height: 15, color: cfg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{gymClass.schedule}</span>
                  </div>
                  {scheduleDays.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      {DAYS_SHORT.map(d => {
                        const on = scheduleDays.includes(d);
                        return (
                          <div key={d} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 10, fontSize: 10, fontWeight: 900, background: on ? cfg.bg : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? cfg.border : 'rgba(255,255,255,0.06)'}`, color: on ? cfg.color : 'rgba(255,255,255,0.18)' }}>{d}</div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Location */}
              {gymClass.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 14px' }}>
                  <MapPin style={{ width: 15, height: 15, color: cfg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{gymClass.location}</span>
                </div>
              )}

              {/* Capacity bar */}
              {fillPct !== null && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Spots filled</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: isFull ? '#f87171' : cfg.color }}>{enrolled}/{capacity} ({fillPct}%)</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${fillPct}%`, borderRadius: 99, background: isFull ? '#ef4444' : `linear-gradient(90deg, ${cfg.color}aa, ${cfg.color})`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )}

              {/* Book button */}
              {!isOwner && (
                <button
                  onClick={() => { if (!isFull || booked) { onBook && onBook(gymClass.id); } }}
                  disabled={isFull && !booked}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 16, fontSize: 15, fontWeight: 900,
                    cursor: (isFull && !booked) ? 'default' : 'pointer', border: 'none', letterSpacing: '-0.01em',
                    background: booked
                      ? 'rgba(16,185,129,0.15)'
                      : isFull
                        ? 'rgba(255,255,255,0.06)'
                        : `linear-gradient(135deg, #2563eb, #1d4ed8)`,
                    color: booked ? '#34d399' : isFull ? 'rgba(255,255,255,0.25)' : '#fff',
                    boxShadow: (!booked && !isFull) ? '0 6px 24px rgba(37,99,235,0.45)' : 'none',
                    outline: booked ? '1px solid rgba(52,211,153,0.3)' : 'none',
                  }}
                >
                  {booked ? '✓ Booked — tap to cancel' : isFull ? 'Class Full' : spotsLeft !== null ? `Book Now (${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left)` : 'Book Now'}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}