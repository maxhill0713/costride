import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, Bell, X, Clock } from 'lucide-react';

function buildGoogleCalendarUrl(gymClass, gymName) {
  const title = encodeURIComponent(`${gymClass.name} at ${gymName || 'the gym'}`);
  const details = encodeURIComponent(
    `Class: ${gymClass.name}\nInstructor: ${gymClass.instructor || 'TBC'}\nDuration: ${gymClass.duration_minutes ? gymClass.duration_minutes + ' min' : 'TBC'}`
  );
  const location = encodeURIComponent(gymName || '');
  let startDate = '', endDate = '';
  if (Array.isArray(gymClass.schedule) && gymClass.schedule[0]) {
    const s = gymClass.schedule[0];
    const dateStr = s.date || new Date().toISOString().split('T')[0];
    const timeStr = (s.time || '09:00').replace(':', '');
    startDate = `${dateStr.replace(/-/g, '')}T${timeStr.padStart(4, '0')}00`;
    const dur = gymClass.duration_minutes || 60;
    const [h, m] = (s.time || '09:00').split(':').map(Number);
    const total = h * 60 + m + dur;
    const eh = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const em = String(total % 60).padStart(2, '0');
    endDate = `${dateStr.replace(/-/g, '')}T${eh}${em}00`;
  } else {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    startDate = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}T090000`;
    endDate   = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}T100000`;
  }
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

// Floating sparkle particle
function Particle({ delay, x, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-10, -55 - Math.random() * 30],
        x: [0, x],
        scale: [0, 1, 0.8, 0],
        rotate: [0, 180],
      }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 6,
        height: 6,
        borderRadius: 2,
        background: color,
        pointerEvents: 'none',
      }}
    />
  );
}

const PARTICLES = [
  { x: -48, color: '#34d399', delay: 0.2 },
  { x: 48,  color: '#60a5fa', delay: 0.25 },
  { x: -24, color: '#fbbf24', delay: 0.3 },
  { x: 24,  color: '#f472b6', delay: 0.15 },
  { x: -60, color: '#a78bfa', delay: 0.35 },
  { x: 60,  color: '#34d399', delay: 0.1 },
  { x: 0,   color: '#60a5fa', delay: 0.4 },
  { x: -36, color: '#fbbf24', delay: 0.2 },
  { x: 36,  color: '#f472b6', delay: 0.3 },
];

