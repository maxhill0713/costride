import React from 'react';

const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export default function TopLiftsBox() {
  return (
    <div style={{ ...CARD, borderRadius: 16, padding: '12px 12px', flex: 1, minHeight: 180, display: 'flex', flexDirection: 'column' }}>
      {['Squat', 'Bench', 'Deadlift'].map((exercise, i) => (
        <div key={exercise} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', paddingTop: i === 0 ? 0 : 8, borderTop: i !== 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
          <h2 style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#e2e8f0',
            letterSpacing: '-0.01em',
            margin: 0,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}>
            {exercise}
          </h2>
          {/* Data goes here */}
        </div>
      ))}
    </div>
  );
}