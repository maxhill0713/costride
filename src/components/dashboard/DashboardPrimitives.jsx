import React, { useState, useMemo } from 'react';
import { AlertTriangle, AlertCircle, ChevronRight, Sparkles, Flame, Activity, Zap, Star, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

// ─── CSS ──────────────────────────────────────────────────────────────────────
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

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes number-pop {
    0%   { transform: scale(0.92); opacity: 0; }
    60%  { transform: scale(1.04); }
    100% { transform: scale(1); opacity: 1; }
  }
  .anim-fade-up { animation: fade-in-up 0.4s cubic-bezier(0.22,1,0.36,1) both; }
  .anim-pop     { animation: number-pop 0.5s cubic-bezier(0.22,1,0.36,1) both; }

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
  .pill-btn.primary { background: rgba(0,212,255,0.15); color: var(--cyan); border-color: rgba(0,212,255,0.3); }
  .pill-btn.ghost   { background: rgba(255,255,255,0.07); color: var(--text1); border-color: rgba(255,255,255,0.1); }

  .custom-tooltip {
    background: rgba(10,14,26,0.97); border: 1px solid rgba(0,212,255,0.3);
    border-radius: 10px; padding: 9px 13px; font-size: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  .hm-cell { border-radius: 3px; transition: transform 0.1s; }
  .hm-cell:hover { transform: scale(1.3); z-index: 10; position: relative; }

  .priority-row {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px; border-radius: 10px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    transition: background 0.15s; cursor: pointer;
  }
  .priority-row:hover { background: rgba(255,255,255,0.06); }

  .qa-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 14px; border-radius: 12px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
    cursor: pointer; transition: all 0.15s; text-align: left; width: 100%;
  }
  .qa-btn:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.13); transform: translateY(-1px); }
  .qa-btn:active { transform: translateY(0); }

  .ring-svg { transform: rotate(-90deg); }
  .ring-track { fill: none; stroke: rgba(255,255,255,0.07); }
  .ring-progress { fill: none; stroke-linecap: round; transition: stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1); }

  .recharts-dot { r: 4 !important; }

  .member-row {
    display: grid;
    grid-template-columns: 36px 1fr 140px 130px 170px 100px;
    align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 10px;
    transition: background 0.12s; cursor: pointer;
    border: 1px solid transparent;
  }
  .member-row:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.07); }
  .member-row-selected { background: rgba(14,165,233,0.07) !important; border-color: rgba(14,165,233,0.2) !important; }

  .filter-tab {
    padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; border: 1px solid transparent;
    white-space: nowrap; background: transparent; color: var(--text3);
  }
  .filter-tab:hover { background: rgba(255,255,255,0.05); color: var(--text2); }
  .filter-tab.active { background: rgba(14,165,233,0.12); color: #38bdf8; border-color: rgba(14,165,233,0.25); }
  .filter-tab.active-red { background: rgba(239,68,68,0.12); color: #f87171; border-color: rgba(239,68,68,0.25); }

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
  .page-btn:hover { background: rgba(255,255,255,0.08); color: var(--text1); }
  .page-btn.active { background: rgba(14,165,233,0.18); border-color: rgba(14,165,233,0.4); color: #38bdf8; }
  .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .alert-card {
    padding: 13px 14px; border-radius: 12px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
    margin-bottom: 10px;
  }

  .chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;
  }
`;

// ─── Shared micro-components ──────────────────────────────────────────────────
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
        {actionLabel || 'View all'} <ChevronRight style={{ width: 11, height: 11 }} />
      </button>
    )}
  </div>
);

export const Empty = ({ icon: Icon, label }) => (
  <div style={{ padding: '28px 16px', textAlign: 'center' }}>
    <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.14)', margin: '0 auto 10px' }}>
      <Icon style={{ width: 18, height: 18, color: 'rgba(14,165,233,0.4)' }} />
    </div>
    <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>{label}</p>
  </div>
);

export const Avatar = ({ name = '?', size = 32, src = null }) => {
  const colors = [['#3b82f6','#06b6d4'],['#8b5cf6','#ec4899'],['#10b981','#0ea5e9'],['#f59e0b','#ef4444'],['#6366f1','#8b5cf6'],['#14b8a6','#3b82f6']];
  const [c1, c2] = colors[(name || '?').charCodeAt(0) % colors.length];
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg,${c1},${c2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.38, fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
      {src && !imgFailed
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFailed(true)}/>
        : (name || '?').charAt(0).toUpperCase()}
    </div>
  );
};

export const RingChart = ({ pct = 70, size = 64, stroke = 5, color = '#0ea5e9' }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <svg width={size} height={size} className="ring-svg">
      <circle className="ring-track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}/>
      <circle className="ring-progress" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
        stroke={color} strokeDasharray={`${dash} ${circ}`} strokeDashoffset={0}/>
    </svg>
  );
};

export const Sparkline = ({ data, color = '#10b981', height = 36 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`spk-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#spk-${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
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

export const AttendanceHeatmap = ({ checkIns }) => {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const slots = ['6AM','12PM','6PM','9PM'];
  const slotHours = [[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22]];
  const grid = useMemo(() => {
    const acc = {};
    checkIns.forEach(c => {
      const d = new Date(c.check_in_date);
      const dow = (d.getDay() + 6) % 7;
      const h = d.getHours();
      const slot = slotHours.findIndex(s => s.includes(h));
      if (slot === -1) return;
      const key = `${dow}-${slot}`;
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, [checkIns]);
  const max = Math.max(...Object.values(grid), 1);
  const getColor = (v) => {
    if (!v) return 'rgba(255,255,255,0.04)';
    const t = v / max;
    if (t < 0.2) return 'rgba(6,182,212,0.18)';
    if (t < 0.4) return 'rgba(6,182,212,0.35)';
    if (t < 0.6) return 'rgba(6,182,212,0.55)';
    if (t < 0.8) return 'rgba(6,182,212,0.75)';
    return 'rgba(6,182,212,0.95)';
  };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        <div/>{days.map(d => <div key={d} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textAlign: 'center' }}>{d}</div>)}
      </div>
      {slots.map((slot, si) => (
        <div key={slot} style={{ display: 'grid', gridTemplateColumns: '36px repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>{slot}</div>
          {days.map((_, di) => {
            const v = grid[`${di}-${si}`] || 0;
            return <div key={di} className="hm-cell" title={`${days[di]} ${slot}: ${v} check-ins`} style={{ height: 20, borderRadius: 4, background: getColor(v) }}/>;
          })}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>Low</span>
        {[0.04, 0.2, 0.4, 0.6, 0.8, 1.0].map((t, i) => (
          <div key={i} style={{ width: 14, height: 8, borderRadius: 2, background: i === 0 ? 'rgba(255,255,255,0.04)' : `rgba(6,182,212,${t * 0.9 + 0.05})` }}/>
        ))}
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>High</span>
      </div>
    </div>
  );
};

export const StatusChip = ({ status }) => {
  const map = {
    'Engaged':       { bg: 'rgba(16,185,129,0.14)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    'At Risk':       { bg: 'rgba(239,68,68,0.14)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
    'Payment Failed':{ bg: 'rgba(245,158,11,0.14)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    'New':           { bg: 'rgba(14,165,233,0.14)',  color: '#38bdf8', border: 'rgba(14,165,233,0.3)' },
    'Beginner':      { bg: 'rgba(139,92,246,0.14)',  color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
    'Banned':        { bg: 'rgba(239,68,68,0.1)',    color: '#f87171', border: 'rgba(239,68,68,0.2)' },
    'Super Active':  { bg: 'rgba(16,185,129,0.14)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    'Active':        { bg: 'rgba(14,165,233,0.14)',  color: '#38bdf8', border: 'rgba(14,165,233,0.3)' },
    'Casual':        { bg: 'rgba(245,158,11,0.14)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  };
  const s = map[status] || map['New'];
  return (
    <span className="chip" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status === 'At Risk' && <AlertTriangle style={{ width: 9, height: 9 }}/>}
      {status === 'Payment Failed' && <AlertCircle style={{ width: 9, height: 9 }}/>}
      {status}
    </span>
  );
};

export const RiskBadge = ({ risk }) => {
  const map = {
    'Low':    { bg: 'rgba(16,185,129,0.12)',  color: '#34d399',  border: 'rgba(16,185,129,0.25)' },
    'Medium': { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24',  border: 'rgba(245,158,11,0.25)' },
    'High':   { bg: 'rgba(239,68,68,0.12)',   color: '#f87171',  border: 'rgba(239,68,68,0.25)' },
  };
  const s = map[risk] || map['Low'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {risk}
    </span>
  );
};

export const HealthScore = ({ score, label, sub }) => {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 36, stroke = 6;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}/>
        <circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.22,1,0.36,1)' }}/>
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text1)', lineHeight: 1, letterSpacing: '-0.03em' }}>{score}</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text1)', marginTop: 4, textAlign: 'center' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center' }}>{sub}</div>
    </div>
  );
};

// ─── Today's Snapshot ─────────────────────────────────────────────────────────
export const TodaySnapshot = ({ checkIns = [], posts = [], polls = [], challenges = [], classes = [], allMemberships = [], todayCI }) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  const checkInsToday = todayCI ?? checkIns.filter(c => new Date(c.check_in_date) >= todayStart).length;

  const interactions = [
    ...posts.filter(p => new Date(p.created_date) >= todayStart),
    ...polls.flatMap(p => (p.voters || []).filter(() => new Date(p.created_date) >= todayStart)),
    ...challenges.flatMap(c => (c.participants || []).filter(() => new Date(c.start_date) >= todayStart)),
  ].length;

  const todayDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
  const classesToday = classes.filter(c => {
    const s = typeof c.schedule === 'string'
      ? c.schedule.toLowerCase()
      : JSON.stringify(c.schedule || '').toLowerCase();
    return s.includes(todayDay.toLowerCase());
  }).length;

  const activeUserIds = new Set(checkIns.filter(c => new Date(c.check_in_date) >= sevenDaysAgo).map(c => c.user_id));
  const inactive = allMemberships.filter(m => !activeUserIds.has(m.user_id)).length;

  const stats = [
    { label: 'Check-ins Today', value: checkInsToday, icon: Flame,         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.2)',   glow: 'rgba(245,158,11,0.15)',   trend: checkInsToday > 0 ? '+active' : 'quiet day' },
    { label: 'Interactions',    value: interactions,  icon: Zap,           color: '#00d4ff', bg: 'rgba(0,212,255,0.1)',     border: 'rgba(0,212,255,0.18)',   glow: 'rgba(0,212,255,0.12)',    trend: 'posts · polls · joins' },
    { label: 'Classes Running', value: classesToday,  icon: Activity,      color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.18)',  glow: 'rgba(16,185,129,0.12)',   trend: 'scheduled today' },
    { label: 'Inactive 7d+',    value: inactive,      icon: AlertTriangle, color: inactive > 0 ? '#ef4444' : '#10b981', bg: inactive > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: inactive > 0 ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.18)', glow: inactive > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', trend: inactive > 0 ? 'need re-engaging' : 'all active' },
  ];

  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
  const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ borderRadius: 18, background: 'var(--card)', border: '1px solid var(--border)', padding: '18px 18px 16px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,212,255,0.04)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles style={{ width: 15, height: 15, color: '#00d4ff' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em', lineHeight: 1 }}>Today's Snapshot</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginTop: 2 }}>{dayName}, {dateStr}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#34d399', letterSpacing: '0.06em' }}>LIVE</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {stats.map(({ label, value, icon: Icon, color, bg, border, glow, trend }) => (
          <div key={label} style={{ borderRadius: 14, background: bg, border: `1px solid ${border}`, padding: '12px 12px 10px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: glow, filter: 'blur(16px)', pointerEvents: 'none' }} />
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon style={{ width: 13, height: 13, color }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text1)', lineHeight: 1.2, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{trend}</div>
          </div>
        ))}
      </div>
    </div>
  );
};