export default function ClassBookedModal({ open, onClose, gymClass, gymName }) {
  const [reminderSet, setReminderSet] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (open) {
      setReminderSet(false);
      setCalendarOpen(false);
      setTimeout(() => setShowParticles(true), 150);
      setTimeout(() => setShowParticles(false), 2000);
    }
  }, [open]);

  if (!gymClass || !open) return null;

  const scheduleInfo = (() => {
    if (Array.isArray(gymClass.schedule) && gymClass.schedule[0]) {
      const s = gymClass.schedule[0];
      const parts = [];
      if (s.day) parts.push(s.day);
      if (s.time) parts.push(`at ${s.time}`);
      if (s.date) {
        try {
          parts.push(new Date(s.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
        } catch {}
      }
      return parts.join(' ');
    }
    return null;
  })();

  const handleSetReminder = () => {
    setReminderSet(true);
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const googleUrl = buildGoogleCalendarUrl(gymClass, gymName);
  const icsData = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${encodeURIComponent(gymClass.name + ' at ' + (gymName || 'Gym'))}%0ADESCRIPTION:${encodeURIComponent('Instructor: ' + (gymClass.instructor || 'TBC'))}%0AEND:VEVENT%0AEND:VCALENDAR`;

  return (
    <AnimatePresence>
      {open && (
        /* ── Backdrop doubles as the flex centering wrapper ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(2,4,12,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* ── Modal ── */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 32 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              position: 'relative',
              background: 'linear-gradient(170deg, #0c1228 0%, #060910 60%, #040608 100%)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 28,
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.9), 0 0 60px rgba(52,211,153,0.08)',
            }}
          >
            {/* Top accent bar */}
            <div style={{
              height: 2,
              background: 'linear-gradient(90deg, transparent 0%, #10b981 30%, #34d399 50%, #10b981 70%, transparent 100%)',
            }} />

            {/* Radial glow behind icon */}
            <div style={{
              position: 'absolute',
              top: -40,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', zIndex: 2,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <X style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.4)' }} />
            </button>

            <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* ── Success icon + particles ── */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, position: 'relative' }}>
                {showParticles && PARTICLES.map((p, i) => (
                  <Particle key={i} {...p} />
                ))}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
                  style={{
                    width: 76, height: 76, borderRadius: '50%',
                    background: 'rgba(16,185,129,0.12)',
                    border: '1.5px solid rgba(52,211,153,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Pulsing ring */}
                  <motion.div
                    animate={{ scale: [1, 1.35], opacity: [0.3, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', inset: -2,
                      borderRadius: '50%',
                      border: '1.5px solid rgba(52,211,153,0.5)',
                    }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.6], opacity: [0.15, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                    style={{
                      position: 'absolute', inset: -2,
                      borderRadius: '50%',
                      border: '1.5px solid rgba(52,211,153,0.3)',
                    }}
                  />
                  <CheckCircle style={{ width: 34, height: 34, color: '#34d399' }} />
                </motion.div>
              </div>

              {/* ── Heading ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ textAlign: 'center', marginBottom: 6 }}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#34d399',
                  marginBottom: 8,
                }}>
                  Booking confirmed
                </div>
                <div style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#fff',
                  letterSpacing: '-0.04em',
                  lineHeight: 1.15,
                  marginBottom: 10,
                }}>
                  You're in! 🎉
                </div>
              </motion.div>

              {/* ── Class info card ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 18,
                  padding: '14px 16px',
                  marginBottom: 18,
                }}
              >
                <div style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                  marginBottom: 8,
                }}>
                  {gymClass.name}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                  {gymClass.instructor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, color: '#fff',
                      }}>
                        {gymClass.instructor.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                        {gymClass.instructor}
                      </span>
                    </div>
                  )}
                  {gymClass.duration_minutes && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                        {gymClass.duration_minutes} min
                      </span>
                    </div>
                  )}
                  {scheduleInfo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                        {scheduleInfo}
                      </span>
                    </div>
                  )}
                </div>

                {/* Gym name badge */}
                {gymName && (
                  <div style={{ marginTop: 10 }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 100,
                      background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.2)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#34d399',
                      letterSpacing: '0.04em',
                    }}>
                      {gymName}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* ── Action buttons ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {/* Add to Calendar */}
                <AnimatePresence mode="wait">
                  {!calendarOpen ? (
                    <motion.button
                      key="cal-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCalendarOpen(true)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                        padding: '15px',
                        borderRadius: 16,
                        background: 'linear-gradient(160deg, #1d4ed8 0%, #1e40af 50%, #1e3a8a 100%)',
                        border: '1px solid rgba(96,165,250,0.3)',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.1) inset, 0 4px 16px rgba(29,78,216,0.35)',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 800,
                        cursor: 'pointer',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      <Calendar style={{ width: 16, height: 16 }} />
                      Add to Calendar
                    </motion.button>
                  ) : (
                    <motion.div
                      key="cal-options"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ display: 'flex', gap: 8 }}
                    >
                      {[
                        { label: 'Google', href: googleUrl, target: '_blank' },
                        { label: 'Apple / .ics', href: icsData, download: `${gymClass.name.replace(/\s+/g, '_')}.ics` },
                      ].map(opt => (
                        <a
                          key={opt.label}
                          href={opt.href}
                          target={opt.target}
                          download={opt.download}
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '13px 8px',
                            borderRadius: 14,
                            textDecoration: 'none',
                            background: 'rgba(59,130,246,0.1)',
                            border: '1px solid rgba(59,130,246,0.25)',
                            color: '#60a5fa',
                            fontSize: 13,
                            fontWeight: 800,
                            transition: 'background 0.15s',
                          }}
                        >
                          <Calendar style={{ width: 13, height: 13 }} />
                          {opt.label}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Set Reminder */}
                <motion.button
                  whileHover={!reminderSet ? { scale: 1.01 } : {}}
                  whileTap={!reminderSet ? { scale: 0.98 } : {}}
                  onClick={handleSetReminder}
                  disabled={reminderSet}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    padding: '15px',
                    borderRadius: 16,
                    background: reminderSet
                      ? 'rgba(251,191,36,0.08)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${reminderSet ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: reminderSet ? '0 0 24px rgba(251,191,36,0.08)' : 'none',
                    color: reminderSet ? '#fbbf24' : 'rgba(255,255,255,0.45)',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: reminderSet ? 'default' : 'pointer',
                    letterSpacing: '-0.01em',
                    transition: 'all 0.2s',
                  }}
                >
                  <Bell style={{
                    width: 16, height: 16,
                    fill: reminderSet ? '#fbbf24' : 'none',
                    transition: 'fill 0.2s',
                  }} />
                  {reminderSet ? 'Reminder set — 1 hr before' : 'Set a Reminder'}
                </motion.button>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '2px 0' }} />

                {/* Done */}
                <button
                  onClick={onClose}
                  style={{
                    padding: '11px',
                    borderRadius: 14,
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                >
                  Done
                </button>
              </motion.div>
            </div>

            {/* Bottom safe-area spacer for iOS */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
