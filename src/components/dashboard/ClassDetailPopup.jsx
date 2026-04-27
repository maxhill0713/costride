/**
 * ClassDetailPopup — popup for class details on calendar.
 * Accepts a `color` prop (hex) from the calendar event to use as the accent color.
 * Delete uses a proper overlay confirmation modal matching RemovePostModal style.
 */
import React, { useState, useEffect } from 'react';
import { X, Clock, Users, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const C = {
  bg: '#0d0d11', card: '#1f1f26', brd: '#252530', t1: '#ffffff', t2: '#9898a6', t3: '#525260',
  purple: '#a855f7', purpleDim: 'rgba(168,85,247,0.10)', purpleBrd: 'rgba(168,85,247,0.25)',
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

export default function ClassDetailPopup({ gymClass, onClose, onDelete, color }) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [liveAttendeeCount, setLiveAttendeeCount] = useState((gymClass.attendee_ids || []).length);

  useEffect(() => {
    if (!gymClass?.id) return;
    base44.entities.GymClass.filter({ id: gymClass.id }).then(res => {
      if (res?.[0]?.attendee_ids !== undefined) setLiveAttendeeCount((res[0].attendee_ids || []).length);
    }).catch(() => {});
  }, [gymClass?.id]);

  // Use the passed-in color, or fall back to purple
  const accentColor = color || C.purple;
  const accentRgb = hexToRgb(accentColor);
  const accentDim = `rgba(${accentRgb},0.10)`;
  const accentBrd = `rgba(${accentRgb},0.25)`;

  return (
    <>
      <div onClick={e => e.target === e.currentTarget && onClose()}
        style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}>
        <div style={{ background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 16, width: 460, maxWidth: '94vw', maxHeight: '102vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.85)', animation: 'detail-in 0.2s ease' }}>
          <style>{`@keyframes detail-in { from{opacity:0;transform:scale(0.97) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>

          {/* Dynamic accent bar using class color */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, rgba(${accentRgb},0.3))`, flexShrink: 0 }} />

          {/* Header */}
          <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {gymClass.name}
              </div>
              <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, flexShrink: 0, marginLeft: 12 }}
                onMouseEnter={e => e.currentTarget.style.color = C.t1} onMouseLeave={e => e.currentTarget.style.color = C.t3}>
                <X size={15} />
              </button>
            </div>

            {/* Coach and Capacity below the title */}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {gymClass.instructor && (
                <div style={{ fontSize: 13, color: C.t2, fontWeight: 500 }}>
                  Coach — <span style={{ color: accentColor, fontWeight: 700 }}>{gymClass.instructor}</span>
                </div>
              )}
              {gymClass.max_capacity && (
                <div style={{ fontSize: 13, color: C.t2, fontWeight: 500 }}>
                  Capacity — <span style={{ color: accentColor, fontWeight: 700 }}>{gymClass.max_capacity}</span>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {gymClass.description && (
              <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.65 }}>{gymClass.description}</div>
            )}

            {/* Stats row — duration, difficulty, attendee count */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {gymClass.duration_minutes && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: accentDim, border: `1px solid ${accentBrd}` }}>
                  <Clock size={12} color={accentColor} />
                  <span style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>{gymClass.duration_minutes} min</span>
                </div>
              )}
              {liveAttendeeCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: accentDim, border: `1px solid ${accentBrd}` }}>
                  <Users size={12} color={accentColor} />
                  <span style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>{liveAttendeeCount} attending</span>
                </div>
              )}
              {gymClass.difficulty && (
                <div style={{ padding: '7px 12px', borderRadius: 9, background: accentDim, border: `1px solid ${accentBrd}` }}>
                  <span style={{ fontSize: 12, color: accentColor, fontWeight: 600, textTransform: 'capitalize' }}>{gymClass.difficulty.replace('_', ' ')}</span>
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
          gymClass={gymClass}
          onConfirm={async (id) => { await onDelete?.(id); setShowRemoveModal(false); onClose(); }}
          onClose={() => setShowRemoveModal(false)}
        />
      )}
    </>
  );
}