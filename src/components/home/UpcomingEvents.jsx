import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronDown, Clock, CheckCircle, MapPin,
  Users, Share2, Bell, BellOff, ChevronRight, X,
  CalendarPlus, Zap, Star, Repeat, AlertCircle
} from 'lucide-react';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

const RANGE_OPTIONS = [
  { key: 'week', label: 'Week', days: 7 },
  { key: 'month', label: 'Month', days: 30 },
  { key: '2months', label: '2 Months', days: 60 },
];

const LEVEL_COLORS = {
  beginner:     { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
  intermediate: { bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
  advanced:     { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)', text: '#f87171' },
  all:          { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', text: '#94a3b8' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function humanRelativeDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.round((d - now) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 6) return `This ${d.toLocaleDateString('en-GB', { weekday: 'long' })}`;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatFullDate(dateStr) {
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'long' });
  const year = d.getFullYear();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st'
    : day === 2 || day === 22 ? 'nd'
    : day === 3 || day === 23 ? 'rd'
    : 'th';
  return `${weekday} ${day}${suffix} ${month} ${year}`;
}

function addToCalendar(event) {
  const start = new Date(event.event_date);
  const end = event.end_time
    ? new Date(`${start.toISOString().split('T')[0]}T${event.end_time}:00`)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.gym_name || '')}`;
  window.open(url, '_blank');
}

function shareEvent(event) {
  const text = `🏋️ ${event.title} — ${new Date(event.event_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  if (navigator.share) navigator.share({ title: event.title, text }).catch(() => {});
  else navigator.clipboard?.writeText(text).catch(() => {});
}

function openMaps(gymName, address) {
  const query = encodeURIComponent(address || gymName || '');
  window.open(`https://maps.google.com/?q=${query}`, '_blank');
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RangeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = RANGE_OPTIONS.find(o => o.key === value) || RANGE_OPTIONS[0];
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#cbd5e1', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
        <span>{current.label}</span>
        <ChevronDown size={11} color="#64748b" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20, background: 'rgba(10,14,30,0.98)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, overflow: 'hidden', minWidth: 110, boxShadow: '0 12px 40px rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>
            {RANGE_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => { onChange(opt.key); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', padding: '9px 12px', background: opt.key === value ? 'rgba(96,165,250,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                <span style={{ fontSize: 12, fontWeight: opt.key === value ? 700 : 500, color: opt.key === value ? '#93c5fd' : '#94a3b8' }}>{opt.label}</span>
                {opt.key === value && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CapacityBar({ capacity, attendees }) {
  if (!capacity) return null;
  const filled = Math.min(attendees || 0, capacity);
  const pct = (filled / capacity) * 100;
  const spotsLeft = capacity - filled;
  const isFull = spotsLeft <= 0;
  const isLow = spotsLeft <= 3 && !isFull;
  const barColor = isFull ? '#ef4444' : isLow ? '#f59e0b' : '#34d399';

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Users size={11} color={barColor} />
          <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>
            {isFull ? 'FULL' : isLow ? `Only ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : `${spotsLeft} spots left`}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{filled}/{capacity}</span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: barColor, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function LevelTag({ level }) {
  if (!level) return null;
  const key = level.toLowerCase();
  const c = LEVEL_COLORS[key] || LEVEL_COLORS.all;
  const label = key === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <span style={{ padding: '2px 8px', borderRadius: 6, background: c.bg, border: `1px solid ${c.border}`, fontSize: 10, fontWeight: 800, color: c.text, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
      {label}
    </span>
  );
}

function PriceTag({ price }) {
  const isFree = !price || price === 0 || price === 'free';
  return (
    <span style={{ padding: '2px 8px', borderRadius: 6, background: isFree ? 'rgba(16,185,129,0.10)' : 'rgba(251,191,36,0.10)', border: `1px solid ${isFree ? 'rgba(16,185,129,0.25)' : 'rgba(251,191,36,0.25)'}`, fontSize: 10, fontWeight: 800, color: isFree ? '#34d399' : '#fbbf24', letterSpacing: '0.03em' }}>
      {isFree ? 'FREE' : typeof price === 'number' ? `£${price}` : price}
    </span>
  );
}

function EquipmentChips({ items = [] }) {
  if (!items.length) return null;
  const icons = { goggles: '🥽', mat: '🧘', gloves: '🥊', towel: '🏳️', shoes: '👟', water: '💧', kit: '👕' };
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Bring</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item, i) => {
          const key = Object.keys(icons).find(k => item.toLowerCase().includes(k));
          return (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
              {key && <span>{icons[key]}</span>}
              {item}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WaitlistButton({ onJoinWaitlist, onLeaveWaitlist, isWaitlisted }) {
  return (
    <button
      onClick={isWaitlisted ? onLeaveWaitlist : onJoinWaitlist}
      style={{
        width: '100%', padding: '14px', borderRadius: 18,
        fontSize: 15, fontWeight: 900, cursor: 'pointer', border: 'none',
        background: isWaitlisted ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(185,28,28,0.1))',
        color: isWaitlisted ? '#f87171' : '#fca5a5',
        outline: `1px solid ${isWaitlisted ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.2)'}`,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <AlertCircle size={16} />
        {isWaitlisted ? 'On Waitlist — Tap to Leave' : 'Event Full — Join Waitlist'}
      </div>
    </button>
  );
}

function LeaveConfirmDialog({ open, onClose, onConfirm, eventName }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10003, background: 'rgba(2,4,10,0.85)', backdropFilter: 'blur(12px)' }} />
      <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 32px)', maxWidth: 340, zIndex: 10004, background: 'linear-gradient(135deg, rgba(16,19,40,0.98) 0%, rgba(6,8,18,1) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, boxShadow: '0 32px 80px rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', overflow: 'hidden' }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Leave <span style={{ color: '#60a5fa' }}>{eventName}</span>?
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(138,138,148,0.9)', lineHeight: 1.5, margin: '0 0 24px' }}>Your spot will be released to others.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 14, fontSize: 13, fontWeight: 800, color: '#fff', background: 'linear-gradient(to bottom, #2d3748, #1a202c)', border: '1px solid rgba(255,255,255,0.12)', borderBottom: '3px solid rgba(0,0,0,0.5)', cursor: 'pointer' }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '12px 0', borderRadius: 14, fontSize: 13, fontWeight: 800, color: '#fff', background: 'linear-gradient(to bottom, #f87171, #ef4444 40%, #b91c1c)', border: '1px solid transparent', borderBottom: '3px solid #7f1d1d', cursor: 'pointer' }}>Leave</button>
          </div>
        </div>
      </div>
    </>
  );
}

// Attendees row in the detail sheet — just avatars + count, no "tap to see"
function DetailAttendeeRow({ event, attendeeProfiles }) {
  const count = event.attendees || attendeeProfiles.length || 0;
  if (count === 0) return null;

  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {attendeeProfiles.slice(0, 5).map((p, i) => {
            const name = p.full_name || p.display_name || 'M';
            return (
              <div key={p.id || i} style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(99,102,241,0.25)', border: '2px solid rgba(6,8,18,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#818cf8', marginLeft: i === 0 ? 0 : -9, zIndex: 5 - i }}>
                {p.avatar_url ? <img src={p.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(name)}
              </div>
            );
          })}
          {attendeeProfiles.length === 0 && count > 0 && (
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '2px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#818cf8' }}>
              {count}
            </div>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
          {count} attending
        </span>
      </div>
    </div>
  );
}

// ─── Event Detail Sheet ──────────────────────────────────────────────────────

function EventDetailSheet({ event, isJoined, isWaitlisted, remindMe, onClose, onJoin, onLeave, onJoinWaitlist, onLeaveWaitlist, onCalendar, onShare, onToggleRemind }) {
  const isFull = event.capacity && (event.attendees || 0) >= event.capacity;
  const equipment = event.equipment || [];
  const [attendeeProfiles, setAttendeeProfiles] = useState([]);

  const attendeeIds = event.attendee_ids || [];

  useEffect(() => {
    if (!attendeeIds.length) return;
    base44.functions.invoke('getUserAvatars', { userIds: attendeeIds })
      .then(res => {
        const avatars = res?.data?.avatars || {};
        setAttendeeProfiles(attendeeIds.map(id => ({ id, ...avatars[id] })));
      })
      .catch(() => {});
  }, [attendeeIds.join(',')]);

  const formatTime = (d, e) => {
    const s = new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return e ? `${s} – ${e}` : s;
  };

  // Green "joined / pressed in" 3D effect — shallower depth, inset shadow
  const pressJoined = e => {
    e.currentTarget.style.transform = 'translateY(2px)';
    e.currentTarget.style.boxShadow = 'inset 0 2px 5px rgba(0,0,0,0.28), inset 0 1px 0 rgba(0,0,0,0.15)';
    e.currentTarget.style.borderBottom = '1px solid #047857';
  };
  const releaseJoined = e => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 0 #047857';
    e.currentTarget.style.borderBottom = '2px solid #047857';
  };

  // Blue "join" standard 3D
  const pressBlue = e => {
    e.currentTarget.style.transform = 'translateY(2px)';
    e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.15)';
    e.currentTarget.style.borderBottom = '2px solid #1a3fa8';
  };
  const releaseBlue = e => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 0 #1a3fa8';
    e.currentTarget.style.borderBottom = '4px solid #1a3fa8';
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(2,4,10,0.88)', backdropFilter: 'blur(14px)' }} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10011, maxHeight: '92vh', display: 'flex', flexDirection: 'column', borderRadius: '24px 24px 0 0', background: 'linear-gradient(160deg, #0d1232 0%, #060810 100%)', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none', boxShadow: '0 -16px 60px rgba(0,0,0,0.7)' }}>

        {/* Drag handle only — no X button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px 0', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Hero image with title overlaid at top */}
          {event.image_url ? (
            <div style={{ height: 220, overflow: 'hidden', position: 'relative', margin: '12px 0 0' }}>
              <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,8,16,0.85) 0%, rgba(6,8,16,0.3) 55%, rgba(6,8,16,0.7) 100%)' }} />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 18px' }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>{event.title}</h2>
              </div>
            </div>
          ) : (
            <div style={{ padding: '16px 20px 0' }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 12px' }}>{event.title}</h2>
            </div>
          )}

          <div style={{ padding: '16px 20px 0' }}>
            {/* Date & time — plain text */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                {formatFullDate(event.event_date)}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} color="rgba(255,255,255,0.4)" />
                {formatTime(event.event_date, event.end_time)}
              </div>
            </div>

            {/* Description — now lives here in the detail sheet */}
            {event.description && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>{event.description}</p>
              </div>
            )}

            {/* Tags row */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              <PriceTag price={event.price} />
              {event.level && <LevelTag level={event.level} />}
              {event.is_recurring && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.25)', fontSize: 10, fontWeight: 800, color: '#a78bfa' }}>
                  <Repeat size={9} /> Recurring
                </span>
              )}
            </div>

            {/* Location */}
            {event.gym_name && (
              <button onClick={() => openMaps(event.gym_name, event.gym_address)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <MapPin size={12} color="#60a5fa" />
                <span style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600, textDecoration: 'underline', textDecorationColor: 'rgba(96,165,250,0.3)', textUnderlineOffset: 3 }}>
                  {event.gym_name}
                </span>
              </button>
            )}

            {/* Capacity bar */}
            <CapacityBar capacity={event.capacity} attendees={event.attendees} />

            {/* Equipment chips */}
            <EquipmentChips items={equipment} />

            {/* Attendees — no "tap to see" */}
            <DetailAttendeeRow event={event} attendeeProfiles={attendeeProfiles} />

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 36 }}>
              {isFull && !isJoined ? (
                <WaitlistButton isWaitlisted={isWaitlisted} onJoinWaitlist={onJoinWaitlist} onLeaveWaitlist={onLeaveWaitlist} />
              ) : (
                <button
                  onClick={isJoined ? onLeave : onJoin}
                  style={{
                    width: '100%', padding: '15px', borderRadius: 18,
                    fontSize: 15, fontWeight: 900, cursor: 'pointer',
                    // Joined = green pressed-in 3D (shallower bottom border, inset top shadow to feel depressed)
                    // Not joined = blue standard raised 3D
                    background: isJoined
                      ? 'linear-gradient(to bottom, #0d9e6e 0%, #059669 55%, #047857 100%)'
                      : 'linear-gradient(to bottom, #4f8ef7 0%, #2563eb 50%, #1d4ed8 100%)',
                    color: '#fff',
                    border: isJoined ? '1px solid #047857' : '1px solid #1d4ed8',
                    borderBottom: isJoined ? '2px solid #047857' : '4px solid #1a3fa8',
                    boxShadow: isJoined
                      ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 0 #047857'
                      : 'inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 0 #1a3fa8',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    transform: 'translateY(0)',
                    transition: 'transform 0.08s, box-shadow 0.08s, border-bottom 0.08s',
                  }}
                  onMouseDown={isJoined ? pressJoined : pressBlue}
                  onMouseUp={isJoined ? releaseJoined : releaseBlue}
                  onMouseLeave={isJoined ? releaseJoined : releaseBlue}
                  onTouchStart={isJoined ? pressJoined : pressBlue}
                  onTouchEnd={isJoined ? releaseJoined : releaseBlue}
                >
                  {isJoined ? '✓ Joined — Tap to Leave' : 'Join This Event'}
                </button>
              )}

              {/* Secondary actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button onClick={onCalendar} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700 }}>
                  <CalendarPlus size={16} color="#60a5fa" />
                  Add to Cal
                </button>
                <button onClick={onShare} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700 }}>
                  <Share2 size={16} color="#a78bfa" />
                  Share
                </button>
                <button onClick={onToggleRemind} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 14, background: remindMe ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${remindMe ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.09)'}`, cursor: 'pointer', color: remindMe ? '#fbbf24' : 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700 }}>
                  {remindMe ? <Bell size={16} color="#fbbf24" /> : <BellOff size={16} color="rgba(255,255,255,0.4)" />}
                  {remindMe ? 'Reminded' : 'Remind Me'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const getStorageKey  = (uid) => `joinedEventIds_${uid || 'guest'}`;
const getRemindKey   = (uid) => `remindEventIds_${uid || 'guest'}`;
const getWaitlistKey = (uid) => `waitlistEventIds_${uid || 'guest'}`;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UpcomingEvents({ gymMemberships = [], currentUser, isMember = true }) {
  const [range, setRange] = useState('week');
  const [joinedEventIds, setJoinedEventIds]   = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(getStorageKey(currentUser?.id))  || '[]')); } catch { return new Set(); } });
  const [remindEventIds, setRemindEventIds]   = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(getRemindKey(currentUser?.id))   || '[]')); } catch { return new Set(); } });
  const [waitlistEventIds, setWaitlistEventIds] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(getWaitlistKey(currentUser?.id)) || '[]')); } catch { return new Set(); } });
  const [leaveConfirmEventId, setLeaveConfirmEventId] = useState(null);
  const [openEventId, setOpenEventId] = useState(null);
  const queryClient = useQueryClient();
  const gymIds = gymMemberships.map(m => m.gym_id);

  useEffect(() => { try { localStorage.setItem(getStorageKey(currentUser?.id),  JSON.stringify([...joinedEventIds])); } catch {} }, [joinedEventIds, currentUser?.id]);
  useEffect(() => { try { localStorage.setItem(getRemindKey(currentUser?.id),   JSON.stringify([...remindEventIds])); } catch {} }, [remindEventIds, currentUser?.id]);
  useEffect(() => { try { localStorage.setItem(getWaitlistKey(currentUser?.id), JSON.stringify([...waitlistEventIds])); } catch {} }, [waitlistEventIds, currentUser?.id]);

  const { data: events = [] } = useQuery({
    queryKey: ['upcomingEvents', gymIds.join(','), range],
    queryFn: async () => {
      if (!gymIds.length) return [];
      const now = new Date();
      const days = RANGE_OPTIONS.find(o => o.key === range)?.days || 7;
      const cutoff = new Date(now.getTime() + days * 86400000);
      const all = [];
      await Promise.all(gymIds.map(async (gymId) => {
        const gymEvents = await base44.entities.Event.filter({ gym_id: gymId }, 'event_date', 20);
        gymEvents.forEach(ev => {
          if (!ev.event_date) return;
          const d = new Date(ev.event_date);
          if (d >= now && d <= cutoff) all.push(ev);
        });
      }));
      return all.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    },
    enabled: gymIds.length > 0,
    staleTime: 2 * 60 * 1000,
    placeholderData: prev => prev,
  });

  const joinMutation = useMutation({
    mutationFn: ({ eventId, currentAttendees }) =>
      base44.entities.Event.update(eventId, {
        attendees: (currentAttendees || 0) + 1,
        attendee_ids: [...(events.find(e => e.id === eventId)?.attendee_ids || []), currentUser?.id].filter(Boolean),
      }),
    onMutate: ({ eventId }) => setJoinedEventIds(prev => new Set(prev).add(eventId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] }),
  });

  const leaveMutation = useMutation({
    mutationFn: ({ eventId, currentAttendees }) =>
      base44.entities.Event.update(eventId, {
        attendees: Math.max(0, (currentAttendees || 1) - 1),
        attendee_ids: (events.find(e => e.id === eventId)?.attendee_ids || []).filter(id => id !== currentUser?.id),
      }),
    onMutate: ({ eventId }) => setJoinedEventIds(prev => { const n = new Set(prev); n.delete(eventId); return n; }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] }),
  });

  if (!gymIds.length) return null;

  const formatTime = (s, e) => { const t = new Date(s).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); return e ? `${t}–${e}` : t; };

  const leaveEvent = events.find(e => e.id === leaveConfirmEventId);
  const openEvent  = events.find(e => e.id === openEventId);

  return (
    <>
      <div style={{ ...CARD_STYLE, borderRadius: 18, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '13px 14px 11px', borderBottom: '1px solid rgba(255,255,255,0.055)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Calendar style={{ width: 15, height: 15, color: '#fff', flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>Upcoming Events</span>
          </div>
          <RangeDropdown value={range} onChange={setRange} />
        </div>

        {/* Empty state */}
        {events.length === 0 && (
          <div style={{ padding: '28px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>No upcoming events in this period</span>
          </div>
        )}

        {/* Events list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((event, i) => {
            const isJoined     = joinedEventIds.has(event.id);
            const isLast       = i === events.length - 1;
            const isFull       = event.capacity && (event.attendees || 0) >= event.capacity;
            const isWaitlisted = waitlistEventIds.has(event.id);
            const spotsLeft    = event.capacity ? event.capacity - (event.attendees || 0) : null;
            const isLowSpots   = spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0;

            // Press handlers for inline join button
            const inlineJoinedDown = e => {
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.boxShadow = 'inset 0 2px 3px rgba(0,0,0,0.25)';
              e.currentTarget.style.borderBottom = '1px solid #047857';
            };
            const inlineJoinedUp = e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 0 #047857';
              e.currentTarget.style.borderBottom = '2px solid #047857';
            };
            const inlineBlueDown = e => {
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderBottom = '1px solid #1a3fa8';
            };
            const inlineBlueUp = e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 2px 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.2)';
              e.currentTarget.style.borderBottom = '2px solid #1a3fa8';
            };

            const InlineJoinButton = () => {
              if (isFull && !isJoined) return (
                <button
                  onClick={() => setWaitlistEventIds(prev => { const n = new Set(prev); isWaitlisted ? n.delete(event.id) : n.add(event.id); return n; })}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none', background: isWaitlisted ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', color: isWaitlisted ? '#f87171' : '#fca5a5', outline: '1px solid rgba(239,68,68,0.25)', flexShrink: 0 }}>
                  {isWaitlisted ? '⏳ Waitlisted' : '+ Waitlist'}
                </button>
              );
              return (
                <button
                  onClick={() => isJoined
                    ? setLeaveConfirmEventId(event.id)
                    : joinMutation.mutate({ eventId: event.id, currentAttendees: event.attendees || 0 })}
                  onMouseDown={isJoined ? inlineJoinedDown : inlineBlueDown}
                  onMouseUp={isJoined ? inlineJoinedUp : inlineBlueUp}
                  onMouseLeave={isJoined ? inlineJoinedUp : inlineBlueUp}
                  onTouchStart={isJoined ? inlineJoinedDown : inlineBlueDown}
                  onTouchEnd={isJoined ? inlineJoinedUp : inlineBlueUp}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px', borderRadius: 10,
                    fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                    flexShrink: 0,
                    transition: 'transform 0.08s, box-shadow 0.08s, border-bottom 0.08s',
                    // Joined = green pressed-in (shallow bottom border, inset shadow)
                    // Not joined = blue raised 3D
                    ...(isJoined
                      ? {
                          background: 'linear-gradient(to bottom, #0d9e6e 0%, #059669 60%, #047857 100%)',
                          color: '#fff',
                          borderBottom: '2px solid #047857',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 0 #047857',
                          textShadow: '0 1px 1px rgba(0,0,0,0.2)',
                        }
                      : {
                          background: 'linear-gradient(to bottom, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
                          color: '#fff',
                          boxShadow: '0 2px 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.2)',
                          borderBottom: '2px solid #1a3fa8',
                        }),
                  }}>
                  {isJoined ? <><CheckCircle style={{ width: 12, height: 12 }} /> Joined</> : 'Join'}
                </button>
              );
            };

            // BottomRow: left side = time + attending count (stacked), right = join button only
            // Description removed from card (lives in detail sheet now)
            const BottomRow = () => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                {/* Left: time, attending, urgency/level tag */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{formatTime(event.event_date, event.end_time)}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, whiteSpace: 'nowrap' }}>{event.attendees || 0} attending</span>
                  {isLowSpots && (
                    <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>⚡ {spotsLeft} spot{spotsLeft === 1 ? '' : 's'} left</span>
                  )}
                  {!isLowSpots && event.level && <LevelTag level={event.level} />}
                </div>

                {/* Right: join button only */}
                <div style={{ flexShrink: 0 }}>
                  {isMember && <InlineJoinButton />}
                </div>
              </div>
            );

            return (
              <div key={event.id} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.045)' }}>
                {event.image_url ? (
                  <>
                    {/* Clickable image area */}
                    <div
                      onClick={() => setOpenEventId(event.id)}
                      style={{ height: 150, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                    >
                      <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,10,20,0.82) 0%, transparent 55%)' }} />
                      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.25, margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.6)', flex: 1 }}>
                          {humanRelativeDate(event.event_date)} · {event.title}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
                          {event.is_recurring && <Repeat size={13} color="rgba(167,139,250,0.9)" />}
                          <ChevronRight size={15} color="rgba(255,255,255,0.55)" />
                        </div>
                      </div>
                    </div>
                    {/* Slightly tighter top padding to close gap under image */}
                    <div style={{ padding: '8px 14px 12px' }}><BottomRow /></div>
                  </>
                ) : (
                  <div style={{ padding: '14px 14px' }}>
                    <div
                      onClick={() => setOpenEventId(event.id)}
                      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 8, cursor: 'pointer' }}
                    >
                      <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, margin: 0, flex: 1 }}>
                        {humanRelativeDate(event.event_date)} · {event.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
                        {event.is_recurring && <Repeat size={12} color="rgba(167,139,250,0.7)" />}
                        <ChevronRight size={14} color="rgba(255,255,255,0.45)" />
                      </div>
                    </div>
                    <BottomRow />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail sheet */}
      <AnimatePresence>
        {openEvent && (
          <EventDetailSheet
            event={openEvent}
            isJoined={joinedEventIds.has(openEvent.id)}
            isWaitlisted={waitlistEventIds.has(openEvent.id)}
            remindMe={remindEventIds.has(openEvent.id)}
            onClose={() => setOpenEventId(null)}
            onJoin={() => { joinMutation.mutate({ eventId: openEvent.id, currentAttendees: openEvent.attendees || 0 }); setOpenEventId(null); }}
            onLeave={() => { setOpenEventId(null); setLeaveConfirmEventId(openEvent.id); }}
            onJoinWaitlist={() => setWaitlistEventIds(prev => new Set(prev).add(openEvent.id))}
            onLeaveWaitlist={() => setWaitlistEventIds(prev => { const n = new Set(prev); n.delete(openEvent.id); return n; })}
            onCalendar={() => addToCalendar(openEvent)}
            onShare={() => shareEvent(openEvent)}
            onToggleRemind={() => setRemindEventIds(prev => { const n = new Set(prev); n.has(openEvent.id) ? n.delete(openEvent.id) : n.add(openEvent.id); return n; })}
          />
        )}
      </AnimatePresence>

      <LeaveConfirmDialog
        open={!!leaveConfirmEventId}
        onClose={() => setLeaveConfirmEventId(null)}
        onConfirm={() => {
          if (leaveEvent) leaveMutation.mutate({ eventId: leaveEvent.id, currentAttendees: leaveEvent.attendees || 0 });
          setLeaveConfirmEventId(null);
        }}
        eventName={leaveEvent?.title}
      />
    </>
  );
}