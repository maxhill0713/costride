import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Calendar, Bell, X, Clock, MapPin, User, ChevronRight } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — shared with CoachProfileModal
// ─────────────────────────────────────────────────────────────────────────────
const CARD_BG     = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';
const SHEET_BG    = 'linear-gradient(160deg,#0c1128 0%,#060810 100%)';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap');
@keyframes cbm-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes cbm-ring  { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(1.5);opacity:0} }
@keyframes cbm-ring2 { 0%{transform:scale(1);opacity:0.2} 100%{transform:scale(1.8);opacity:0} }
@keyframes cbm-fade-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes cbm-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(220%)} }
@keyframes cbm-draw {
  from { stroke-dashoffset: 80; opacity: 0.3; }
  to   { stroke-dashoffset: 0;  opacity: 1;   }
}
.cbm-root { font-family:'Figtree',system-ui,sans-serif; }
.cbm-btn  { border:none;outline:none;cursor:pointer;transition:opacity .12s,transform .12s; }
.cbm-btn:active { transform:scale(0.96)!important; }
.cbm-action-btn:hover { filter:brightness(1.08); }
`;

function injectCSS() {
  if (!document.getElementById('cbm-css')) {
    const s = document.createElement('style');
    s.id = 'cbm-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}

function buildGoogleCalendarUrl(gymClass, gymName) {
  const title   = encodeURIComponent(`${gymClass.name} — ${gymName || 'Gym'}`);
  const details = encodeURIComponent(
    `Class: ${gymClass.name}\nInstructor: ${gymClass.instructor || 'TBC'}\nDuration: ${gymClass.duration_minutes ? gymClass.duration_minutes + ' min' : 'TBC'}`
  );
  const location = encodeURIComponent(gymName || '');
  let startDate = '', endDate = '';
  if (Array.isArray(gymClass.schedule) && gymClass.schedule[0]) {
    const s       = gymClass.schedule[0];
    const dateStr = s.date || new Date().toISOString().split('T')[0];
    const timeStr = (s.time || '09:00').replace(':', '');
    startDate     = `${dateStr.replace(/-/g, '')}T${timeStr.padStart(4, '0')}00`;
    const dur     = gymClass.duration_minutes || 60;
    const [h, m]  = (s.time || '09:00').split(':').map(Number);
    const total   = h * 60 + m + dur;
    const eh      = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const em      = String(total % 60).padStart(2, '0');
    endDate       = `${dateStr.replace(/-/g, '')}T${eh}${em}00`;
  } else {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    startDate = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}T090000`;
    endDate   = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}T100000`;
  }
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED CHECK MARK — SVG drawn path, no emoji
// ─────────────────────────────────────────────────────────────────────────────
function AnimatedCheck({ size = 72, color = '#34d399', delay = 0.1 }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22, delay }}
      style={{
        width: size, height: size, borderRadius: '50%', position: 'relative',
        background: 'rgba(16,185,129,0.08)',
        border: `1.5px solid rgba(52,211,153,0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {/* Pulsing rings */}
      <div style={{
        position: 'absolute', inset: -3, borderRadius: '50%',
        border: '1px solid rgba(52,211,153,0.35)',
        animation: 'cbm-ring 2.4s cubic-bezier(0.2,0,0.8,1) infinite',
      }} />
      <div style={{
        position: 'absolute', inset: -3, borderRadius: '50%',
        border: '1px solid rgba(52,211,153,0.2)',
        animation: 'cbm-ring2 2.4s cubic-bezier(0.2,0,0.8,1) infinite 0.6s',
      }} />

      {/* SVG check */}
      <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M5 14.5L11.5 21L23 8"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// META ROW — icon + label for class info
// ─────────────────────────────────────────────────────────────────────────────
function MetaItem({ icon: Icon, children }) {
  if (!children) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <Icon style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION BUTTON — unified style
// ─────────────────────────────────────────────────────────────────────────────
function ActionButton({ onClick, href, download, target, rel, primary, active, disabled, icon: Icon, children, style: extraStyle = {} }) {
  const baseStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    width: '100%', padding: '15px', borderRadius: 16, fontSize: 14, fontWeight: 800,
    cursor: disabled ? 'default' : 'pointer',
    letterSpacing: '-0.01em', border: 'none', outline: 'none',
    textDecoration: 'none', transition: 'all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
    position: 'relative', overflow: 'hidden',
    ...extraStyle,
  };

  const primaryStyle = {
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#fff',
    boxShadow: '0 6px 28px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.15)',
    border: '1px solid rgba(96,165,250,0.2)',
  };

  const secondaryStyle = active ? {
    background: 'rgba(251,191,36,0.07)',
    border: '1px solid rgba(251,191,36,0.22)',
    color: '#fbbf24',
  } : {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.42)',
  };

  const combined = { ...baseStyle, ...(primary ? primaryStyle : secondaryStyle) };

  const inner = (
    <>
      {primary && (
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0, width: '45%',
            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',
            animation: 'cbm-shimmer 4s cubic-bezier(0.4,0,0.6,1) infinite 2s',
          }} />
        </div>
      )}
      {Icon && <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </>
  );

  if (href) {
    return <a href={href} download={download} target={target} rel={rel} style={combined} className="cbm-action-btn">{inner}</a>;
  }
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      style={combined}
      className="cbm-action-btn"
    >
      {inner}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — ClassBookedModal
