import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, ChevronRight, Flame, Activity, Star, TrendingUp,
  CheckCircle, Clock, Dumbbell, Heart, Target, Zap, Bell, Users,
  Calendar, Shield, Settings,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── CSS ───────────────────────────────────────────────────────────────────────
export const DASH_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; }
  :root {
    --bg:      #0a0e1a;
    --sidebar: #0d1121;
    --card:    #111827;
    --card2:   #161d2e;
    --border:  rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --cyan:    #00d4ff;
    --cyan2:   #0ea5e9;
    --green:   #10b981;
    --orange:  #f59e0b;
    --red:     #ef4444;
    --purple:  #8b5cf6;
    --text1:   #f1f5f9;
    --text2:   #94a3b8;
    --text3:   #475569;
  }
  .dash-root { font-family: 'Outfit', sans-serif !important; }
  .dash-root * { font-family: 'Outfit', sans-serif !important; }
  .dash-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .dash-root ::-webkit-scrollbar-track { background: transparent; }
  .dash-root ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes number-pop {
    0%   { transform: scale(0.92); opacity: 0; }
    60%  { transform: scale(1.04); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes streak-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }

  .anim-fade-up  { animation: fade-in-up  0.4s cubic-bezier(0.22,1,0.36,1) both; }
  .anim-pop      { animation: number-pop  0.5s cubic-bezier(0.22,1,0.36,1) both; }
  .streak-live   { animation: streak-pulse 2s ease-in-out infinite; }

  .card-hover { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
  .card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.5) !important; }

  .nav-item { transition: background 0.15s, color 0.15s; border-radius: 10px; }
  .nav-item:hover { background: rgba(255,255,255,0.05); }
  .nav-item.active { background: rgba(0,212,255,0.1); color: var(--cyan) !important; }
  .nav-item.active svg { color: var(--cyan) !important; }

  .pill-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 99px; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.15s; border: 1px solid transparent;
  }
  .pill-btn:hover { filter: brightness(1.15); }
  .pill-btn.primary { background: rgba(0,212,255,0.15); color: var(--cyan);  border-color: rgba(0,212,255,0.3); }
  .pill-btn.ghost   { background: rgba(255,255,255,0.07); color: var(--text1); border-color: rgba(255,255,255,0.1); }

  .custom-tooltip {
    background: rgba(10,14,26,0.97); border: 1px solid rgba(0,212,255,0.3);
    border-radius: 10px; padding: 9px 13px; font-size: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  .client-row {
    display: grid;
    grid-template-columns: 36px 1fr 120px 90px 120px 96px;
    align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px;
    transition: background 0.12s; cursor: pointer;
    border: 1px solid transparent;
  }
  .client-row:hover           { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.07); }
  .client-row-selected        { background: rgba(14,165,233,0.07) !important; border-color: rgba(14,165,233,0.2) !important; }

  .filter-tab {
    padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; border: 1px solid transparent;
    white-space: nowrap; background: transparent; color: var(--text3);
  }
  .filter-tab:hover        { background: rgba(255,255,255,0.05); color: var(--text2); }
  .filter-tab.active       { background: rgba(14,165,233,0.12);  color: #38bdf8; border-color: rgba(14,165,233,0.25); }
  .filter-tab.active-red   { background: rgba(239,68,68,0.12);   color: #f87171; border-color: rgba(239,68,68,0.25); }
  .filter-tab.active-green { background: rgba(16,185,129,0.12);  color: #34d399; border-color: rgba(16,185,129,0.25); }

  .sort-select {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
    color: var(--text2); border-radius: 8px; padding: 6px 10px; font-size: 12px;
    font-family: 'Outfit', sans-serif; font-weight: 600; cursor: pointer; outline: none;
  }
  .sort-select option { background: #0d1121; }
  .search-input {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09);
    color: var(--text1); border-radius: 8px; padding: 7px 12px 7px 32px;
    font-size: 12px; font-family: 'Outfit', sans-serif; outline: none; width: 180px;
    transition: border-color 0.2s, width 0.2s;
  }
  .search-input:focus { border-color: rgba(14,165,233,0.4); width: 220px; }
  .search-input::placeholder { color: var(--text3); }

  .page-btn {
    width: 28px; height: 28px; border-radius: 7px; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.04);
    color: var(--text3); transition: all 0.15s;
  }
  .page-btn:hover    { background: rgba(255,255,255,0.08); color: var(--text1); }
  .page-btn.active   { background: rgba(14,165,233,0.18); border-color: rgba(14,165,233,0.4); color: #38bdf8; }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .progress-track {
    height: 5px; border-radius: 99px;
    background: rgba(255,255,255,0.06); overflow: hidden;
  }
  .progress-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
  }

  .chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;
  }

  /* ── Settings page ── */
  .settings-section {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px; padding: 20px; margin-bottom: 16px;
  }
  .settings-section-header {
    display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
  }
  .settings-icon {
    width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .settings-field { margin-bottom: 14px; }
  .settings-field-label {
    font-size: 11px; font-weight: 600; color: var(--text3);
    margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;
    display: block;
  }
  .settings-input {
    width: 100%; background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09); color: var(--text1);
    border-radius: 9px; padding: 9px 12px; font-size: 13px;
    font-family: 'Outfit', sans-serif; outline: none; transition: border-color 0.2s;
  }
  .settings-input:focus { border-color: rgba(0,212,255,0.4); }
  .settings-input option { background: #0d1121; }
  .toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
  .toggle-row:first-child { padding-top: 0; }
  .toggle {
    position: relative; width: 38px; height: 22px; flex-shrink: 0; cursor: pointer;
  }
  .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-track {
    position: absolute; inset: 0; border-radius: 99px;
    background: rgba(255,255,255,0.1); transition: background 0.2s;
  }
  .toggle input:checked ~ .toggle-track { background: var(--cyan); }
  .toggle-thumb {
    position: absolute; top: 3px; left: 3px; width: 16px; height: 16px;
    border-radius: 50%; background: #fff; transition: transform 0.2s; pointer-events: none;
  }
  .toggle input:checked ~ .toggle-thumb { transform: translateX(16px); }
  .who-pill {
    padding: 7px 16px; border-radius: 99px; font-size: 12px; font-weight: 700;
    cursor: pointer; border: 1px solid transparent; transition: all 0.15s;
    font-family: 'Outfit', sans-serif;
  }
  .who-pill.active   { background: rgba(0,212,255,0.14); border-color: rgba(0,212,255,0.3); color: var(--cyan); }
  .who-pill.inactive { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); color: var(--text3); }
  .who-pill.inactive:hover { background: rgba(255,255,255,0.07); color: var(--text2); }
  .staff-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    margin-bottom: 8px;
  }
  .add-staff-row { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .add-staff-row input, .add-staff-row select {
    flex: 1; min-width: 100px; background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09); color: var(--text1);
    border-radius: 9px; padding: 8px 11px; font-size: 12px;
    font-family: 'Outfit', sans-serif; outline: none; transition: border-color 0.2s;
  }
  .add-staff-row input:focus, .add-staff-row select:focus { border-color: rgba(0,212,255,0.35); }
  .add-staff-row select option { background: #0d1121; }
  .settings-add-btn {
    padding: 8px 16px; border-radius: 9px; background: rgba(0,212,255,0.12);
    border: 1px solid rgba(0,212,255,0.25); color: var(--cyan);
    font-size: 12px; font-weight: 700; cursor: pointer;
    font-family: 'Outfit', sans-serif; white-space: nowrap; transition: all 0.15s;
  }
  .settings-add-btn:hover { background: rgba(0,212,255,0.22); }
  .settings-remove-btn {
    width: 24px; height: 24px; border-radius: 6px;
    background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.18);
    color: #f87171; cursor: pointer; display: flex; align-items: center;
    justify-content: center; transition: all 0.15s; font-size: 16px; line-height: 1;
  }
  .settings-remove-btn:hover { background: rgba(239,68,68,0.18); }
  .settings-save-bar {
    display: flex; justify-content: flex-end; align-items: center;
    gap: 14px; margin-top: 20px;
  }
  .settings-save-btn {
    padding: 11px 28px; border-radius: 10px;
    background: rgba(0,212,255,0.15); border: 1px solid rgba(0,212,255,0.3);
    color: var(--cyan); font-size: 13px; font-weight: 700; cursor: pointer;
    font-family: 'Outfit', sans-serif; transition: all 0.15s;
  }
  .settings-save-btn:hover { background: rgba(0,212,255,0.25); }
  .logo-upload {
    width: 64px; height: 64px; border-radius: 14px;
    background: rgba(0,212,255,0.07); border: 1.5px dashed rgba(0,212,255,0.25);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; overflow: hidden; flex-shrink: 0;
  }
  .logo-upload:hover { background: rgba(0,212,255,0.12); border-color: rgba(0,212,255,0.4); }
