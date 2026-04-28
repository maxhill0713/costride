import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, Bell, X, Clock, Dumbbell } from 'lucide-react';

function buildGoogleCalendarUrl(gymClass, gymName) {
  const title = encodeURIComponent(`${gymClass.name} at ${gymName || 'the gym'}`);
  const details = encodeURIComponent(
    `Class: ${gymClass.name}\nInstructor: ${gymClass.instructor || 'TBC'}\nDuration: ${gymClass.duration_minutes ? gymClass.duration_minutes + ' min' : 'TBC'}`
  );
  const location = encodeURIComponent(gymName || '');

  // Try to get a date from schedule
  let startDate = '';
  let endDate = '';
  if (Array.isArray(gymClass.schedule) && gymClass.schedule[0]) {
    const s = gymClass.schedule[0];
    const dateStr = s.date || new Date().toISOString().split('T')[0];
    const timeStr = (s.time || '09:00').replace(':', '');
    startDate = `${dateStr.replace(/-/g, '')}T${timeStr.padStart(4, '0')}00`;
    // Add duration
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

function buildAppleCalendarUrl(gymClass, gymName) {
  const title = encodeURIComponent(`${gymClass.name} at ${gymName || 'the gym'}`);
  const notes = encodeURIComponent(`Instructor: ${gymClass.instructor || 'TBC'}`);
  return `webcal://calendar.apple.com/calendar?action=TEMPLATE&title=${title}&notes=${notes}`;
}

export default function ClassBookedModal({ open, onClose, gymClass, gymName }) {
  const [reminderSet, setReminderSet] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  if (!gymClass) return null;

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
    // Request browser notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const googleUrl = buildGoogleCalendarUrl(gymClass, gymName);

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
              position: 'fixed', inset: 0, zIndex: 10500,
              background: 'rgba(2,4,10,0.88)',
              backdropFilter: 'blur(14px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.82, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10501,
              width: 'calc(100% - 32px)', maxWidth: 360,
              background: 'linear-gradient(160deg, #0d1232 0%, #060810 100%)',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 28,
              boxShadow: '0 0 80px rgba(52,211,153,0.15), 0 32px 80px rgba(0,0,0,0.85)',
              overflow: 'hidden',
            }}
          >
            {/* Green top bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)' }} />

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.5)' }} />
            </button>

            <div style={{ padding: '28px 24px 28px' }}>
              {/* Success icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(16,185,129,0.15)',
                    border: '2px solid rgba(52,211,153,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(52,211,153,0.25)',
                  }}
                >
                  <CheckCircle style={{ width: 36, height: 36, color: '#34d399' }} />
                </motion.div>
              </div>

              {/* Text */}
              <div style={{ textAlign: 'center', marginBottom: 22 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 6 }}>
                  You're booked! 🎉
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399', marginBottom: 6 }}>
                  {gymClass.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {gymClass.instructor && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                      with {gymClass.instructor}
                    </span>
                  )}
                  {gymClass.duration_minutes && (
                    <>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                        <Clock style={{ width: 10, height: 10 }} />{gymClass.duration_minutes} min
                      </span>
                    </>
                  )}
                </div>
                {scheduleInfo && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                    📅 {scheduleInfo}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Add to Calendar */}
                {!calendarOpen ? (
                  <button
                    onClick={() => setCalendarOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                      padding: '14px', borderRadius: 16,
                      background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
                      border: '1px solid transparent',
                      borderBottom: '3px solid #1a3fa8',
                      boxShadow: '0 3px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                      color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    }}
                  >
                    <Calendar style={{ width: 16, height: 16 }} />
                    Add to Calendar
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={googleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '12px 8px', borderRadius: 14, textDecoration: 'none',
                        background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                        color: '#60a5fa', fontSize: 12, fontWeight: 800,
                      }}
                    >
                      <Calendar style={{ width: 13, height: 13 }} />
                      Google
                    </a>
                    <a
                      href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${encodeURIComponent(gymClass.name + ' at ' + (gymName || 'Gym'))}%0ADESCRIPTION:${encodeURIComponent('Instructor: ' + (gymClass.instructor || 'TBC'))}%0AEND:VEVENT%0AEND:VCALENDAR`}
                      download={`${gymClass.name.replace(/\s+/g, '_')}.ics`}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '12px 8px', borderRadius: 14, textDecoration: 'none',
                        background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                        color: '#60a5fa', fontSize: 12, fontWeight: 800,
                      }}
                    >
                      <Calendar style={{ width: 13, height: 13 }} />
                      Apple / Other
                    </a>
                  </div>
                )}

                {/* Set Reminder */}
                <button
                  onClick={handleSetReminder}
                  disabled={reminderSet}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    padding: '14px', borderRadius: 16,
                    background: reminderSet ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${reminderSet ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.1)'}`,
                    borderBottom: `3px solid ${reminderSet ? 'rgba(180,130,0,0.5)' : 'rgba(0,0,0,0.5)'}`,
                    boxShadow: '0 2px 0 rgba(0,0,0,0.3)',
                    color: reminderSet ? '#fbbf24' : 'rgba(255,255,255,0.55)',
                    fontSize: 14, fontWeight: 800, cursor: reminderSet ? 'default' : 'pointer',
                  }}
                >
                  <Bell style={{ width: 16, height: 16, fill: reminderSet ? '#fbbf24' : 'none' }} />
                  {reminderSet ? '⏰ Reminder set — 1hr before' : 'Set a Reminder'}
                </button>

                {/* Close / Done */}
                <button
                  onClick={onClose}
                  style={{
                    padding: '12px', borderRadius: 14,
                    background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}