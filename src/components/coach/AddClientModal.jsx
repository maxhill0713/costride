import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, X, UserPlus, CheckCircle } from 'lucide-react';

export default function AddClientModal({ open, onClose, coach, existingClientIds = [], pendingClientIds = [] }) {
  const [query, setQuery] = useState('');
  const [justAdded, setJustAdded] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: gymMembers = [] } = useQuery({
    queryKey: ['gymMembersForCoach', coach?.coach_gym_id || coach?.gym_id],
    queryFn: () => base44.entities.GymMembership.filter(
      { gym_id: coach?.coach_gym_id || coach?.gym_id, status: 'active' },
      'user_name', 200
    ),
    enabled: open && !!(coach?.coach_gym_id || coach?.gym_id),
    staleTime: 2 * 60 * 1000,
  });

  const inviteMutation = useMutation({
    mutationFn: async (member) => {
      await base44.entities.CoachInvite.create({
        coach_id:      coach.user_id || coach.id,
        coach_name:    coach.name,
        coach_avatar:  coach.avatar_url || null,
        coach_gym_id:  coach.coach_gym_id || coach.gym_id,
        coach_gym_name: coach.gym_name || '',
        member_id:     member.user_id,
        member_name:   member.user_name,
        member_email:  member.user_email || '',
        status:        'pending',
      });
    },
    onSuccess: (_, member) => {
      setJustAdded(prev => new Set(prev).add(member.user_id));
      queryClient.invalidateQueries({ queryKey: ['coachInvites'] });
      queryClient.invalidateQueries({ queryKey: ['coachInvitesForCoach'] });
    },
  });

  if (!open) return null;

  const filtered = gymMembers.filter(m => {
    if (!m.user_name) return false;
    if (m.user_id === (coach?.user_id || coach?.id)) return false;
    if (query && !m.user_name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(2,4,10,0.72)', backdropFilter: 'blur(6px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(92vw, 440px)', maxHeight: '80vh',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg, rgba(12,18,40,0.99) 0%, rgba(6,10,24,1) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UserPlus style={{ width: 16, height: 16, color: '#3b82f6' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>Add Client</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>Search gym members to invite</div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 13, height: 13, color: '#94a3b8' }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#475569', pointerEvents: 'none' }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 34px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#e2e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.45)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
              {query ? 'No members found' : 'No gym members yet'}
            </div>
          ) : (
            filtered.map((member, i) => {
              const alreadyClient  = existingClientIds.includes(member.user_id);
              const alreadyPending = pendingClientIds.includes(member.user_id);
              const justSent       = justAdded.has(member.user_id);
              const isPending      = alreadyPending || justSent;

              return (
                <div key={member.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#3b82f6', overflow: 'hidden' }}>
                    {member.avatar_url ? <img src={member.avatar_url} alt={member.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(member.user_name)}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.user_name}</div>
                    {member.user_email && <div style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>{member.user_email}</div>}
                  </div>

                  {/* Action */}
                  {alreadyClient ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 99, padding: '3px 10px' }}>Client</span>
                  ) : isPending ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)', borderRadius: 99, padding: '3px 10px' }}>Pending</span>
                  ) : (
                    <button
                      onClick={() => inviteMutation.mutate(member)}
                      disabled={inviteMutation.isPending}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 9, background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)', border: 'none', borderBottom: '2px solid #1a3fa8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 0 rgba(0,0,0,0.4)', flexShrink: 0 }}
                    >
                      <UserPlus style={{ width: 11, height: 11 }} /> Add
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}