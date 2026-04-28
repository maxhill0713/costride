import React, { useEffect } from 'react';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.07)';
const CARD_STYLE = { background: CARD_BG, border: CARD_BORDER, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

const AV_COLORS = [
  { bg: '#1a2a4a', color: '#93c5fd' },
  { bg: '#2a1a3a', color: '#c4b5fd' },
  { bg: '#1a2e20', color: '#86efac' },
  { bg: '#2e1a1a', color: '#fca5a5' },
  { bg: '#1a2535', color: '#7dd3fc' },
  { bg: '#422006', color: '#fb923c' },
  { bg: '#1e2a30', color: '#67e8f9' },
  { bg: '#2a1a28', color: '#f0abfc' }
];

const CSS = `@keyframes an-ping { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.8);opacity:0} }`;

export default function ActiveNowStrip({ checkIns, memberAvatarMap }) {
  useEffect(() => {
    if (!document.getElementById('an-css')) {
      const s = document.createElement('style'); s.id = 'an-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  const getTimestamp = (c) => {
    const candidates = [c.created_date, c.created_at, c.timestamp, c.check_in_time, c.checkin_time, c.date_created, c.check_in_date];
    let best = null;
    for (const v of candidates) {
      if (!v) continue;
      const d = new Date(v);
      if (!isNaN(d.getTime()) && (best === null || d > best)) best = d;
    }
    return best;
  };

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const seen = new Set();
  const recent = checkIns
    .filter((c) => { const ts = getTimestamp(c); return ts && ts >= twoHoursAgo; })
    .filter((c) => { if (seen.has(c.user_id)) return false; seen.add(c.user_id); return true; })
    .slice(0, 12);

  if (recent.length === 0) return null;

  const ini = (n = '') => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ ...CARD_STYLE, borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
        <span style={{ position: 'relative', width: 8, height: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: 'rgba(34,197,94,0.25)', animation: 'an-ping 1.5s ease-in-out infinite' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.9)', flexShrink: 0 }} />
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
          {recent.length} Active Now
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'hidden' }}>
        {recent.slice(0, 8).map((c, i) => {
          const col = AV_COLORS[i % AV_COLORS.length];
          const avatar = memberAvatarMap[c.user_id];
          return (
            <div key={c.user_id || i} title={c.user_name}
              style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: col.bg, border: '2px solid rgba(6,8,18,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: col.color, overflow: 'hidden', marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {avatar ? <img src={avatar} alt={c.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(c.user_name)}
            </div>
          );
        })}
        {recent.length > 8 &&
        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(6,8,18,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.5)', marginLeft: -8, zIndex: 0 }}>
          +{recent.length - 8}
        </div>
        }
      </div>
    </div>
  );
}