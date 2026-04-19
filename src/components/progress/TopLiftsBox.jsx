import React from 'react';

const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export default function TopLiftsBox() {
  return (
    <div style={{ ...CARD, borderRadius: 16, padding: '12px 12px', flex: 1, minHeight: 180, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {['Squat', 'Bench', 'Deadlift'].map((exercise) => (
        <div key={exercise} style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{exercise}</span>
        </div>
      ))}
    </div>
  );
}