`;

// ─── Layout primitives ─────────────────────────────────────────────────────────
export const Card = ({ children, style = {}, className = '', onClick }) => (
  <div className={`card-hover ${className}`} onClick={onClick}
    style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, ...style }}>
    {children}
  </div>
);

export const SectionTitle = ({ children, action, actionLabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>{children}</p>
    {action && (
      <button onClick={action} style={{ fontSize: 11, fontWeight: 600, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
        {actionLabel || 'View all'} <ChevronRight style={{ width: 11, height: 11 }}/>
      </button>
    )}
  </div>
);

export const Empty = ({ icon: Icon, label }) => (
  <div style={{ padding: '28px 16px', textAlign: 'center' }}>
    <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.14)', margin: '0 auto 10px' }}>
      <Icon style={{ width: 18, height: 18, color: 'rgba(14,165,233,0.4)' }}/>
    </div>
    <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{label}</p>
  </div>
);

// ─── Avatar ────────────────────────────────────────────────────────────────────
export const Avatar = ({ name = '?', size = 32, src = null }) => {
  const colors = [
    ['#3b82f6','#06b6d4'], ['#8b5cf6','#ec4899'], ['#10b981','#0ea5e9'],
    ['#f59e0b','#ef4444'], ['#6366f1','#8b5cf6'], ['#14b8a6','#3b82f6'],
  ];
  const [c1, c2] = colors[(name || '?').charCodeAt(0) % colors.length];
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,${c1},${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.38, fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
      {src && !imgFailed
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)}/>
        : (name || '?').charAt(0).toUpperCase()
      }
    </div>
  );
};

// ─── Charts ────────────────────────────────────────────────────────────────────
export const RingChart = ({ pct = 70, size = 64, stroke = 5, color = '#0ea5e9' }) => {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle fill="none" stroke="rgba(255,255,255,0.07)" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}/>
      <circle fill="none" stroke={color} cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}/>
    </svg>
  );
};

export const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p style={{ color: 'var(--text2)', marginBottom: 4, fontSize: 11 }}>{label}</p>
      <p style={{ color: 'var(--cyan)', fontWeight: 700 }}>{payload[0].value} check-ins</p>
    </div>
  );
};

// ─── StatusChip ────────────────────────────────────────────────────────────────
export const StatusChip = ({ status }) => {
  const map = {
    'Engaged':      { bg: 'rgba(16,185,129,0.14)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    'At Risk':      { bg: 'rgba(239,68,68,0.14)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'  },
    'New':          { bg: 'rgba(14,165,233,0.14)',  color: '#38bdf8', border: 'rgba(14,165,233,0.3)' },
    'Super Active': { bg: 'rgba(16,185,129,0.14)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    'Active':       { bg: 'rgba(14,165,233,0.14)',  color: '#38bdf8', border: 'rgba(14,165,233,0.3)' },
    'Casual':       { bg: 'rgba(245,158,11,0.14)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    'Absent':       { bg: 'rgba(239,68,68,0.1)',    color: '#f87171', border: 'rgba(239,68,68,0.2)'  },
  };
  const s = map[status] || map['New'];
  return (
    <span className="chip" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status === 'At Risk' && <AlertTriangle style={{ width: 9, height: 9 }}/>}
      {status}
    </span>
  );
};

// ─── AbsenceBadge ──────────────────────────────────────────────────────────────
export const AbsenceBadge = ({ days }) => {
  const color  = days > 30 ? '#ef4444' : days > 21 ? '#f97316' : '#fbbf24';
  const border = days > 30 ? 'rgba(239,68,68,0.25)' : days > 21 ? 'rgba(249,115,22,0.25)' : 'rgba(245,158,11,0.25)';
  const bg     = days > 30 ? 'rgba(239,68,68,0.1)'  : days > 21 ? 'rgba(249,115,22,0.1)'  : 'rgba(245,158,11,0.1)';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: bg, color, border: `1px solid ${border}` }}>
      <AlertTriangle style={{ width: 9, height: 9 }}/>
      {days}d absent
    </span>
  );
};

// ─── StreakBadge ───────────────────────────────────────────────────────────────
export const StreakBadge = ({ streak }) => {
  if (!streak || streak < 2) return null;
  const hot = streak >= 7;
  return (
    <span className={hot ? 'streak-live' : ''} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' }}>
      🔥 {streak}d streak
    </span>
  );
};

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export const ProgressBar = ({ label, value, max, color = '#38bdf8', showCount = true }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{label}</span>
          {showCount && <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}{max ? `/${max}` : ''}</span>}
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}bb)` }}/>
      </div>
    </div>
  );
};

