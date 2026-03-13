import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, Trophy, Zap, TrendingUp, Users2 } from 'lucide-react';

// ─── Data Config ──────────────────────────────────────────────────────────────
const LIFTS = [
  { id: 'all',      label: 'All Lifts',      short: 'All',    emoji: '⚡', color: '#38bdf8', glow: 'rgba(56,189,248,0.3)',   keywords: [] },
  { id: 'squat',    label: 'Squat',          short: 'Squat',  emoji: '🦵', color: '#f59e0b', glow: 'rgba(245,158,11,0.3)',   keywords: ['squat','back squat','front squat'] },
  { id: 'bench',    label: 'Bench Press',    short: 'Bench',  emoji: '💪', color: '#0ea5e9', glow: 'rgba(14,165,233,0.3)',   keywords: ['bench','bench press','chest press'] },
  { id: 'deadlift', label: 'Deadlift',       short: 'Dead',   emoji: '🏋️', color: '#f43f5e', glow: 'rgba(244,63,94,0.3)',   keywords: ['deadlift','dead lift'] },
  { id: 'ohp',      label: 'Overhead Press', short: 'OHP',    emoji: '☝️', color: '#10b981', glow: 'rgba(16,185,129,0.3)',   keywords: ['overhead press','ohp','shoulder press','military press'] },
  { id: 'row',      label: 'Barbell Row',    short: 'Row',    emoji: '🔁', color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)',   keywords: ['barbell row','bent over row','row'] },
];
const TIME_FILTERS = [
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all',   label: 'All Time' },
];

function matchLift(name = '') {
  const lower = name.toLowerCase().trim();
  for (const l of LIFTS.filter(l => l.id !== 'all'))
    if (l.keywords.some(k => lower.includes(k))) return l.id;
  return null;
}
function filterByTime(sets, t) {
  const now = Date.now();
  if (t === 'week')  return sets.filter(s => now - new Date(s.logged_date || s.created_date || 0) < 7  * 86400000);
  if (t === 'month') return sets.filter(s => now - new Date(s.logged_date || s.created_date || 0) < 30 * 86400000);
  return sets;
}
function buildLeaderboard(sets, liftId) {
  const best = {}, hist = {};
  sets.forEach(s => {
    const lId = matchLift(s.exercise_name || s.exercise || s.name || '');
    if (liftId !== 'all' && lId !== liftId) return;
    if (!lId) return;
    const w = parseFloat(s.weight || s.max_weight || 0); if (!w) return;
    const uid = s.user_id;
    if (!best[uid] || w > best[uid].weight)
      best[uid] = { user_id: uid, user_name: s.user_name || s.full_name || 'Athlete', weight: w, unit: s.unit || s.weight_unit || 'kg' };
    if (!hist[uid]) hist[uid] = [];
    hist[uid].push({ weight: w, date: s.logged_date || s.created_date, unit: s.unit || 'kg' });
  });
  Object.keys(best).forEach(uid => {
    best[uid].history = (hist[uid] || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  });
  return Object.values(best).sort((a, b) => b.weight - a.weight);
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  const sel = options.find(o => o.id === value);
  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: 'rgba(15,30,60,0.9)',
        outline: '1px solid rgba(255,255,255,0.1)',
        color: '#e2e8f0', fontSize: 13, fontWeight: 700,
        whiteSpace: 'nowrap', fontFamily: 'inherit',
        backdropFilter: 'blur(20px)',
      }}>
        {sel?.label}
        <ChevronDown style={{ width: 12, height: 12, color: '#475569', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200,
          minWidth: 175,
          background: 'linear-gradient(160deg,#0d1e3d 0%,#060e1f 100%)',
          border: '1px solid rgba(56,189,248,0.15)',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          {options.map((o, i) => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false); }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '12px 16px', border: 'none', cursor: 'pointer',
              background: value === o.id ? 'rgba(56,189,248,0.08)' : 'transparent',
              color: value === o.id ? '#38bdf8' : '#94a3b8',
              fontSize: 13, fontWeight: value === o.id ? 700 : 500,
              borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              fontFamily: 'inherit', transition: 'all 0.12s',
            }}>
              {o.label}
              {value === o.id && <span style={{ fontSize: 11 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Rank Medal ───────────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  const medals = ['🥇', '🥈', '🥉'];
  if (rank === 1) return (
    <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 20 }}>🔥</span>
    </div>
  );
  if (rank <= 3) return (
    <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 18 }}>{medals[rank - 1]}</span>
    </div>
  );
  return (
    <div style={{
      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: 12, fontWeight: 800, color: '#2d4a6e', letterSpacing: '-0.02em',
    }}>
      #{rank}
    </div>
  );
}

