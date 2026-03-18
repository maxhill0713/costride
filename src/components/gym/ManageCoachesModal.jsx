import React, { useState } from 'react';
import { X, UserPlus, GraduationCap, Trash2, MoreHorizontal, Mail, Shield, Clock } from 'lucide-react';
import AddCoachModal from './AddCoachModal';

const T = {
  bg:     '#060c18',
  card:   '#0c1a2e',
  card2:  '#0d1b30',
  border: 'rgba(255,255,255,0.08)',
  borderM:'rgba(255,255,255,0.13)',
  text1:  '#f0f4f8',
  text2:  '#8ba0b8',
  text3:  '#3a5070',
  blue:   '#0ea5e9',
  green:  '#10b981',
  amber:  '#f59e0b',
  red:    '#ef4444',
  purple: '#8b5cf6',
};

const ROLE_COLORS = { admin: T.amber, coach: T.blue, viewer: T.purple };

function CoachRow({ coach, onDelete, onUpdateRole }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isPending = coach.invite_status === 'pending' || !coach.invite_status;
  const roleColor = ROLE_COLORS[coach.role] || T.blue;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: `1px solid ${T.border}`, position: 'relative' }}>
      {/* Avatar */}
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: coach.avatar_url ? 'transparent' : `${roleColor}20`, border: `1.5px solid ${roleColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: roleColor, flexShrink: 0, overflow: 'hidden' }}>
        {coach.avatar_url ? <img src={coach.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={coach.name} /> : (coach.name || 'C').charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coach.name}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: roleColor, background: `${roleColor}12`, border: `1px solid ${roleColor}28`, borderRadius: 5, padding: '1px 7px', flexShrink: 0 }}>
            {coach.role || 'Coach'}
          </span>
          {isPending && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: T.amber, background: `${T.amber}10`, border: `1px solid ${T.amber}25`, borderRadius: 5, padding: '1px 6px', flexShrink: 0 }}>
              <Clock style={{ width: 8, height: 8 }} /> Pending
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Mail style={{ width: 10, height: 10 }} />
          <span>{coach.user_email}</span>
          {coach.total_clients > 0 && <><span>·</span><span>{coach.total_clients} members</span></>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Role selector */}
        <select
          value={coach.role || 'coach'}
          onChange={e => onUpdateRole(coach.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          style={{ padding: '5px 8px', borderRadius: 7, background: T.card2, border: `1px solid ${T.border}`, color: T.text2, fontSize: 11, outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>

        <button onClick={() => onDelete(coach.id)}
          style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', cursor: 'pointer', color: T.red, flexShrink: 0 }}>
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}

export default function ManageCoachesModal({ open, onClose, coaches = [], onCreateCoach, onDeleteCoach, onUpdateCoach, gym, isLoading, allMemberships = [], classes = [] }) {
  const [showAdd, setShowAdd] = useState(false);

  if (!open) return null;

  const handleCreate = async (data) => {
    await onCreateCoach(data);
    setShowAdd(false);
  };

  const handleUpdateRole = (coachId, role) => {
    const ROLE_PERMS = {
      coach:  { can_post: true,  can_manage_events: true,  can_manage_classes: true  },
      admin:  { can_post: true,  can_manage_events: true,  can_manage_classes: true  },
      viewer: { can_post: false, can_manage_events: false, can_manage_classes: false },
    };
    onUpdateCoach(coachId, { role, ...ROLE_PERMS[role] });
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(5px)' }} />

        <div style={{ position: 'relative', width: '100%', maxWidth: 540, background: T.card, border: `1px solid ${T.borderM}`, borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', overflow: 'hidden', fontFamily: 'DM Sans, system-ui, sans-serif', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${T.blue}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap style={{ width: 15, height: 15, color: T.blue }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text1 }}>Coaches & Team</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{coaches.length} {coaches.length === 1 ? 'coach' : 'coaches'} · {gym?.name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: T.blue, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <UserPlus style={{ width: 13, height: 13 }} /> Add Coach
              </button>
              <button onClick={onClose}
                style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, cursor: 'pointer', color: T.text3 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {coaches.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${T.blue}0d`, border: `1px solid ${T.blue}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <GraduationCap style={{ width: 22, height: 22, color: T.blue, opacity: 0.5 }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text1, marginBottom: 6 }}>Add your first coach</div>
                <div style={{ fontSize: 12, color: T.text3, marginBottom: 20, lineHeight: 1.5 }}>Invite coaches to help manage members, run classes, and create content</div>
                <button onClick={() => setShowAdd(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 9, background: T.blue, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <UserPlus style={{ width: 14, height: 14 }} /> + Add Coach
                </button>
              </div>
            ) : (
              <div>
                {coaches.map(coach => (
                  <CoachRow key={coach.id} coach={coach} onDelete={onDeleteCoach} onUpdateRole={handleUpdateRole} />
                ))}
              </div>
            )}
          </div>

          {/* Pending count footer */}
          {coaches.some(c => c.invite_status === 'pending' || !c.invite_status) && (
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
              <Clock style={{ width: 11, height: 11, color: T.amber }} />
              <span style={{ fontSize: 11, color: T.text3 }}>
                {coaches.filter(c => c.invite_status === 'pending' || !c.invite_status).length} invite{coaches.filter(c => !c.invite_status || c.invite_status === 'pending').length > 1 ? 's' : ''} pending — coach will join once they accept
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Add Coach Modal (layered on top) */}
      <AddCoachModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        gym={gym}
        allMemberships={allMemberships}
        classes={classes}
        onCreate={handleCreate}
      />
    </>
  );
}