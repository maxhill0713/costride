import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, ChevronDown, Clock, CheckCircle, MapPin,
  Users, Share2, Bell, BellOff, ChevronRight, X,
  CalendarPlus, Zap, Star
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

function useCountdown(eventDate) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(eventDate) - new Date();
      if (diff <= 0) return setTimeLeft('Starting now');
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setTimeLeft(`${d}d ${h}h`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else setTimeLeft(`${m}m`);
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [eventDate]);
  return timeLeft;
}

function RangeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = RANGE_OPTIONS.find(o => o.key === value) || RANGE_OPTIONS[0];
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#cbd5e1', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}>
        <span>{current.label}</span>
        <ChevronDown size={11} color="#64748b" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20, background: 'rgba(10,14,30,0.98)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, overflow: 'hidden', minWidth: 110, boxShadow: '0 12px 40px rgba(0,0,0,0.7)', backdropFilter: 'blur(20px)' }}>
            {RANGE_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => { onChange(opt.key); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', padding: '9px 12px', background: opt.key === value ? 'rgba(96,165,250,0.08)' : 'transparent', border: 'none', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
  if (navigator.share) {
    navigator.share({ title: event.title, text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).catch(() => {});
  }
}

function EventCountdown({ eventDate }) {
  const timeLeft = useCountdown(eventDate);
  const isImminent = (() => {
    const diff = new Date(eventDate) - new Date();
    return diff > 0 && diff < 86400000;
  })();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: isImminent ? 'rgba(251,191,36,0.12)' : 'rgba(96,165,250,0.10)', border: `1px solid ${isImminent ? 'rgba(251,191,36,0.28)' : 'rgba(96,165,250,0.2)'}` }}>
      <Zap size={9} color={isImminent ? '#fbbf24' : '#60a5fa'} />
      <span style={{ fontSize: 10, fontWeight: 800, color: isImminent ? '#fbbf24' : '#93c5fd', whiteSpace: 'nowrap' }}>{timeLeft}</span>
    </div>
  );
}