// ─── SVG Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ history, color }) {
  if (!history || history.length < 2) return null;
  const W = 340, H = 88, PL = 6, PR = 6, PT = 20, PB = 22;
  const ws = history.map(h => h.weight);
  const mn = Math.min(...ws) * 0.94, mx = Math.max(...ws) * 1.03;
  const tx = i => PL + (i / (history.length - 1)) * (W - PL - PR);
  const ty = w => PT + (1 - (w - mn) / (mx - mn)) * (H - PT - PB);
  const pts = history.map((h, i) => ({ x: tx(i), y: ty(h.weight), ...h }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length-1].x.toFixed(1)},${H - PB} L${pts[0].x.toFixed(1)},${H - PB} Z`;
  const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const showIdx = new Set([0, pts.length - 1]);
  if (pts.length > 3) showIdx.add(Math.floor(pts.length / 2));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={`aG_${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`lG_${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Baseline */}
      <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      {/* Area */}
      <path d={area} fill={`url(#aG_${color.replace('#','')})`} />
      {/* Glow line */}
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeOpacity="0.25" strokeLinecap="round" filter="url(#glow)" />
      {/* Main line */}
      <path d={line} fill="none" stroke={`url(#lG_${color.replace('#','')})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {pts.map((p, i) => (
        <g key={i}>
          {showIdx.has(i) && (
            <>
              <circle cx={p.x} cy={p.y} r={5} fill={color} opacity="0.2" />
              <circle cx={p.x} cy={p.y} r={3} fill={color} stroke="#07090f" strokeWidth={1.5} />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#e2e8f0" fontSize={9} fontWeight="800" fontFamily="Sora,sans-serif">{p.weight}</text>
            </>
          )}
        </g>
      ))}
      {/* X labels */}
      <text x={pts[0].x} y={H - 5} textAnchor="start" fill="#2d4a6e" fontSize={9} fontFamily="Sora,sans-serif" fontWeight="600">{fmt(pts[0].date)}</text>
      <text x={pts[pts.length - 1].x} y={H - 5} textAnchor="end" fill="#2d4a6e" fontSize={9} fontFamily="Sora,sans-serif" fontWeight="600">Today</text>
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Community() {
  const [activeLift, setActiveLift] = useState('bench');
  const [timeFilter, setTimeFilter] = useState('week');

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser, staleTime: 5 * 60 * 1000,
  });
  const gymName = gymMemberships[0]?.gym_name || 'Your Gym';

  const { data: allSets = [], isLoading } = useQuery({
    queryKey: ['communityWorkoutSets'],
    queryFn: () => base44.entities.WorkoutSet.list(),
    staleTime: 3 * 60 * 1000,
  });

  const filteredSets = useMemo(() => filterByTime(allSets, timeFilter), [allSets, timeFilter]);
  const leaderboard  = useMemo(() => buildLeaderboard(filteredSets, activeLift), [filteredSets, activeLift]);
  const liftMeta     = LIFTS.find(l => l.id === activeLift);

  const myEntry  = leaderboard.find(l => l.user_id === currentUser?.id);
  const myRank   = myEntry ? leaderboard.findIndex(l => l.user_id === currentUser?.id) + 1 : null;
  const total    = leaderboard.length;
  const myPct    = myRank && total > 1 ? Math.round(((total - myRank) / (total - 1)) * 100) : null;

  const myAllTimeBest = useMemo(() => allSets
    .filter(s => s.user_id === currentUser?.id && (activeLift === 'all' ? matchLift(s.exercise_name || '') : matchLift(s.exercise_name || '') === activeLift))
    .reduce((b, s) => Math.max(b, parseFloat(s.weight || 0)), 0), [allSets, currentUser?.id, activeLift]);

  const todayLifters = useMemo(() =>
    new Set(allSets.filter(s => Date.now() - new Date(s.logged_date || s.created_date || 0) < 86400000).map(s => s.user_id)).size,
  [allSets]);

  const avgWeight = useMemo(() => {
    const ws = filteredSets
      .filter(s => activeLift === 'all' ? matchLift(s.exercise_name || '') : matchLift(s.exercise_name || '') === activeLift)
      .map(s => parseFloat(s.weight || 0)).filter(Boolean);
    return ws.length ? Math.round(ws.reduce((a, b) => a + b, 0) / ws.length) : 0;
  }, [filteredSets, activeLift]);

  const topThisWeek = useMemo(() => {
    const ws = filterByTime(allSets, 'week')
      .filter(s => activeLift === 'all' ? matchLift(s.exercise_name || '') : matchLift(s.exercise_name || '') === activeLift)
      .map(s => parseFloat(s.weight || 0)).filter(Boolean);
    return ws.length ? Math.max(...ws) : 0;
  }, [allSets, activeLift]);

  const unit      = myEntry?.unit || leaderboard[0]?.unit || 'kg';
  const myHistory = myEntry?.history || [];
  const timeLabel = TIME_FILTERS.find(t => t.id === timeFilter)?.label.toLowerCase();

  const pctColor = myPct >= 90 ? '#f59e0b' : myPct >= 75 ? '#10b981' : '#38bdf8';
  const pctLabel = myPct !== null ? `Top ${100 - myPct}%` : null;

  const cycleLift = () => {
    const idx = LIFTS.findIndex(l => l.id === activeLift);
    setActiveLift(LIFTS[(idx + 1) % LIFTS.length].id);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cl-card {
          animation: fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both;
          border-radius: 22px;
          background: linear-gradient(150deg, rgba(11,22,46,0.97) 0%, rgba(5,10,22,0.99) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          overflow: hidden;
          position: relative;
        }
        .cl-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%);
          pointer-events: none;
        }
        .lb-row { transition: background 0.15s ease; cursor: default; }
        .lb-row:hover { background: rgba(255,255,255,0.025) !important; }
        .compare-btn { transition: all 0.2s ease; }
        .compare-btn:hover {
          border-color: rgba(56,189,248,0.3) !important;
          background: rgba(56,189,248,0.04) !important;
          color: #fff !important;
        }
        .compare-btn:hover .caret { color: #38bdf8 !important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(14,50,100,0.5) 0%, transparent 70%), linear-gradient(175deg, #07090f 0%, #090d1a 50%, #07090f 100%)',
        fontFamily: "'Sora', system-ui, sans-serif",
        color: '#e2e8f0',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 48px' }}>

          {/* ═══ HEADER ═══ */}
          <div style={{ padding: '30px 20px 22px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, animation: 'fadeUp 0.4s ease both' }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', margin: 0, lineHeight: 1 }}>
                Community<br/>Lifts
              </h1>
              <p style={{ fontSize: 12, color: '#2d4a6e', margin: '8px 0 0', fontWeight: 600, letterSpacing: '0.02em' }}>{gymName.toUpperCase()}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4, flexShrink: 0 }}>
              <Dropdown options={LIFTS}        value={activeLift} onChange={setActiveLift} />
              <Dropdown options={TIME_FILTERS} value={timeFilter} onChange={setTimeFilter} />
            </div>
          </div>

          <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* ═══ PERSONAL PERFORMANCE CARD ═══ */}
            <div className="cl-card" style={{ animationDelay: '0.05s' }}>
              {/* Accent line using lift colour */}
              <div style={{ height: 2, background: `linear-gradient(90deg, transparent 0%, ${liftMeta.color} 40%, ${liftMeta.color} 60%, transparent 100%)`, opacity: 0.7 }} />

              <div style={{ padding: '22px 24px 24px' }}>
                {myEntry ? (
                  <>
                    {/* Lift label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: liftMeta.color, boxShadow: `0 0 8px ${liftMeta.color}` }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{liftMeta.label}</span>
                    </div>

                    {/* Big weight */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 16 }}>
                      <span style={{ fontSize: 60, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>
                        {myEntry.weight}
                      </span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#334155', marginBottom: 8 }}>{unit}</span>
                    </div>

                    {/* Status row */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 20 }}>
                      {pctLabel && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                          <Trophy style={{ width: 14, height: 14, color: pctColor, flexShrink: 0 }} />
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{pctLabel} at {gymName}</span>
                        </div>
                      )}
                      {myRank && (
                        <span style={{ fontSize: 13, color: '#475569', fontWeight: 600, paddingLeft: 21 }}>Rank #{myRank} of {total}</span>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 18 }} />

                    {/* PB row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#2d4a6e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>PB</span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#e2e8f0', letterSpacing: '-0.02em' }}>{myAllTimeBest} {unit}</span>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '16px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{liftMeta.emoji}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#e2e8f0', marginBottom: 5 }}>No {liftMeta.label} data yet</div>
                    <div style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>Log a {liftMeta.label} workout to appear here</div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ LEADERBOARD ═══ */}
            <div className="cl-card" style={{ animationDelay: '0.12s' }}>
              {/* Header */}
              <div style={{ padding: '18px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                  {liftMeta.label} Leaderboard
                </span>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2d4a6e', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 99, padding: '3px 10px' }}>
                  {total} athletes
                </div>
              </div>

              {/* Rows */}
              {isLoading ? (
                <div style={{ padding: 36, textAlign: 'center', color: '#2d4a6e', fontSize: 13 }}>Loading leaderboard…</div>
              ) : total === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#2d4a6e', fontSize: 13 }}>No data for this period</div>
              ) : (
                leaderboard.slice(0, 10).map((entry, i) => {
                  const isMe = entry.user_id === currentUser?.id;
                  const rank = i + 1;
                  const gain = isMe && entry.history?.length > 1
                    ? +(entry.weight - entry.history[entry.history.length - 2]?.weight).toFixed(1)
                    : null;

                  return (
                    <div key={entry.user_id || i} className="lb-row" style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                      borderBottom: i < Math.min(total, 10) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: isMe ? 'rgba(56,189,248,0.06)' : 'transparent',
                      borderLeft: isMe ? `3px solid ${liftMeta.color}` : '3px solid transparent',
                    }}>
                      <RankBadge rank={rank} />

                      {/* Avatar */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: isMe
                          ? `linear-gradient(135deg, ${liftMeta.color}40, ${liftMeta.color}15)`
                          : 'rgba(255,255,255,0.06)',
                        border: `2px solid ${isMe ? liftMeta.color : 'rgba(255,255,255,0.09)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 900,
                        color: isMe ? liftMeta.color : '#3a4e6a',
                        boxShadow: isMe ? `0 0 16px ${liftMeta.glow}` : 'none',
                        overflow: 'hidden',
                      }}>
                        {entry.avatar_url
                          ? <img src={entry.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (entry.user_name || 'A')[0].toUpperCase()
                        }
                      </div>

                      {/* Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: 15, fontWeight: isMe ? 800 : 600,
                          color: isMe ? '#fff' : '#94a3b8',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                        }}>
                          {isMe ? 'You' : entry.user_name}
                        </span>
                      </div>

                      {/* Weight + delta */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                          <span style={{
                            fontSize: isMe ? 20 : 18, fontWeight: 900,
                            color: isMe ? '#fff' : rank <= 3 ? '#cbd5e1' : '#475569',
                            letterSpacing: '-0.04em',
                          }}>{entry.weight}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#2d4a6e' }}>{entry.unit || 'kg'}</span>
                        </div>
                        {gain > 0 && (
                          <span style={{
                            fontSize: 10, fontWeight: 800, color: liftMeta.color,
                            background: `${liftMeta.color}15`,
                            border: `1px solid ${liftMeta.color}30`,
                            borderRadius: 99, padding: '1px 7px',
                          }}>
                            +{gain} this week
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ═══ COMMUNITY ACTIVITY ═══ */}
            <div className="cl-card" style={{ padding: '20px 24px', animationDelay: '0.19s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Users2 style={{ width: 14, height: 14, color: '#2d4a6e' }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Community Activity</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: 0, alignItems: 'stretch' }}>
                {/* Col 1 */}
                <div style={{ paddingRight: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2d4a6e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Today</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4 }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>{todayLifters}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>lifters</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2d4a6e' }}>{avgWeight} {unit} avg</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99 }} />

                {/* Col 2 */}
                <div style={{ padding: '0 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2d4a6e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Avg Weight</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>{avgWeight}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{unit}</span>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2d4a6e' }}>{timeLabel}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99 }} />

                {/* Col 3 */}
                <div style={{ paddingLeft: 20, textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2d4a6e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, lineHeight: 1.4 }}>Top {liftMeta.short}<br/>This Week</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: topThisWeek ? 28 : 22, fontWeight: 900, color: topThisWeek ? '#fff' : '#2d4a6e', letterSpacing: '-0.05em', lineHeight: 1 }}>
                      {topThisWeek || '—'}
                    </span>
                    {topThisWeek > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{unit}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ PROGRESS CHART ═══ */}
            {myHistory.length >= 2 && (
              <div className="cl-card" style={{ padding: '20px 22px 16px', animationDelay: '0.26s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <TrendingUp style={{ width: 14, height: 14, color: liftMeta.color }} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Your Progress</span>
                    </div>
                    {myHistory[0]?.date && (
                      <span style={{ fontSize: 11, color: '#2d4a6e', fontWeight: 600 }}>
                        Since {new Date(myHistory[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 800, color: liftMeta.color,
                    background: `${liftMeta.color}12`, border: `1px solid ${liftMeta.color}25`,
                    borderRadius: 8, padding: '4px 10px',
                  }}>
                    {liftMeta.label}
                  </div>
                </div>
                <Sparkline history={myHistory} color={liftMeta.color} />
              </div>
            )}

            {/* ═══ COMPARE BUTTON ═══ */}
            <button onClick={cycleLift} className="compare-btn" style={{
              width: '100%', padding: '18px', borderRadius: 22, cursor: 'pointer',
              background: 'linear-gradient(150deg, rgba(11,22,46,0.97) 0%, rgba(5,10,22,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#94a3b8', fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'inherit',
              animation: 'fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) 0.33s both',
            }}>
              Compare Other Lifts
              <ChevronRight className="caret" style={{ width: 15, height: 15, color: '#475569', transition: 'color 0.2s' }} />
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
