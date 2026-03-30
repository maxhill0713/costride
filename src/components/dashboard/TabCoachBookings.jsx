import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, startOfDay, isToday, isTomorrow } from 'date-fns';
import {
  Calendar, Clock, User, Check, X, AlertCircle,
  ChevronLeft, ChevronRight, Search, MoreHorizontal,
} from 'lucide-react';

const D = {
  bg: '#080e18', surface: '#0c1422', border: 'rgba(255,255,255,0.07)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569',
  green: '#10b981', amber: '#f59e0b', red: '#ef4444', blue: '#38bdf8',
};

function BookingCard({ booking, onConfirm, onCancel }) {
  const [showMenu, setShowMenu] = useState(false);
  const statusColor = booking.status === 'confirmed' || booking.status === 'attended'
    ? D.green : booking.status === 'cancelled' || booking.status === 'no_show' ? D.red : D.amber;
  const statusLabel = booking.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  const sessionDate = booking.session_date ? new Date(booking.session_date) : null;
  const timeStr = sessionDate ? format(sessionDate, 'HH:mm') : '—';
  const dateStr = !sessionDate ? '—' : isToday(sessionDate) ? 'Today' : isTomorrow(sessionDate) ? 'Tomorrow' : format(sessionDate, 'MMM d');

  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: D.surface, border: `1px solid ${D.border}`, borderLeft: `3px solid ${statusColor}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: D.t1 }}>{booking.client_name || 'Member'}</div>
          <div style={{ fontSize: 11, color: D.t3, marginTop: 2 }}>{booking.session_name || 'Session'}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg, border: `1px solid ${D.border}`, borderRadius: 7, cursor: 'pointer' }}>
            <MoreHorizontal style={{ width: 12, height: 12, color: D.t3 }} />
          </button>
          {showMenu && (
            <>
              <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{ position: 'absolute', top: 30, right: 0, zIndex: 100, background: '#1a1f36', border: `1px solid ${D.border}`, borderRadius: 9, minWidth: 140, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                {booking.status === 'confirmed' && (
                  <button onClick={() => { onConfirm(booking); setShowMenu(false); }} style={{ width: '100%', padding: '9px 14px', fontSize: 11, fontWeight: 600, color: D.green, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✓ Mark Attended
                  </button>
                )}
                {booking.status !== 'cancelled' && booking.status !== 'no_show' && (
                  <button onClick={() => { onCancel(booking); setShowMenu(false); }} style={{ width: '100%', padding: '9px 14px', fontSize: 11, fontWeight: 600, color: D.red, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✕ Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: D.t2 }}>
          <Calendar style={{ width: 11, height: 11 }} /> {dateStr} {timeStr !== '—' ? `at ${timeStr}` : ''}
        </div>
        {booking.notes && (
          <div style={{ fontSize: 10, color: D.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📝 {booking.notes}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}25`, borderRadius: 5, padding: '1px 8px' }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

