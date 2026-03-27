import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, User, MapPin, CheckCircle, XCircle, AlertCircle, Search, Filter } from 'lucide-react';
import { format, startOfDay, endOfDay, isToday, isTomorrow } from 'date-fns';

export default function CoachBookings() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();

  // Fetch current coach and their bookings
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: coach } = useQuery({
    queryKey: ['coach', currentUser?.id],
    queryFn: () => base44.entities.Coach.filter({ user_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['coachBookings', coach?.[0]?.id],
    queryFn: () => base44.entities.GymClass.filter({ instructor: coach?.[0]?.name }),
    enabled: !!coach?.[0]?.name,
    staleTime: 30000,
  });

  // Update booking status
  const updateBookingMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.GymClass.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachBookings'] });
    },
  });

  const handleConfirm = (id) => {
    updateBookingMutation.mutate({ id, status: 'confirmed' });
  };

  const handleCancel = (id) => {
    updateBookingMutation.mutate({ id, status: 'cancelled' });
  };

  // Filter and search bookings
  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch = !search || (b.name || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || (b.status === filterStatus);
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      const dateA = new Date(a.schedule || '').getTime();
      const dateB = new Date(b.schedule || '').getTime();
      return dateA - dateB;
    });
  }, [bookings, search, filterStatus]);

  const statusColors = {
    pending: { bg: '#fbbf2410', border: '#fbbf2440', text: '#fbbf24', label: 'Pending' },
    confirmed: { bg: '#34d39910', border: '#34d39940', text: '#34d399', label: 'Confirmed' },
    cancelled: { bg: '#f8717110', border: '#f8717140', text: '#f87171', label: 'Cancelled' },
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #1e3a5f, #0f172a)', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#f1f5f9', margin: 0, marginBottom: 8 }}>My Bookings</h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>Manage your class and session bookings</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Bookings', value: bookings.length, color: '#38bdf8' },
            { label: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#34d399' },
            { label: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: '#fbbf24' },
            { label: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#f87171' },
          ].map((stat, i) => (
            <div key={i} style={{ borderRadius: 12, padding: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#3a5070' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bookings..."
              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', color: '#f1f5f9', fontSize: 13, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'pending', 'confirmed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: filterStatus === status ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  background: filterStatus === status ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)',
                  color: filterStatus === status ? '#a78bfa' : '#64748b',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filtered.length === 0 ? (
          <div style={{ borderRadius: 14, padding: 40, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <Calendar style={{ width: 32, height: 32, color: '#3a5070', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>No bookings found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map(booking => {
              const sc = statusColors[booking.status] || statusColors.pending;
              return (
                <div
                  key={booking.id}
                  style={{
                    borderRadius: 14,
                    padding: 16,
                    background: '#0c1a2e',
                    border: `1px solid ${sc.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{booking.name}</h3>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                      {booking.schedule && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                          <Clock style={{ width: 14, height: 14 }} />
                          {booking.schedule}
                        </div>
                      )}
                      {booking.duration_minutes && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                          <AlertCircle style={{ width: 14, height: 14 }} />
                          {booking.duration_minutes} min
                        </div>
                      )}
                      {booking.max_capacity && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                          <User style={{ width: 14, height: 14 }} />
                          {booking.max_capacity} capacity
                        </div>
                      )}
                      {booking.difficulty && (
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>
                          {booking.difficulty}
                        </div>
                      )}
                    </div>
                    {booking.description && (
                      <p style={{ fontSize: 12, color: '#64748b', margin: '8px 0 0' }}>{booking.description}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {booking.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleConfirm(booking.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: 'rgba(52,211,153,0.1)',
                          border: '1px solid rgba(52,211,153,0.3)',
                          color: '#34d399',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle style={{ width: 13, height: 13 }} />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleCancel(booking.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: 'rgba(248,113,113,0.1)',
                          border: '1px solid rgba(248,113,113,0.3)',
                          color: '#f87171',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <XCircle style={{ width: 13, height: 13 }} />
                        Cancel
                      </button>
                    </div>
                  )}
                  {booking.status !== 'pending' && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: sc.bg,
                      color: sc.text,
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {sc.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}