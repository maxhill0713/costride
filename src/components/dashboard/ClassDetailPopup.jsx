/**
 * ClassDetailPopup — popup for class details on calendar.
 * Accepts a `color` prop (hex) from the calendar event to use as the accent color.
 */
import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, UserMinus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const C = {
  bg: '#0d0d11', card: '#1f1f26', brd: '#252530', t1: '#ffffff', t2: '#9898a6', t3: '#525260',
  purple: '#a855f7',
  red: '#ff4d6d', redDim: 'rgba(255,77,109,0.10)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function RemoveClassModal({ gymClass, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false);
  const handleConfirm = async () => {
    setRemoving(true);
    try { await onConfirm(gymClass.id); }
    finally { setRemoving(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10100, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: '1px solid rgba(255,77,109,0.25)', borderRadius: 14, padding: '20px 24px', width: 380, maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.t1 }}>Remove Class</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{gymClass.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.t3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 6, flexShrink: 0, marginLeft: 12 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X size={15} />
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.55 }}>
          This will permanently remove the class from the calendar.{' '}
          <span style={{ color: C.red, fontWeight: 600 }}>This cannot be undone.</span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={handleConfirm} disabled={removing}
            style={{ padding: '8px 18px', borderRadius: 8, background: C.red, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: removing ? 'not-allowed' : 'pointer', opacity: removing ? 0.7 : 1, fontFamily: FONT }}>
            {removing ? 'Removing…' : 'Remove Class'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RemoveMemberModal({ memberName, onConfirm, onClose }) {
  const [removing, setRemoving] = useState(false);
  const handleConfirm = async () => {
    setRemoving(true);
    try { await onConfirm(); }
    finally { setRemoving(false); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10100, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: '1px solid rgba(255,77,109,0.25)', borderRadius: 14, padding: '20px 24px', width: 380, maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.t1 }}>Remove Member</div>
            <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>{memberName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.t3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, borderRadius: 6, flexShrink: 0, marginLeft: 12 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X size={15} />
          </button>
        </div>
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.55 }}>
          Remove <span style={{ color: C.t1, fontWeight: 600 }}>{memberName}</span> from this class?{' '}
          <span style={{ color: C.red, fontWeight: 600 }}>They will lose their spot.</span>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={handleConfirm} disabled={removing}
            style={{ padding: '8px 18px', borderRadius: 8, background: C.red, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: removing ? 'not-allowed' : 'pointer', opacity: removing ? 0.7 : 1, fontFamily: FONT }}>
            {removing ? 'Removing…' : 'Remove Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClassDetailPopup({ gymClass, onClose, onDelete, color }) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null); // { id, name }
  const [liveClass, setLiveClass] = useState(gymClass);
  const [memberProfiles, setMemberProfiles] = useState({}); // id -> { full_name, avatar_url }

  // Fetch fresh class data (attendee_ids)
  useEffect(() => {
    if (!gymClass?.id) return;
    base44.entities.GymClass.filter({ id: gymClass.id }).then(res => {
      if (res?.[0]) setLiveClass(res[0]);
    }).catch(() => {});
  }, [gymClass?.id]);

  const attendeeIds = liveClass.attendee_ids || [];

  // Fetch member profiles for all attendees
  useEffect(() => {
    if (!attendeeIds.length) return;
    base44.functions.invoke('getUserAvatars', { userIds: attendeeIds })
      .then(res => {
        const avatars = res?.data?.avatars || {};
        setMemberProfiles(avatars);
      })
      .catch(() => {});
  }, [attendeeIds.join(',')]);

  const handleRemoveMember = async (userId) => {
    const newIds = (liveClass.attendee_ids || []).filter(id => id !== userId);
    await base44.entities.GymClass.update(liveClass.id, { attendee_ids: newIds });
    setLiveClass(prev => ({ ...prev, attendee_ids: newIds }));
    setRemoveMemberTarget(null);
  };

  const accentColor = color || C.purple;
  const accentRgb = hexToRgb(accentColor);
  const accentDim = `rgba(${accentRgb},0.10)`;
  const accentBrd = `rgba(${accentRgb},0.25)`;

  const coachName = liveClass.instructor || liveClass.coach_name;
  const coachAvatar = liveClass.coach_avatar || liveClass.instructor_avatar || null;
  const maxCap = liveClass.max_capacity;

  return (
    <>
      <div onClick={e => e.target === e.currentTarget && onClose()}
        style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}>
        <div style={{ background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 16, width: 460, maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.85)', animation: 'detail-in 0.2s ease' }}>
          <style>{`@keyframes detail-in { from{opacity:0;transform:scale(0.97) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>

          {/* Accent bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, rgba(${accentRgb},0.3))`, flexShrink: 0 }} />

          {/* Header */}
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {liveClass.name}
              </div>
              <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, flexShrink: 0, marginLeft: 12 }}
                onMouseEnter={e => e.currentTarget.style.color = C.t1} onMouseLeave={e => e.currentTarget.style.color = C.t3}>
                <X size={15} />
              </button>
            </div>

            {/* Coach row — avatar + name under title */}
            {coachName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${accentColor}44, ${accentColor}1a)`,
                  border: `2px solid ${accentBrd}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 900, color: accentColor, overflow: 'hidden',
                }}>
                  {coachAvatar
                    ? <img src={coachAvatar} alt={coachName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(coachName)
                  }
                </div>
                <span style={{ fontSize: 13, color: C.t1, fontWeight: 700 }}>{coachName}</span>
              </div>
            )}
          </div>

          {/* Body — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {liveClass.description && (
              <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.65 }}>{liveClass.description}</div>
            )}

            {/* Stats chips — no dividers */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {liveClass.duration_minutes && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 9, background: accentDim, border: `1px solid ${accentBrd}` }}>
                  <Clock size={12} color={accentColor} />
                  <span style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>{liveClass.duration_minutes} min</span>
                </div>
              )}
              {liveClass.difficulty && (
                <div style={{ padding: '6px 11px', borderRadius: 9, background: accentDim, border: `1px solid ${accentBrd}` }}>
                  <span style={{ fontSize: 12, color: accentColor, fontWeight: 600, textTransform: 'capitalize' }}>{liveClass.difficulty.replace('_', ' ')}</span>
                </div>
              )}
            </div>

            {/* Members Joined section */}
            <div>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.t1, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Members Joined
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: accentColor }}>
                  {attendeeIds.length}{maxCap ? `/${maxCap}` : ''}
                </span>
              </div>

              {attendeeIds.length === 0 ? (
                <div style={{ fontSize: 13, color: C.t3, fontStyle: 'italic' }}>No members have joined yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {attendeeIds.map(userId => {
                    const profile = memberProfiles[userId];
                    const name = profile?.full_name || userId;
                    const avatar = profile?.avatar_url || null;
                    return (
                      <div key={userId} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 10,
                        background: C.card, border: `1px solid ${C.brd}`,
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: `rgba(${accentRgb},0.15)`,
                          border: `1px solid ${accentBrd}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 900, color: accentColor, overflow: 'hidden',
                        }}>
                          {avatar
                            ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : initials(name)
                          }
                        </div>
                        {/* Name */}
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {name}
                        </span>
                        {/* Remove button */}
                        {onDelete && (
                          <button
                            onClick={() => setRemoveMemberTarget({ id: userId, name })}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', borderRadius: 7,
                              background: 'transparent', border: `1px solid ${C.brd}`,
                              color: C.t3, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              flexShrink: 0, transition: 'all 0.15s', fontFamily: FONT,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,77,109,0.35)'; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; e.currentTarget.style.background = 'transparent'; }}>
                            <UserMinus size={11} />
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.brd}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
            <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Close</button>
            {onDelete && (
              <button onClick={() => setShowRemoveModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,77,109,0.35)'; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redDim; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
                <Trash2 size={12} color="currentColor" /> Remove Class
              </button>
            )}
          </div>
        </div>
      </div>

      {showRemoveModal && (
        <RemoveClassModal
          gymClass={liveClass}
          onConfirm={async (id) => { await onDelete?.(id); setShowRemoveModal(false); onClose(); }}
          onClose={() => setShowRemoveModal(false)}
        />
      )}

      {removeMemberTarget && (
        <RemoveMemberModal
          memberName={removeMemberTarget.name}
          onConfirm={() => handleRemoveMember(removeMemberTarget.id)}
          onClose={() => setRemoveMemberTarget(null)}
        />
      )}
    </>
  );
}