// ─── CoachNoteBlock ────────────────────────────────────────────────────────────
export const CoachNoteBlock = ({ value, onChange, placeholder = 'Add a note…', saved = false }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Notes</span>
      {saved && <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>✓ saved</span>}
    </div>
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{ width: '100%', minHeight: 64, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text2)', fontSize: 11, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'Outfit, sans-serif', lineHeight: 1.5, transition: 'border-color 0.2s' }}
      onFocus={e  => { e.target.style.borderColor = 'rgba(167,139,250,0.35)'; }}
      onBlur={e   => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }}
    />
  </div>
);

// ─── OutreachButton ────────────────────────────────────────────────────────────
export const OutreachButton = ({ label = 'Reach Out', color = '#38bdf8', onClick }) => (
  <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: `${color}0e`, border: `1px solid ${color}22`, color, fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s' }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}1c`; e.currentTarget.style.borderColor = `${color}40`; }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}0e`; e.currentTarget.style.borderColor = `${color}22`; }}>
    {label}
  </button>
);

// ─── SettingsPage ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#3b82f6','#06b6d4'], ['#8b5cf6','#ec4899'], ['#10b981','#0ea5e9'],
  ['#f59e0b','#ef4444'], ['#6366f1','#8b5cf6'],
];

const StaffAvatar = ({ name, size = 30 }) => {
  const [c1] = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: c1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const Toggle = ({ checked, onChange }) => (
  <label className="toggle" onClick={() => onChange(!checked)}>
    <input type="checkbox" checked={checked} onChange={() => {}} />
    <span className="toggle-track" />
    <span className="toggle-thumb" />
  </label>
);

export const SettingsPage = () => {
  const [gymName, setGymName]           = useState('Iron Republic Gym');
  const [location, setLocation]         = useState('Manchester, UK');
  const [logoSrc, setLogoSrc]           = useState(null);
  const [capacity, setCapacity]         = useState(20);
  const [bookingWindow, setBookingWindow] = useState(7);
  const [poster, setPoster]             = useState('everyone');
  const [canDelete, setCanDelete]       = useState(true);
  const [classReminders, setClassReminders] = useState(true);
  const [announcements, setAnnouncements]   = useState(true);
  const [saved, setSaved]               = useState(false);

  const [staff, setStaff] = useState([
    { name: 'Jordan Lee',  email: 'jordan@ironrepublic.com', role: 'Owner' },
    { name: 'Sam Osei',    email: 'sam@ironrepublic.com',    role: 'Coach' },
    { name: 'Priya Nair',  email: 'priya@ironrepublic.com',  role: 'Coach' },
  ]);
  const [newName,  setNewName]  = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole,  setNewRole]  = useState('Coach');

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addStaff = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setStaff(prev => [...prev, { name: newName.trim(), email: newEmail.trim(), role: newRole }]);
    setNewName(''); setNewEmail('');
  };

  const removeStaff = (i) => setStaff(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  const roleBadgeStyle = (role) => role === 'Owner'
    ? { background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.22)' }
    : { background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.22)' };

  return (
    <div className="dash-root" style={{ padding: '28px 20px', background: 'var(--bg)', minHeight: '100vh' }}>
      <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text1)', marginBottom: 4 }}>Settings</p>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 28 }}>Manage your gym profile, staff, and community preferences.</p>

      {/* ── Gym Profile ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-icon" style={{ background: 'rgba(0,212,255,0.1)' }}>
            <Settings size={16} color="var(--cyan)" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Gym profile</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Your public-facing identity</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div className="logo-upload" onClick={() => document.getElementById('logo-file').click()}>
            {logoSrc
              ? <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              : <span style={{ fontSize: 24, color: 'rgba(0,212,255,0.4)', lineHeight: 1 }}>+</span>
            }
          </div>
          <input id="logo-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>Upload gym logo</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>PNG or JPG · max 2 MB</p>
          </div>
        </div>

        <div className="settings-field">
          <label className="settings-field-label">Gym name</label>
          <input className="settings-input" value={gymName} onChange={e => setGymName(e.target.value)} placeholder="e.g. Iron Republic Gym" />
        </div>
        <div className="settings-field" style={{ marginBottom: 0 }}>
          <label className="settings-field-label">Location</label>
          <input className="settings-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Manchester, UK" />
        </div>
      </div>

      {/* ── Staff & Roles ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-icon" style={{ background: 'rgba(139,92,246,0.1)' }}>
            <Users size={16} color="var(--purple)" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Staff & roles</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Owners and coaches only</p>
          </div>
        </div>

        {staff.map((s, i) => (
          <div key={i} className="staff-row">
            <StaffAvatar name={s.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text3)' }}>{s.email}</p>
            </div>
            <span className="chip" style={roleBadgeStyle(s.role)}>{s.role}</span>
            {s.role !== 'Owner'
              ? <button className="settings-remove-btn" onClick={() => removeStaff(i)}>×</button>
              : <div style={{ width: 24 }} />
            }
          </div>
        ))}

        <div className="add-staff-row">
          <input value={newName}  onChange={e => setNewName(e.target.value)}  placeholder="Name" />
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email" />
          <select value={newRole} onChange={e => setNewRole(e.target.value)}>
            <option value="Coach">Coach</option>
            <option value="Owner">Owner</option>
          </select>
          <button className="settings-add-btn" onClick={addStaff}>+ Add</button>
        </div>
      </div>

      {/* ── Class Settings ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <Calendar size={16} color="var(--green)" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Class settings</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Defaults for all classes</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="settings-field" style={{ marginBottom: 0 }}>
            <label className="settings-field-label">Default capacity</label>
            <input className="settings-input" type="number" min={1} max={200} value={capacity} onChange={e => setCapacity(e.target.value)} />
          </div>
          <div className="settings-field" style={{ marginBottom: 0 }}>
            <label className="settings-field-label">Booking window (days)</label>
            <input className="settings-input" type="number" min={1} max={30} value={bookingWindow} onChange={e => setBookingWindow(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Community Controls ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-icon" style={{ background: 'rgba(0,212,255,0.1)' }}>
            <Shield size={16} color="var(--cyan)" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Community controls</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Manage who can post</p>
          </div>
        </div>

        <div className="toggle-row">
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>Who can post</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Select who can create community posts</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className={`who-pill ${poster === 'everyone' ? 'active' : 'inactive'}`} onClick={() => setPoster('everyone')}>Everyone</button>
              <button className={`who-pill ${poster === 'coaches' ? 'active' : 'inactive'}`}  onClick={() => setPoster('coaches')}>Coaches only</button>
            </div>
          </div>
        </div>

        <div className="toggle-row">
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>Owner can delete posts</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Allow you to remove any community post</p>
          </div>
          <Toggle checked={canDelete} onChange={setCanDelete} />
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <div className="settings-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
            <Bell size={16} color="var(--orange)" />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)' }}>Notifications</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>What gets sent to members</p>
          </div>
        </div>

        <div className="toggle-row">
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>Class reminders</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Send members a reminder 1 hour before class</p>
          </div>
          <Toggle checked={classReminders} onChange={setClassReminders} />
        </div>

        <div className="toggle-row">
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>Announcements</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Notify members when you post a gym update</p>
          </div>
          <Toggle checked={announcements} onChange={setAnnouncements} />
        </div>
      </div>

      {/* ── Save bar ── */}
      <div className="settings-save-bar">
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#34d399', fontWeight: 600 }}>
            <CheckCircle size={13} /> Changes saved
          </span>
        )}
        <button className="settings-save-btn" onClick={handleSave}>Save changes</button>
      </div>
    </div>
  );
};

// ─── Default export: TabGym ────────────────────────────────────────────────────
export default function TabGym({
  selectedGym, classes, coaches, openModal,
  checkIns = [], allMemberships = [], atRisk = 0, retentionRate = 0,
  atRiskDays: atRiskDaysProp = 14, onAtRiskDaysChange,
}) {
  return <SettingsPage />;
}