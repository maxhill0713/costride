import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, ChevronDown, Clock, CheckCircle } from 'lucide-react';

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

function RangeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = RANGE_OPTIONS.find(o => o.key === value) || RANGE_OPTIONS[0];

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 9px', borderRadius: 8,
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: '#cbd5e1', fontSize: 11, fontWeight: 600,
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          transition: 'background 0.15s',
        }}>
        <span>{current.label}</span>
        <ChevronDown size={11} color="#64748b"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
            background: 'rgba(10,14,30,0.98)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 10, overflow: 'hidden', minWidth: 110,
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
          }}>
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  width: '100%', padding: '9px 12px',
                  background: opt.key === value ? 'rgba(96,165,250,0.08)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <span style={{ fontSize: 12, fontWeight: opt.key === value ? 700 : 500, color: opt.key === value ? '#93c5fd' : '#94a3b8' }}>
                  {opt.label}
                </span>
                {opt.key === value && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LeaveConfirmDialog({ open, onClose, onConfirm, eventName, eventDate }) {
  if (!open) return null;
  
  const formatEventDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-GB', { month: 'long' });
    return `${day}th of ${month}`;
  };
  
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10003,
          background: 'rgba(2,4,10,0.85)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        }}
      />
      <div style={{
        position: 'fixed', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 32px)', maxWidth: 340,
        zIndex: 10004,
        background: 'linear-gradient(135deg, rgba(16,19,40,0.98) 0%, rgba(6,8,18,1) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 24,
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Are you sure you want to leave <span style={{ color: '#60a5fa' }}>{eventName}</span> on the {formatEventDate(eventDate)}?
          </h3>
          <p style={{ fontSize: 13, color: 'rgba(138,138,148,0.9)', lineHeight: 1.5, margin: '0 0 24px' }}>
            You can always join again later.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 14,
                fontSize: 13, fontWeight: 800, color: '#fff',
                background: 'linear-gradient(to bottom, #2d3748, #1a202c)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderBottom: '3px solid rgba(0,0,0,0.5)',
                boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'transform 0.08s ease',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
              onTouchStart={e => { e.currentTarget.style.transform = 'translateY(3px)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 14,
                fontSize: 13, fontWeight: 800, color: '#fff',
                background: 'linear-gradient(to bottom, #f87171, #ef4444 40%, #b91c1c)',
                border: '1px solid transparent',
                borderBottom: '3px solid #7f1d1d',
                boxShadow: '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 16px rgba(200,0,0,0.3)',
                cursor: 'pointer',
                transition: 'transform 0.08s ease',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              onTouchStart={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const getStorageKey = (userId) => `joinedEventIds_${userId || 'guest'}`;

export default function UpcomingEvents({ gymMemberships = [], currentUser }) {
  const [range, setRange] = useState('week');
  const [joinedEventIds, setJoinedEventIds] = useState(() => {
    try {
      const key = getStorageKey(currentUser?.id);
      const stored = localStorage.getItem(key);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });
  const [leaveConfirmEventId, setLeaveConfirmEventId] = useState(null);
  const queryClient = useQueryClient();

  const gymIds = gymMemberships.map(m => m.gym_id);

  // Persist joined IDs to localStorage whenever they change
  useEffect(() => {
    try {
      const key = getStorageKey(currentUser?.id);
      localStorage.setItem(key, JSON.stringify(Array.from(joinedEventIds)));
    } catch {}
  }, [joinedEventIds, currentUser?.id]);

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
      base44.entities.Event.update(eventId, { attendees: (currentAttendees || 0) + 1 }),
    onMutate: async ({ eventId }) => {
      setJoinedEventIds(prev => new Set(prev).add(eventId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: ({ eventId, currentAttendees }) =>
      base44.entities.Event.update(eventId, { attendees: Math.max(0, (currentAttendees || 1) - 1) }),
    onMutate: async ({ eventId }) => {
      setJoinedEventIds(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upcomingEvents'] });
    },
  });

  if (gymIds.length === 0 || events.length === 0) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysUntil = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  const leaveEvent = events.find(e => e.id === leaveConfirmEventId);

  return (
    <>
      <div style={{ ...CARD_STYLE, borderRadius: 18, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '13px 14px 11px',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
            Upcoming Events
          </span>
          <RangeDropdown value={range} onChange={setRange} />
        </div>

        {/* Events list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((event, i) => {
            const isJoined = joinedEventIds.has(event.id);
            const isLast = i === events.length - 1;
            return (
              <div
                key={event.id}
                style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.045)' }}>
                {/* Banner image */}
                {event.image_url && (
                  <div style={{ height: 130, overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={event.image_url}
                      alt={event.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, transparent 40%, rgba(8,10,20,0.85) 100%)',
                    }} />
                    <div style={{
                      position: 'absolute', top: 10, left: 12,
                      fontSize: 13, fontWeight: 700, color: '#fff',
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    }}>
                      {formatDate(event.event_date)}
                    </div>
                  </div>
                )}

                <div style={{ padding: '12px 14px 14px' }}>
                  {/* Date row (if no image) */}
                  {!event.image_url && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {formatDate(event.event_date)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                        <Clock style={{ width: 10, height: 10 }} />
                        {formatTime(event.event_date)}
                      </div>
                      <span style={{
                        marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                        color: '#60a5fa', background: 'rgba(96,165,250,0.08)',
                        border: '1px solid rgba(96,165,250,0.18)',
                        borderRadius: 6, padding: '2px 7px',
                      }}>
                        {getDaysUntil(event.event_date)}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.3, margin: 0, flex: 1 }}>
                      {event.title}
                    </h3>
                    {event.image_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <Clock style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.5)' }} />
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                          {formatTime(event.event_date)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p style={{
                      fontSize: 12.5, color: 'rgba(226,232,240,0.6)',
                      lineHeight: 1.5, margin: '0 0 10px',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {event.description}
                    </p>
                  )}

                  {/* Attendees + Join/Leave button row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: event.description ? 0 : 8 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                      {event.attendees || 0} attending
                    </span>
                    <button
                      onClick={() => {
                        if (isJoined) {
                          setLeaveConfirmEventId(event.id);
                        } else {
                          joinMutation.mutate({ eventId: event.id, currentAttendees: event.attendees || 0 });
                        }
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 10,
                        fontSize: 12, fontWeight: 800,
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'all 0.12s ease',
                        flexShrink: 0,
                        ...(isJoined ? {
                          background: 'rgba(52,211,153,0.12)',
                          color: '#34d399',
                          outline: '1px solid rgba(52,211,153,0.28)',
                        } : {
                          background: 'linear-gradient(to bottom, #3b82f6 0%, #2563eb 40%, #1d4ed8 100%)',
                          color: '#fff',
                          boxShadow: '0 2px 0 #1a3fa8, 0 4px 14px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                          borderBottom: '2px solid #1a3fa8',
                        }),
                      }}
                      onMouseDown={e => {
                        if (!isJoined) {
                          e.currentTarget.style.transform = 'translateY(2px)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                      onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                      onTouchStart={e => {
                        if (!isJoined) {
                          e.currentTarget.style.transform = 'translateY(2px)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                      onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                    >
                      {isJoined ? (
                        <>
                          <CheckCircle style={{ width: 12, height: 12 }} />
                          Joined
                        </>
                      ) : 'Join Event'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LeaveConfirmDialog
        open={!!leaveConfirmEventId}
        onClose={() => setLeaveConfirmEventId(null)}
        onConfirm={() => {
          if (leaveEvent) {
            leaveMutation.mutate({ eventId: leaveEvent.id, currentAttendees: leaveEvent.attendees || 0 });
          }
          setLeaveConfirmEventId(null);
        }}
        eventName={leaveEvent?.title}
        eventDate={leaveEvent?.event_date}
      />
    </>
  );
}