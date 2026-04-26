/**
 * ClassDetailPopup — purple-themed popup for class details on calendar
 */
import React, { useState } from 'react';
import { X, Dumbbell, Clock, Users, Trash2 } from 'lucide-react';

const C = {
  bg: '#0d0d11', card: '#1f1f26', brd: '#252530', t1: '#ffffff', t2: '#9898a6', t3: '#525260',
  purple: '#a855f7', purpleDim: 'rgba(168,85,247,0.10)', purpleBrd: 'rgba(168,85,247,0.25)',
  red: '#ff4d6d', redDim: 'rgba(255,77,109,0.10)',
};
const FONT = "'DM Sans','Inter',system-ui,sans-serif";

export default function ClassDetailPopup({ gymClass, onClose, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const schedule = (gymClass.schedule || []).filter(s => s.day && s.time);

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return; }
    setDeleting(true);
    try { await onDelete?.(gymClass.id); }
    finally { setDeleting(false); }
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }}>
      <div style={{ background: C.bg, border: `1px solid ${C.brd}`, borderRadius: 16, width: 460, maxWidth: '94vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.85)', animation: 'detail-in 0.2s ease' }}>
        <style>{`@keyframes detail-in { from{opacity:0;transform:scale(0.97) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>

        {/* Purple accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.purple}, rgba(168,85,247,0.3))`, flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.brd}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: C.purpleDim, border: `1px solid ${C.purpleBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Dumbbell size={18} color={C.purple} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.t1, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{gymClass.name}</div>
              {gymClass.instructor && <div style={{ fontSize: 12, color: C.purple, fontWeight: 600, marginTop: 2 }}>with {gymClass.instructor}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: C.t3, flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1} onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {gymClass.description && (
            <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.65 }}>{gymClass.description}</div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {gymClass.duration_minutes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: C.purpleDim, border: `1px solid ${C.purpleBrd}` }}>
                <Clock size={12} color={C.purple} />
                <span style={{ fontSize: 12, color: C.purple, fontWeight: 600 }}>{gymClass.duration_minutes} min</span>
              </div>
            )}
            {gymClass.max_capacity && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: C.purpleDim, border: `1px solid ${C.purpleBrd}` }}>
                <Users size={12} color={C.purple} />
                <span style={{ fontSize: 12, color: C.purple, fontWeight: 600 }}>Max {gymClass.max_capacity}</span>
              </div>
            )}
            {gymClass.difficulty && (
              <div style={{ padding: '7px 12px', borderRadius: 9, background: C.purpleDim, border: `1px solid ${C.purpleBrd}` }}>
                <span style={{ fontSize: 12, color: C.purple, fontWeight: 600, textTransform: 'capitalize' }}>{gymClass.difficulty.replace('_', ' ')}</span>
              </div>
            )}
          </div>

          {/* Schedule */}
          {schedule.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Weekly Schedule</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: C.card, border: `1px solid ${C.brd}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.purple, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>{s.day}</span>
                    <span style={{ fontSize: 12, color: C.t3, marginLeft: 'auto' }}>{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: `1px solid ${C.brd}`, display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          {confirming ? (
            <>
              <span style={{ fontSize: 12, color: C.t2, alignSelf: 'center', marginRight: 4 }}>Delete this class?</span>
              <button onClick={() => setConfirming(false)} style={{ padding: '7px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '7px 16px', borderRadius: 8, background: C.red, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.7 : 1, fontFamily: FONT }}>
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Close</button>
              <button onClick={handleDelete}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: C.redDim, border: '1px solid rgba(255,77,109,0.3)', color: C.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                <Trash2 size={12} /> Remove Class
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}