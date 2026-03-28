import React from 'react';

// ── Class type colors ────────────────────────────────────────────────────────
export const CLASS_TYPE_COLORS = {
  hiit: '#f87171', yoga: '#34d399', strength: '#818cf8', spin: '#38bdf8',
  boxing: '#fb923c', cardio: '#fb7185', pilates: '#c084fc', default: '#a78bfa',
};

export function classColor(cls) {
  const n = (cls?.class_type || cls?.name || '').toLowerCase();
  return CLASS_TYPE_COLORS[Object.keys(CLASS_TYPE_COLORS).find(k => n.includes(k)) || 'default'];
}

// ── Mini avatar ──────────────────────────────────────────────────────────────
export function MiniAvatar({ name, src, size = 30, color = '#a78bfa' }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: src ? 'transparent' : `linear-gradient(135deg,${color}80,${color}40)`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color, flexShrink: 0, overflow: 'hidden' }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : (name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────
export function CoachKpiCard({ icon: Icon, label, value, sub, subColor, accentColor = '#a78bfa', footerBar, trend }) {
  return (
    <div style={{ borderRadius: 12, padding: '20px', background: '#0c1422', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.10em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 12, height: 12, color: '#475569' }}/>
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: subColor || '#475569', fontWeight: 500 }}>{sub}</span>
        {trend != null && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: trend > 0 ? 'rgba(52,211,153,0.1)' : trend < 0 ? 'rgba(248,113,113,0.1)' : 'rgba(100,116,139,0.1)', color: trend > 0 ? '#34d399' : trend < 0 ? '#f87171' : '#64748b' }}>
            {trend > 0 ? `↑${trend}%` : trend < 0 ? `↓${Math.abs(trend)}%` : '→'}
          </span>
        )}
      </div>
      {footerBar != null && (
        <div style={{ marginTop: 10, height: 2, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, footerBar)}%`, background: accentColor, borderRadius: 99, transition: 'width 0.8s ease' }}/>
        </div>
      )}
    </div>
  );
}

// ── Card shell ────────────────────────────────────────────────────────────────
export function CoachCard({ children, style = {}, accent, title, action, onAction }) {
  return (
    <div style={{ background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, position: 'relative', overflow: 'hidden', ...style }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: `linear-gradient(90deg,transparent,${accent}35,transparent)`, pointerEvents: 'none' }}/>}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>{title}</span>
          {onAction && <button onClick={onAction} style={{ fontSize: 11, fontWeight: 700, color: accent || '#a78bfa', background: `${accent || '#a78bfa'}12`, border: `1px solid ${accent || '#a78bfa'}25`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>{action || 'View all'}</button>}
        </div>
      )}
      {children}
    </div>
  );
}