import React, { useState, useMemo } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Calendar, Clock, Check, Loader2 } from 'lucide-react';
import { format, isFuture, parseISO } from 'date-fns';
import { toast } from 'sonner';

const S = {
  bg:      '#07101f',
  surface: '#0d1b30',
  border:  'rgba(255,255,255,0.07)',
  borderH: 'rgba(255,255,255,0.12)',
  t1:      '#f0f4f8',
  t2:      '#8899aa',
  t3:      '#445566',
  blue:    '#3b82f6',
  blueDim: 'rgba(59,130,246,0.09)',
  blueBrd: 'rgba(59,130,246,0.22)',
  green:   '#10b981',
};

export default function BookClientModal({ open, onClose, member, classes = [], coach, gymId, onSuccess }) {
  const [selectedClass, setSelectedClass] = useState(null);
  const queryClient = useQueryClient();

  const upcomingClasses = useMemo(() => {
    return classes
      .filter(c => {
        if (!c.schedule) return true; // show all if no schedule field
        return true;
      })
      .slice(0, 20);
  }, [classes]);

  const bookMutation = useMutation({
    mutationFn: (cls) =>
      base44.entities.Booking.create({
        gym_id:       gymId,
        class_id:     cls.id,
        class_name:   cls.name || cls.class_type || 'Session',
        coach_id:     coach?.id,
        coach_name:   coach?.name,
        client_id:    member?.id || member?.user_id,
        client_name:  member?.full_name || member?.name,
        session_date: cls.schedule || new Date().toISOString(),
        status:       'confirmed',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachBookings'] });
      onSuccess?.();
      toast.success(`${member?.full_name || member?.name || 'Client'} booked into ${selectedClass?.name || 'session'}`);
      setSelectedClass(null);
      onClose();
    },
    onError: (e) => toast.error(e?.message || 'Booking failed'),
  });

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 9998 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 460, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        background: S.bg, border: `1px solid ${S.borderH}`, borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)', zIndex: 9999, overflow: 'hidden',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: S.t1, letterSpacing: '-0.02em' }}>
              Book {member?.full_name || member?.name || 'Client'}
            </div>
            <div style={{ fontSize: 11, color: S.t3, marginTop: 2 }}>Select a class or session</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: S.t2 }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Class list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {upcomingClasses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: S.t3, fontSize: 13 }}>
              <Calendar style={{ width: 24, height: 24, margin: '0 auto 10px', opacity: 0.4 }} />
              No classes available. Add classes first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcomingClasses.map(cls => {
                const isSelected = selectedClass?.id === cls.id;
                const timeLabel = cls.time || cls.start_time || cls.schedule_time || '';
                const dayLabel  = cls.day_of_week || cls.schedule_day || '';
                return (
                  <button key={cls.id} onClick={() => setSelectedClass(isSelected ? null : cls)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
                      background: isSelected ? S.blueDim : S.surface,
                      border: `1px solid ${isSelected ? S.blueBrd : S.border}`,
                      cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: isSelected ? S.blueDim : 'rgba(255,255,255,0.04)', border: `1px solid ${isSelected ? S.blueBrd : S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected
                        ? <Check style={{ width: 14, height: 14, color: S.blue }} />
                        : <Calendar style={{ width: 14, height: 14, color: S.t3 }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? S.t1 : S.t1 }}>{cls.name || cls.class_type || 'Session'}</div>
                      <div style={{ fontSize: 11, color: S.t3, marginTop: 2, display: 'flex', gap: 8 }}>
                        {dayLabel && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar style={{ width: 9, height: 9 }} />{dayLabel}</span>}
                        {timeLabel && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock style={{ width: 9, height: 9 }} />{timeLabel}</span>}
                        {cls.capacity && <span>{cls.current_capacity || 0}/{cls.capacity} spots</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${S.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px 0', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.border}`, color: S.t2, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button
            onClick={() => selectedClass && bookMutation.mutate(selectedClass)}
            disabled={!selectedClass || bookMutation.isPending}
            style={{ flex: 2, padding: '9px 0', borderRadius: 9, background: selectedClass ? S.blue : 'rgba(255,255,255,0.04)', border: 'none', color: selectedClass ? '#fff' : S.t3, fontSize: 12, fontWeight: 700, cursor: selectedClass ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}
          >
            {bookMutation.isPending ? <><Loader2 style={{ width: 13, height: 13, animation: 'spin 0.7s linear infinite' }} /> Booking…</> : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </>
  );
}
