import React, { useState, useMemo } from 'react';
import { format, addDays, startOfDay, isToday, isTomorrow, parse } from 'date-fns';
import {
  Calendar, Clock, User, Phone, Mail, MapPin, Check, X, Edit2, AlertCircle,
  ChevronLeft, ChevronRight, Search, Filter, MoreHorizontal, Zap, Loader2,
} from 'lucide-react';

const D = {
  bg: '#080e18', surface: '#0c1422', border: 'rgba(255,255,255,0.07)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569',
  green: '#10b981', amber: '#f59e0b', red: '#ef4444', blue: '#38bdf8',
};

// Demo bookings data structure
const DEMO_BOOKINGS = [
  {
    id: 'b1', clientName: 'Alex Johnson', clientEmail: 'alex@email.com', clientPhone: '+44 7911 123456',
    service: 'Personal Training Session', date: new Date(2026, 2, 27, 10, 0), duration: 60,
    status: 'confirmed', price: 75, notes: 'Focus on lower body strength',
  },
  {
    id: 'b2', clientName: 'Sarah Williams', clientEmail: 'sarah@email.com', clientPhone: '+44 7922 234567',
    service: '1-on-1 Coaching', date: new Date(2026, 2, 27, 11, 30), duration: 45,
    status: 'pending', price: 60, notes: '',
  },
  {
    id: 'b3', clientName: 'Mike Chen', clientEmail: 'mike@email.com', clientPhone: '+44 7933 345678',
    service: 'Group Class', date: new Date(2026, 2, 27, 14, 0), duration: 60,
    status: 'confirmed', price: 35, notes: 'HIIT class - 12 participants',
  },
  {
    id: 'b4', clientName: 'Emma Davis', clientEmail: 'emma@email.com', clientPhone: '+44 7944 456789',
    service: 'Personal Training Session', date: new Date(2026, 2, 28, 9, 0), duration: 60,
    status: 'confirmed', price: 75, notes: '',
  },
  {
    id: 'b5', clientName: 'James Wilson', clientEmail: 'james@email.com', clientPhone: '+44 7955 567890',
    service: 'Nutrition Consultation', date: new Date(2026, 2, 28, 15, 30), duration: 30,
    status: 'cancelled', price: 45, notes: 'Rescheduled to April 2',
  },
  {
    id: 'b6', clientName: 'Olivia Brown', clientEmail: 'olivia@email.com', clientPhone: '+44 7966 678901',
    service: 'Personal Training Session', date: new Date(2026, 2, 29, 11, 0), duration: 60,
    status: 'pending', price: 75, notes: 'New client - intro session',
  },
];

// Booking card component
function BookingCard({ booking, onConfirm, onReschedule, onCancel, isUpcoming }) {
  const [showMenu, setShowMenu] = useState(false);
  const statusColor = booking.status === 'confirmed' ? D.green : booking.status === 'pending' ? D.amber : D.red;
  const statusLabel = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
  const timeStr = format(booking.date, 'HH:mm');
  const dateStr = isToday(booking.date) ? 'Today' : isTomorrow(booking.date) ? 'Tomorrow' : format(booking.date, 'MMM d');

  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, background: D.surface, border: `1px solid ${D.border}`, borderLeft: `3px solid ${statusColor}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: D.t1 }}>{booking.clientName}</div>
          <div style={{ fontSize: 11, color: D.t3, marginTop: 2 }}>{booking.service}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: D.bg, border: `1px solid ${D.border}`, borderRadius: 7, cursor: 'pointer' }}>
            <MoreHorizontal style={{ width: 12, height: 12, color: D.t3 }} />
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', top: 30, right: 0, zIndex: 999, background: '#1a1f36', border: `1px solid ${D.border}`, borderRadius: 9, minWidth: 140, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              {booking.status === 'pending' && (
                <button onClick={() => { onConfirm(booking); setShowMenu(false); }} style={{ width: '100%', padding: '9px 14px', fontSize: 11, fontWeight: 600, color: D.green, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  ✓ Confirm
                </button>
              )}
              {booking.status !== 'cancelled' && (
                <>
                  <button onClick={() => { onReschedule(booking); setShowMenu(false); }} style={{ width: '100%', padding: '9px 14px', fontSize: 11, fontWeight: 600, color: D.blue, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                    📅 Reschedule
                  </button>
                  <button onClick={() => { onCancel(booking); setShowMenu(false); }} style={{ width: '100%', padding: '9px 14px', fontSize: 11, fontWeight: 600, color: D.red, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                    ✕ Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: D.t2 }}>
          <Calendar style={{ width: 11, height: 11 }} /> {dateStr} at {timeStr}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: D.t2 }}>
          <Clock style={{ width: 11, height: 11 }} /> {booking.duration} min
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}25`, borderRadius: 5, padding: '1px 8px' }}>
          {statusLabel}
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: D.t1 }}>£{booking.price}</span>
      </div>

      {booking.notes && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: D.bg, fontSize: 10, color: D.t3, borderLeft: `2px solid ${D.blue}` }}>
          📝 {booking.notes}
        </div>
      )}
    </div>
  );
}