// ─────────────────────────────────────────────────────────────────────────────
export default function ClassBookedModal({ open, onClose, gymClass, gymName }) {
  const [reminderSet,   setReminderSet]   = useState(false);
  const [calendarOpen,  setCalendarOpen]  = useState(false);

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    if (open) {
      setReminderSet(false);
      setCalendarOpen(false);
    }
  }, [open]);

  if (!gymClass || !open) return null;

  // ── Schedule string
  const scheduleInfo = (() => {
    if (Array.isArray(gymClass.schedule) && gymClass.schedule[0]) {
      const s = gymClass.schedule[0];
      const parts = [];
      if (s.day)  parts.push(s.day);
      if (s.time) parts.push(`at ${s.time}`);
      if (s.date) {
        try { parts.push(new Date(s.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })); } catch {}
      }
      return parts.join(' · ');
    }
    return null;
  })();

  const googleUrl = buildGoogleCalendarUrl(gymClass, gymName);
  const icsData   = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${encodeURIComponent(gymClass.name + ' — ' + (gymName || 'Gym'))}%0ADESCRIPTION:${encodeURIComponent('Instructor: ' + (gymClass.instructor || 'TBC'))}%0AEND:VEVENT%0AEND:VCALENDAR`;

  const handleSetReminder = () => {
    setReminderSet(true);
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cbm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="cbm-root"
          style={{
            position: 'fixed', inset: 0, zIndex: 10500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            background: 'rgba(2,4,12,0.88)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          {/* ── Modal card ── */}
          <motion.div
            key="cbm-modal"
            initial={{ scale: 0.88, opacity: 0, y: 28 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.9 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 380, position: 'relative',
              background: SHEET_BG,
              border: '1px solid rgba(52,211,153,0.16)',
              borderRadius: 26, overflow: 'hidden',
              boxShadow: [
                '0 0 0 1px rgba(255,255,255,0.04)',
                '0 32px 80px rgba(0,0,0,0.85)',
                '0 0 48px rgba(52,211,153,0.06)',
              ].join(', '),
            }}
          >
            {/* Top accent line */}
            <div style={{
              height: 2,
              background: 'linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.7) 35%, rgba(56,189,248,0.5) 65%, transparent 100%)',
            }} />

            {/* Subtle radial glow */}
            <div style={{
              position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
              width: 280, height: 200, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.08) 0%, transparent 65%)',
            }} />

            {/* Close button */}
            <motion.button
              className="cbm-btn"
              onClick={onClose}
              whileHover={{ background: 'rgba(255,255,255,0.1)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <X style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.38)' }} />
            </motion.button>

            {/* ── Content ── */}
            <div style={{ padding: '32px 24px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* ── Icon ── */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}
              >
                <AnimatedCheck size={72} delay={0.1} />
              </motion.div>

              {/* ── Status label + heading ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.35 }}
                style={{ textAlign: 'center', marginBottom: 22 }}
              >
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 10, fontWeight: 900, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: '#34d399',
                  background: 'rgba(52,211,153,0.09)',
                  border: '1px solid rgba(52,211,153,0.2)',
                  borderRadius: 20, padding: '4px 12px',
                  marginBottom: 14,
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%', background: '#34d399',
                    animation: 'cbm-pulse 2s ease-in-out infinite',
                  }} />
                  Booking Confirmed
                </div>

                <h2 style={{
                  fontSize: 26, fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.04em', lineHeight: 1.15,
                  margin: 0,
                }}>
                  You&apos;re all set
                </h2>
                <p style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.32)',
                  margin: '8px 0 0', fontWeight: 500, lineHeight: 1.5,
                }}>
                  Your spot has been reserved. A confirmation will be sent shortly.
                </p>
              </motion.div>

              {/* ── Class info card ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.35 }}
                style={{
                  background: CARD_BG,
                  border: CARD_BORDER,
                  borderRadius: 18,
                  padding: '16px 18px',
                  marginBottom: 18,
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Subtle left accent */}
                <div style={{
                  position: 'absolute', left: 0, top: 14, bottom: 14, width: 3,
                  borderRadius: '0 3px 3px 0',
                  background: 'linear-gradient(180deg, #34d399, #38bdf8)',
                }} />

                {/* Class name */}
                <div style={{
                  fontSize: 16, fontWeight: 800, color: '#fff',
                  letterSpacing: '-0.02em', marginBottom: 11, paddingLeft: 12,
                }}>
                  {gymClass.name}
                </div>

                {/* Meta items */}
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 7, paddingLeft: 12,
                }}>
                  {gymClass.instructor && (
                    <MetaItem icon={User}>{gymClass.instructor}</MetaItem>
                  )}
                  {gymClass.duration_minutes && (
                    <MetaItem icon={Clock}>{gymClass.duration_minutes} min</MetaItem>
                  )}
                  {scheduleInfo && (
                    <MetaItem icon={Calendar}>{scheduleInfo}</MetaItem>
                  )}
                  {gymName && (
                    <MetaItem icon={MapPin}>{gymName}</MetaItem>
                  )}
                </div>
              </motion.div>

              {/* ── Actions ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.35 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 9 }}
              >
                {/* Add to Calendar — expands to choice */}
                <AnimatePresence mode="wait">
                  {!calendarOpen ? (
                    <motion.div key="cal-single" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
                      <ActionButton
                        primary
                        icon={Calendar}
                        onClick={() => setCalendarOpen(true)}
                      >
                        Add to Calendar
                      </ActionButton>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cal-split"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ display: 'flex', gap: 8 }}
                    >
                      {[
                        { label: 'Google Calendar', href: googleUrl, target: '_blank', rel: 'noopener noreferrer' },
                        { label: 'Apple / .ics', href: icsData, download: `${(gymClass.name || 'class').replace(/\s+/g, '_')}.ics` },
                      ].map(opt => (
                        <a
                          key={opt.label}
                          href={opt.href}
                          target={opt.target}
                          download={opt.download}
                          rel={opt.rel}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '13px 10px', borderRadius: 14, textDecoration: 'none',
                            background: 'rgba(37,99,235,0.1)',
                            border: '1px solid rgba(59,130,246,0.22)',
                            color: '#60a5fa', fontSize: 12.5, fontWeight: 800,
                            letterSpacing: '-0.01em', transition: 'filter 0.15s',
                          }}
                          className="cbm-action-btn"
                        >
                          <Calendar style={{ width: 13, height: 13 }} />
                          {opt.label}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Set Reminder */}
                <ActionButton
                  icon={Bell}
                  onClick={handleSetReminder}
                  disabled={reminderSet}
                  active={reminderSet}
                  style={reminderSet ? { color: '#fbbf24' } : {}}
                >
                  {reminderSet ? 'Reminder set — 1 hour before' : 'Set a Reminder'}
                </ActionButton>

                {/* Divider */}
                <div style={{
                  height: 1, background: 'rgba(255,255,255,0.05)', margin: '2px 0',
                }} />

                {/* Done */}
                <motion.button
                  className="cbm-btn"
                  onClick={onClose}
                  whileHover={{ color: 'rgba(255,255,255,0.5)' }}
                  style={{
                    width: '100%', padding: '10px',
                    background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.22)',
                    fontSize: 13, fontWeight: 700,
                    letterSpacing: '0.02em', cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  Done
                </motion.button>
              </motion.div>
            </div>

            {/* iOS safe area */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