export default function TabCoachBookings({ coach, gymId, now = new Date() }) {
  const [currentDate, setCurrentDate] = useState(now);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const weekStart = startOfDay(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['coachBookingsTab', gymId, coach?.id],
    queryFn: () => {
      const filter = { gym_id: gymId };
      if (coach?.id) filter.coach_id = coach.id;
      return base44.entities.Booking.filter(filter, '-session_date', 300);
    },
    enabled: !!gymId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coachBookingsTab'] }),
  });

  const handleConfirm = (booking) => updateMutation.mutate({ id: booking.id, status: 'attended' });
  const handleCancel = (booking) => updateMutation.mutate({ id: booking.id, status: 'cancelled' });

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = selectedStatus === 'all' || b.status === selectedStatus;
      const matchSearch = !searchQuery || (b.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (b.session_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    }).sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
  }, [bookings, selectedStatus, searchQuery]);

  const bookingsByDay = useMemo(() => {
    const grouped = {};
    weekDays.forEach(day => {
      grouped[format(day, 'yyyy-MM-dd')] = filteredBookings.filter(b =>
        b.session_date && format(new Date(b.session_date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
    });
    return grouped;
  }, [weekDays, filteredBookings]);

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingCount   = bookings.filter(b => b.status === 'confirmed' || b.status === 'no_show').length;

  // Upcoming = future bookings sorted ascending
  const upcoming = useMemo(() => filteredBookings.filter(b => {
    if (!b.session_date) return false;
    return new Date(b.session_date) >= new Date(now.toDateString());
  }), [filteredBookings, now]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: D.t1, margin: 0 }}>My Bookings</h2>
          {confirmedCount > 0 && (
            <span style={{ fontSize: 13, fontWeight: 800, color: D.green, background: `${D.green}12`, border: `1px solid ${D.green}25`, borderRadius: 99, padding: '2px 10px' }}>
              {confirmedCount} confirmed
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 9, cursor: 'pointer', color: D.t3 }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: D.t2, minWidth: 80, textAlign: 'center' }}>
            Week of {format(weekStart, 'd MMM')}
          </span>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 9, cursor: 'pointer', color: D.t3 }}>
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'Total',     value: bookings.length,                                              color: D.blue  },
          { label: 'Confirmed', value: confirmedCount,                                               color: D.green },
          { label: 'Attended',  value: bookings.filter(b => b.status === 'attended').length,         color: D.green },
          { label: 'No-show',   value: bookings.filter(b => b.status === 'no_show').length,          color: D.red   },
        ].map((s, i) => (
          <div key={i} style={{ borderRadius: 12, padding: '14px 16px', background: D.surface, border: `1px solid ${D.border}` }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginBottom: 4, letterSpacing: '-0.04em' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: D.t3, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: D.t3 }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search bookings..."
            style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 9, background: D.surface, border: `1px solid ${D.border}`, color: D.t1, fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'confirmed', 'attended', 'cancelled', 'no_show'].map(status => (
            <button key={status} onClick={() => setSelectedStatus(status)}
              style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: selectedStatus === status ? 700 : 500, background: selectedStatus === status ? 'rgba(167,139,250,0.12)' : D.surface, border: `1px solid ${selectedStatus === status ? 'rgba(167,139,250,0.35)' : D.border}`, color: selectedStatus === status ? '#a78bfa' : D.t3, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Week View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {weekDays.map((day, idx) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDay[dayKey] || [];
          const isCurrentDay = isToday(day);
          return (
            <div key={idx} style={{ padding: '12px 10px', borderRadius: 12, background: isCurrentDay ? '#0d1a2e' : D.surface, border: `1px solid ${isCurrentDay ? '#a78bfa30' : D.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isCurrentDay ? '#a78bfa' : D.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, textAlign: 'center' }}>
                {format(day, 'EEE')} {format(day, 'd')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dayBookings.length === 0 ? (
                  <div style={{ fontSize: 10, color: D.t3, textAlign: 'center', padding: '12px 0' }}>—</div>
                ) : dayBookings.map(b => {
                  const color = b.status === 'confirmed' || b.status === 'attended' ? D.green : b.status === 'cancelled' || b.status === 'no_show' ? D.red : D.amber;
                  return (
                    <div key={b.id} style={{ padding: '5px 7px', borderRadius: 7, background: `${color}12`, border: `1px solid ${color}25` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: D.t1 }}>
                        {b.session_date ? format(new Date(b.session_date), 'HH:mm') : '—'}
                      </div>
                      <div style={{ fontSize: 8, color: D.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.client_name || 'Member'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking list */}
      <div style={{ padding: '16px 18px', borderRadius: 14, background: D.surface, border: `1px solid ${D.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: D.t1, marginBottom: 14 }}>
          {selectedStatus === 'all' ? 'All Bookings' : selectedStatus.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
        </div>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: D.t3, fontSize: 12 }}>Loading bookings…</div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: D.t3 }}>
            <AlertCircle style={{ width: 24, height: 24, margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No bookings found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredBookings.slice(0, 10).map(b => (
              <BookingCard key={b.id} booking={b} onConfirm={handleConfirm} onCancel={handleCancel} />
            ))}
            {filteredBookings.length > 10 && (
              <div style={{ textAlign: 'center', fontSize: 11, color: D.t3, paddingTop: 8 }}>
                +{filteredBookings.length - 10} more bookings
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}