// Booking detail modal
function BookingDetailModal({ booking, onClose, onConfirm, onReschedule, onCancel }) {
  if (!booking) return null;

  const statusColor = booking.status === 'confirmed' ? D.green : booking.status === 'pending' ? D.amber : D.red;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, borderRadius: 20, background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: D.t1 }}>{booking.clientName}</div>
            <div style={{ fontSize: 11, color: D.t3, marginTop: 2 }}>{booking.service}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: D.t3, cursor: 'pointer' }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: `${statusColor}0d`, border: `1px solid ${statusColor}20` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>
              {booking.status === 'confirmed' ? '✓ Confirmed' : booking.status === 'pending' ? '⏳ Pending' : '✕ Cancelled'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: D.t1 }}>£{booking.price}</span>
          </div>

          {/* Date & Time */}
          <div style={{ padding: '10px 12px', borderRadius: 10, background: D.bg, border: `1px solid ${D.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: D.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>📅 Date & Time</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{format(booking.date, 'EEEE, d MMMM yyyy')}</div>
            <div style={{ fontSize: 11, color: D.t2, marginTop: 3 }}>
              {format(booking.date, 'HH:mm')} - {format(new Date(booking.date.getTime() + booking.duration * 60000), 'HH:mm')} ({booking.duration} minutes)
            </div>
          </div>

          {/* Client Info */}
          <div style={{ padding: '10px 12px', borderRadius: 10, background: D.bg, border: `1px solid ${D.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: D.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>👤 Client Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Mail style={{ width: 12, height: 12, color: D.t3 }} />
                <a href={`mailto:${booking.clientEmail}`} style={{ fontSize: 11, color: D.blue, textDecoration: 'none' }}>{booking.clientEmail}</a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Phone style={{ width: 12, height: 12, color: D.t3 }} />
                <a href={`tel:${booking.clientPhone}`} style={{ fontSize: 11, color: D.blue, textDecoration: 'none' }}>{booking.clientPhone}</a>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: D.bg, border: `1px solid ${D.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: D.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>📝 Notes</div>
              <div style={{ fontSize: 11, color: D.t2 }}>{booking.notes}</div>
            </div>
          )}

          {/* Actions */}
          {booking.status !== 'cancelled' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 8, borderTop: `1px solid ${D.border}` }}>
              {booking.status === 'pending' && (
                <button onClick={() => { onConfirm(booking); onClose(); }} style={{ padding: '10px', borderRadius: 10, background: `${D.green}18`, border: `1px solid ${D.green}35`, color: D.green, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                  ✓ Confirm
                </button>
              )}
              <button onClick={() => { onReschedule(booking); onClose(); }} style={{ padding: '10px', borderRadius: 10, background: `${D.blue}18`, border: `1px solid ${D.blue}35`, color: D.blue, fontSize: 11, fontWeight: 800, cursor: 'pointer', gridColumn: booking.status === 'pending' ? '2' : '1' }}>
                📅 Reschedule
              </button>
              <button onClick={() => { onCancel(booking); onClose(); }} style={{ padding: '10px', borderRadius: 10, background: `${D.red}18`, border: `1px solid ${D.red}35`, color: D.red, fontSize: 11, fontWeight: 800, cursor: 'pointer', gridColumn: booking.status === 'pending' ? 'unset' : '2' }}>
                ✕ Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main component
export default function TabCoachBookings() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Determine view: 7-day week view
  const weekStart = startOfDay(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return DEMO_BOOKINGS.filter(b => {
      const statusMatch = selectedStatus === 'all' || b.status === selectedStatus;
      const searchMatch = !searchQuery || b.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [selectedStatus, searchQuery]);

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const grouped = {};
    weekDays.forEach(day => {
      grouped[format(day, 'yyyy-MM-dd')] = filteredBookings.filter(b => 
        format(b.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
    });
    return grouped;
  }, [weekDays, filteredBookings]);

  const handleConfirm = (booking) => alert(`Confirmed booking for ${booking.clientName}`);
  const handleReschedule = (booking) => alert(`Reschedule booking for ${booking.clientName}`);
  const handleCancel = (booking) => alert(`Cancelled booking for ${booking.clientName}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} onConfirm={handleConfirm} onReschedule={handleReschedule} onCancel={handleCancel} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: D.t1, margin: 0 }}>My Bookings</h2>
          <span style={{ fontSize: 13, fontWeight: 800, color: D.green, background: `${D.green}12`, border: `1px solid ${D.green}25`, borderRadius: 99, padding: '2px 10px' }}>
            {DEMO_BOOKINGS.filter(b => b.status === 'confirmed').length} confirmed
          </span>
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

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: D.t3 }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search bookings..." style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 9, background: D.surface, border: `1px solid ${D.border}`, color: D.t1, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'confirmed', 'pending', 'cancelled'].map(status => (
            <button key={status} onClick={() => setSelectedStatus(status)} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 11, fontWeight: selectedStatus === status ? 700 : 500, background: selectedStatus === status ? 'rgba(167,139,250,0.12)' : D.surface, border: `1px solid ${selectedStatus === status ? 'rgba(167,139,250,0.35)' : D.border}`, color: selectedStatus === status ? '#a78bfa' : D.t3, cursor: 'pointer' }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Week View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {weekDays.map((day, idx) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayBookings = bookingsByDay[dayKey];
          const isCurrentDay = isToday(day);

          return (
            <div key={idx} style={{ padding: '12px 10px', borderRadius: 12, background: isCurrentDay ? '#0d1a2e' : D.surface, border: `1px solid ${isCurrentDay ? '#a78bfa30' : D.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: isCurrentDay ? '#a78bfa' : D.t3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, textAlign: 'center' }}>
                {format(day, 'EEE')} {format(day, 'd')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dayBookings.length === 0 ? (
                  <div style={{ fontSize: 10, color: D.t3, textAlign: 'center', padding: '12px 0' }}>—</div>
                ) : dayBookings.map(b => (
                  <button key={b.id} onClick={() => setSelectedBooking(b)} style={{ padding: '6px 8px', borderRadius: 7, background: b.status === 'confirmed' ? `${D.green}12` : `${D.amber}12`, border: `1px solid ${b.status === 'confirmed' ? `${D.green}25` : `${D.amber}25`}`, cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: D.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {format(b.date, 'HH:mm')}
                    </div>
                    <div style={{ fontSize: 8, color: D.t3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.clientName}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming Bookings List */}
      <div style={{ padding: '16px 18px', borderRadius: 14, background: D.surface, border: `1px solid ${D.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: D.t1, marginBottom: 14 }}>Upcoming Bookings</div>
        {filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: D.t3 }}>
            <AlertCircle style={{ width: 24, height: 24, margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No bookings found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredBookings.slice(0, 6).map(b => (
              <BookingCard key={b.id} booking={b} onConfirm={handleConfirm} onReschedule={handleReschedule} onCancel={handleCancel} isUpcoming={true} />
            ))}
            {filteredBookings.length > 6 && (
              <button style={{ padding: '10px', borderRadius: 10, background: D.bg, border: `1px solid ${D.border}`, color: D.t2, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                View all {filteredBookings.length} bookings →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}