function AttendeeAvatars({ count, attendeeIds = [] }) {
  if (count === 0) return null;
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
  const dots = Math.min(count, 4);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex' }}>
        {[...Array(dots)].map((_, i) => (
          <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: colors[i % colors.length], border: '1.5px solid rgba(6,8,18,0.9)', marginLeft: i > 0 ? -6 : 0, zIndex: dots - i, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>
        {count} attending
      </span>
    </div>
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
          <p style={{ fontSize: 13, color: 'rgba(138,138,148,0.9)', lineHeight: 1.5, margin: '0 0 24px' }}>You can always rejoin later.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px 0', borderRadius: 14, fontSize: 13, fontWeight: 800, color: '#fff', background: 'linear-gradient(to bottom, #2d3748, #1a202c)', border: '1px solid rgba(255,255,255,0.12)', borderBottom: '3px solid rgba(0,0,0,0.5)', cursor: 'pointer' }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '12px 0', borderRadius: 14, fontSize: 13, fontWeight: 800, color: '#fff', background: 'linear-gradient(to bottom, #f87171, #ef4444 40%, #b91c1c)', border: '1px solid transparent', borderBottom: '3px solid #7f1d1d', boxShadow: '0 2px 0 rgba(0,0,0,0.4)', cursor: 'pointer' }}>Leave</button>
          </div>
        </div>
      </div>
    </>
  );
}

function EventDetailSheet({ event, isJoined, remindMe, onClose, onJoin, onLeave, onCalendar, onShare, onToggleRemind }) {
  const formatDate = d => new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (d, e) => {
    const s = new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return e ? `${s} – ${e}` : s;
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(2,4,10,0.88)', backdropFilter: 'blur(14px)' }} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 10011, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '24px 24px 0 0', background: 'linear-gradient(160deg, #0d1232 0%, #060810 100%)', border: '1px solid rgba(255,255,255,0.09)', borderBottom: 'none', boxShadow: '0 -16px 60px rgba(0,0,0,0.7)' }}>

        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.14)' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Hero image */}
          {event.image_url && (
            <div style={{ height: 200, overflow: 'hidden', position: 'relative', margin: '12px 0 0' }}>
              <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(6,8,16,0.95) 100%)' }} />
            </div>
          )}

          <div style={{ padding: '16px 20px 0' }}>
            {/* Title + countdown */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0, flex: 1 }}>{event.title}</h2>
              <EventCountdown eventDate={event.event_date} />
            </div>

            {/* Gym name */}
            {event.gym_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                <MapPin size={12} color="#60a5fa" />
                <span style={{ fontSize: 13, color: '#60a5fa', fontWeight: 600 }}>{event.gym_name}</span>
              </div>
            )}

            {/* Date + time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={16} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{formatDate(event.event_date)}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} />
                  {formatTime(event.event_date, event.end_time)}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 16 }}>{event.description}</p>
            )}

            {/* Attendees */}
            <div style={{ marginBottom: 20 }}>
              <AttendeeAvatars count={event.attendees || 0} />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 36 }}>
              {/* Join / Leave */}
              <button
                onClick={isJoined ? onLeave : onJoin}
                style={{
                  width: '100%', padding: '15px', borderRadius: 18,
                  fontSize: 15, fontWeight: 900, cursor: 'pointer', border: 'none',
                  background: isJoined
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.15))'
                    : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: isJoined ? '#34d399' : '#fff',
                  boxShadow: isJoined
                    ? '0 4px 20px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 6px 28px rgba(37,99,235,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                  outline: isJoined ? '1px solid rgba(52,211,153,0.3)' : 'none',
                }}>
                {isJoined ? '✓ Joined — Tap to Leave' : '🎉 Join This Event'}
              </button>

              {/* Secondary actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button onClick={onCalendar} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700 }}>
                  <CalendarPlus size={16} color="#60a5fa" />
                  Add to Calendar
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

const getStorageKey = (userId) => `joinedEventIds_${userId || 'guest'}`;
const getRemindKey = (userId) => `remindEventIds_${userId || 'guest'}`;

export default function UpcomingEvents({ gymMemberships = [], currentUser, isMember = true }) {
  const [range, setRange] = useState('week');
  const [joinedEventIds, setJoinedEventIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(getStorageKey(currentUser?.id)) || '[]')); } catch { return new Set(); }
  });
  const [remindEventIds, setRemindEventIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(getRemindKey(currentUser?.id)) || '[]')); } catch { return new Set(); }
  });
  const [leaveConfirmEventId, setLeaveConfirmEventId] = useState(null);
  const [openEventId, setOpenEventId] = useState(null);
  const [joinSuccessId, setJoinSuccessId] = useState(null);
  const queryClient = useQueryClient();

  const gymIds = gymMemberships.map(m => m.gym_id);

  useEffect(() => {
    try { localStorage.setItem(getStorageKey(currentUser?.id), JSON.stringify(Array.from(joinedEventIds))); } catch {}
  }, [joinedEventIds, currentUser?.id]);

  useEffect(() => {
    try { localStorage.setItem(getRemindKey(currentUser?.id), JSON.stringify(Array.from(remindEventIds))); } catch {}
  }, [remindEventIds, currentUser?.id]);

  const { data: events = [] } = useQuery({
    queryKey: ['upcomingEvents', gymIds.join(','), range],
    queryFn: async () => {
      if (gymIds.length === 0) return [];
      const now = new Date();
      const days = RANGE_OPTIONS.find(o => o.key === range)?.days || 7;
      const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
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
    onMutate: async ({ eventId }) => { setJoinedEventIds(prev => new Set(prev).add(eventId)); },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
      setJoinSuccessId(eventId);
      setTimeout(() => setJoinSuccessId(null), 2500);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: ({ eventId, currentAttendees }) =>
      base44.entities.Event.update(eventId, {
        attendees: Math.max(0, (currentAttendees || 1) - 1),
        attendee_ids: (events.find(e => e.id === eventId)?.attendee_ids || []).filter(id => id !== currentUser?.id),
      }),
    onMutate: async ({ eventId }) => { setJoinedEventIds(prev => { const n = new Set(prev); n.delete(eventId); return n; }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] }),
  });

  if (gymIds.length === 0) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const formatTime = (dateStr, endTime) => {
    const d = new Date(dateStr);
    const start = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return endTime ? `${start}–${endTime}` : start;
  };

  const leaveEvent = events.find(e => e.id === leaveConfirmEventId);
  const openEvent = events.find(e => e.id === openEventId);

  const handleJoin = (event) => {
    joinMutation.mutate({ eventId: event.id, currentAttendees: event.attendees || 0 });
  };
  const handleLeaveRequest = (event) => {
    setOpenEventId(null);
    setLeaveConfirmEventId(event.id);
  };

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
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>No upcoming events</span>
          </div>
        )}

        {/* Events list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((event, i) => {
            const isJoined = joinedEventIds.has(event.id);
            const isLast = i === events.length - 1;

            const JoinButton = () => (
              <button
                onClick={() => isJoined ? setLeaveConfirmEventId(event.id) : joinMutation.mutate({ eventId: event.id, currentAttendees: event.attendees || 0 })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 10,
                  fontSize: 12, fontWeight: 800,
                  cursor: 'pointer', border: 'none',
                  transition: 'all 0.12s ease', flexShrink: 0,
                  ...(isJoined ? {
                    background: 'rgba(52,211,153,0.12)', color: '#34d399', outline: '1px solid rgba(52,211,153,0.28)',
                  } : {
                    background: 'linear-gradient(to bottom, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
                    color: '#fff', boxShadow: '0 2px 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.2)', borderBottom: '2px solid #1a3fa8',
                  }),
                }}>
                {isJoined ? <><CheckCircle style={{ width: 12, height: 12 }} /> Joined</> : 'Join Event'}
              </button>
            );

            const BottomRow = () => (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  {event.description && (
                    <p style={{ fontSize: 12.5, color: 'rgba(226,232,240,0.6)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {event.description}
                    </p>
                  )}
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>{event.attendees || 0} attending</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.4)' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{formatTime(event.event_date, event.end_time)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => setOpenEventId(event.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <ChevronRight size={13} color="rgba(255,255,255,0.4)" />
                    </button>
                    {isMember && <JoinButton />}
                  </div>
                </div>
              </div>
            );

            return (
              <div key={event.id} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.045)' }}>

                {/* ── WITH BANNER IMAGE ── */}
                {event.image_url && (
                  <>
                    <div style={{ height: 150, overflow: 'hidden', position: 'relative' }}>
                      <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,10,20,0.82) 0%, transparent 55%)' }} />
                      <div style={{ position: 'absolute', top: 12, left: 12, right: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.25, margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                          {formatDate(event.event_date)} - {event.title}
                        </h3>
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px 14px' }}>
                      <BottomRow />
                    </div>
                  </>
                )}

                {/* ── WITHOUT BANNER IMAGE ── */}
                {!event.image_url && (
                  <div style={{ padding: '14px 14px' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, margin: '0 0 8px' }}>
                      {formatDate(event.event_date)} - {event.title}
                    </h3>
                    <BottomRow />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event detail sheet */}
      <AnimatePresence>
        {openEvent && (
          <EventDetailSheet
            event={openEvent}
            isJoined={joinedEventIds.has(openEvent.id)}
            remindMe={remindEventIds.has(openEvent.id)}
            onClose={() => setOpenEventId(null)}
            onJoin={() => { handleJoin(openEvent); setOpenEventId(null); }}
            onLeave={() => handleLeaveRequest(openEvent)}
            onCalendar={() => addToCalendar(openEvent)}
            onShare={() => shareEvent(openEvent)}
            onToggleRemind={() => {
              setRemindEventIds(prev => {
                const n = new Set(prev);
                if (n.has(openEvent.id)) n.delete(openEvent.id);
                else n.add(openEvent.id);
                return n;
              });
            }}
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