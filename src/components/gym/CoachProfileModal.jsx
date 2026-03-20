import React from 'react';
import { X, Star, GraduationCap, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CoachProfileModal({ coach, open, onClose }) {
  if (!open || !coach) return null;

  const ci = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

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
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
              borderRadius: '24px 24px 0 0',
              background: 'linear-gradient(135deg, rgba(15,20,45,0.98) 0%, rgba(6,8,20,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderBottom: 'none',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
              padding: '0 0 40px',
              maxHeight: '95vh',
              overflowY: 'auto',
            }}>

            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.18)', margin: '14px auto 0' }} />

            {/* Close */}
            <button onClick={onClose} style={{
              position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <X style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.6)' }} />
            </button>

            {/* Hero */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 20px', gap: 12 }}>
              {/* Avatar with yellow ring */}
              <div style={{
                width: 88, height: 88, borderRadius: '50%', overflow: 'hidden',
                background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 900, color: '#fff',
                border: '3px solid #fbbf24',
                boxShadow: '0 0 0 3px rgba(251,191,36,0.35), 0 8px 24px rgba(59,130,246,0.4)',
              }}>
                {coach.avatar_url
                  ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : ci(coach.name)}
              </div>

              {/* Coach badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99,
                background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <GraduationCap style={{ width: 11, height: 11, color: '#fbbf24' }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Coach</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{coach.name}</div>
                {coach.rating && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 6 }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} style={{ width: 14, height: 14, fill: s <= Math.round(coach.rating) ? '#fbbf24' : 'transparent', color: s <= Math.round(coach.rating) ? '#fbbf24' : 'rgba(255,255,255,0.2)' }} />
                    ))}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginLeft: 2 }}>{coach.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 20px' }} />

            <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Bio */}
              {coach.bio && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>About</div>
                  <div style={{ fontSize: 13.5, color: 'rgba(226,232,240,0.75)', lineHeight: 1.65 }}>{coach.bio}</div>
                </div>
              )}

              {/* Specialties */}
              {coach.specialties?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Specialties</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {coach.specialties.map((s, i) => (
                      <span key={i} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {coach.certifications?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Certifications</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {coach.certifications.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Award style={{ width: 13, height: 13, color: '#fbbf24', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats row */}
              {(coach.experience_years || coach.total_clients) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {coach.experience_years && (
                    <div style={{ borderRadius: 14, padding: '12px', textAlign: 'center',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>{coach.experience_years}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Years Exp.</div>
                    </div>
                  )}
                  {coach.total_clients && (
                    <div style={{ borderRadius: 14, padding: '12px', textAlign: 'center',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}>{coach.total_clients}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>Clients</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}