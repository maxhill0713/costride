import React, { useState, useRef, useEffect } from 'react';
import { Trophy, CheckCircle, Dumbbell, TrendingUp, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_STYLE = { background: CARD_BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

const TIMEFRAMES = [
  { key: 'week',  label: '1W' },
  { key: 'month', label: '1M' },
  { key: 'all',   label: 'All' },
];

function TimeframeSlider({ value, onChange }) {
  const toggleRef = useRef(null);
  const pillRef = useRef(null);

  useEffect(() => {
    const toggle = toggleRef.current;
    const pill = pillRef.current;
    if (!toggle || !pill) return;
    const activeBtn = toggle.querySelector(`[data-tf="${value}"]`);
    if (!activeBtn) return;
    const toggleRect = toggle.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    pill.style.left = `${btnRect.left - toggleRect.left + 1.5}px`;
    pill.style.width = `${btnRect.width - 3}px`;
  }, [value]);

  return (
    <div
      ref={toggleRef}
      style={{
        position: 'relative', display: 'flex', flexShrink: 0,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 7, padding: 2,
      }}
    >
      <div
        ref={pillRef}
        style={{
          position: 'absolute', top: 2, height: 'calc(100% - 4px)',
          background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
          borderRadius: 5, boxShadow: '0 2px 0 #1a3fa8',
          transition: 'left 0.22s cubic-bezier(0.34,1.2,0.64,1), width 0.22s cubic-bezier(0.34,1.2,0.64,1)',
          pointerEvents: 'none', zIndex: 1,
        }}
      />
      {TIMEFRAMES.map(tf => (
        <button
          key={tf.key}
          data-tf={tf.key}
          onClick={() => onChange(tf.key)}
          style={{
            position: 'relative', zIndex: 2,
            padding: '5px 9px', borderRadius: 5,
            fontSize: 8.5, fontWeight: 700, cursor: 'pointer', border: 'none',
            background: 'transparent',
            color: value === tf.key ? '#fff' : '#475569',
            transition: 'color 0.12s',
            WebkitTapHighlightColor: 'transparent',
            whiteSpace: 'nowrap',
          }}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}

const TABS = [
  {
    id: 'checkins',
    label: 'Check-ins',
    icon: CheckCircle,
    accentRgb: '16,185,129',
    activeClass: 'bg-gradient-to-b from-green-400 via-green-500 to-green-600 text-white border-transparent shadow-[0_5px_0_0_#166534,inset_0_1px_0_rgba(255,255,255,0.2)]',
    inactiveClass: 'bg-slate-900/80 text-slate-400 border-slate-500/50 shadow-[0_5px_0_0_#172033,inset_0_1px_0_rgba(255,255,255,0.12)]',
    unit: 'check-ins',
    getVal: (m) => m.count,
    fmt: (v) => `${v}`,
  },
  {
    id: 'lifts',
    label: 'Lifts',
    icon: Dumbbell,
    accentRgb: '249,115,22',
    activeClass: 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white border-transparent shadow-[0_5px_0_0_#9a3412,inset_0_1px_0_rgba(255,255,255,0.2)]',
    inactiveClass: 'bg-slate-900/80 text-slate-400 border-slate-500/50 shadow-[0_5px_0_0_#172033,inset_0_1px_0_rgba(255,255,255,0.12)]',
    unit: 'lbs lifted',
    getVal: (m) => m.streak ?? m.count ?? 0,
    fmt: (v) => `${v}`,
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: TrendingUp,
    accentRgb: '129,140,248',
    activeClass: 'bg-gradient-to-b from-violet-400 via-violet-500 to-violet-600 text-white border-transparent shadow-[0_5px_0_0_#3730a3,inset_0_1px_0_rgba(255,255,255,0.2)]',
    inactiveClass: 'bg-slate-900/80 text-slate-400 border-slate-500/50 shadow-[0_5px_0_0_#172033,inset_0_1px_0_rgba(255,255,255,0.12)]',
    unit: 'kg gained',
    getVal: (m) => m.increase ?? 0,
    fmt: (v) => `+${v}kg`,
  },
];

const PODIUM_COLORS = [
  { color: 'rgba(255,215,0,0.9)',    border: 'rgba(255,215,0,0.22)',    ring: 'rgba(255,215,0,0.4)',    bg: 'rgba(255,215,0,0.07)'   },
  { color: 'rgba(200,170,100,0.85)', border: 'rgba(200,170,100,0.18)', ring: 'rgba(200,170,100,0.3)', bg: 'rgba(200,170,100,0.06)' },
  { color: 'rgba(180,120,60,0.85)',  border: 'rgba(180,120,60,0.18)',  ring: 'rgba(180,120,60,0.3)',  bg: 'rgba(180,120,60,0.06)'  },
];

export default function InlineLeaderboard({ view, setView, checkInLeaderboard, streakLeaderboard, progressLeaderboardWeek, progressLeaderboardMonth, progressLeaderboardAllTime }) {
  const [timeframe, setTimeframe] = useState('week');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const currentTab = TABS.find((t) => t.id === view) || TABS[0];

  const getList = () => {
    if (view === 'checkins') return checkInLeaderboard || [];
    if (view === 'lifts')    return streakLeaderboard || [];
    return (timeframe === 'week' ? progressLeaderboardWeek : timeframe === 'month' ? progressLeaderboardMonth : progressLeaderboardAllTime) || [];
  };

  const list = getList();
  const { getVal, fmt, unit } = currentTab;
  const initials = (n) => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  // Full ranked list (with position preserved)
  const rankedList = list.map((m, i) => ({ ...m, rank: i + 1 }));

  const podium = rankedList.slice(0, 3);

  // If searching, find matching entries anywhere in the full list
  // Otherwise show top 3 below podium
  const q = search.trim().toLowerCase();
  const restList = q
    ? rankedList.filter(m => (m.userName || '').toLowerCase().includes(q))
    : rankedList.slice(3, 6);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>

        {/* Header: big title left + compact slider right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Community Leaderboard
          </span>
          <TimeframeSlider value={timeframe} onChange={setTimeframe} />
        </div>

        {/* Category tabs */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {TABS.map(({ id, label, icon: Icon, activeClass, inactiveClass }) => (
            <button
              key={id}
              onClick={() => { setView(id); setSearch(''); }}
              className={`px-2 py-2.5 rounded-2xl font-bold text-xs transition-all duration-100 flex flex-col items-center gap-1 backdrop-blur-md border active:shadow-none active:translate-y-[5px] active:scale-95 transform-gpu ${view === id ? activeClass : inactiveClass}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: 'rgba(148,163,184,0.5)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 32px 7px 30px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10, color: '#e2e8f0',
              fontSize: 12, fontWeight: 500, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <X style={{ width: 12, height: 12, color: 'rgba(148,163,184,0.6)' }} />
            </button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, gap: 8 }}>
          <Trophy style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.1)' }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.2)', margin: 0 }}>No rankings yet</p>
        </div>
      ) : (
        <>
          {/* Podium — hide during search */}
          {!q && <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, padding: '20px 14px 14px' }}>
            {[
              { data: podium[1], pcIdx: 1, lift: 0  },
              { data: podium[0], pcIdx: 0, lift: 18 },
              { data: podium[2], pcIdx: 2, lift: 0  },
            ].filter(p => p.data).map(({ data, pcIdx, lift }) => {
              const pc = PODIUM_COLORS[pcIdx];
              const isFirst = pcIdx === 0;
              const avatarSz = isFirst ? 48 : 40;
              return (
                <div
                  key={pcIdx}
                  style={{
                    flex: isFirst ? '0 0 116px' : '0 0 100px',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: 'rgba(18,20,36,0.92)',
                    border: `1px solid ${pc.border}`,
                    marginBottom: lift,
                  }}
                >
                  <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${pc.color}, transparent)`, opacity: 0.6 }} />
                  <div style={{ padding: isFirst ? '16px 10px 16px' : '14px 10px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isFirst ? 7 : 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: pc.color, opacity: 0.7 }}>
                      #{pcIdx + 1}
                    </span>
                    <div style={{
                      width: avatarSz, height: avatarSz, borderRadius: '50%',
                      background: pc.bg, border: `${isFirst ? 2 : 1.5}px solid ${pc.ring}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', fontSize: isFirst ? 15 : 13, fontWeight: 900, color: pc.color,
                    }}>
                      {data.userAvatar
                        ? <img src={data.userAvatar} alt={data.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : initials(data.userName)
                      }
                    </div>
                    <p style={{ color: isFirst ? '#fff' : '#cbd5e1', fontWeight: isFirst ? 900 : 800, fontSize: isFirst ? 12 : 11, margin: 0, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isFirst ? 100 : 88 }}>
                      {data.userName || '—'}
                    </p>
                    <p style={{ fontSize: isFirst ? 26 : 20, fontWeight: 900, color: pc.color, lineHeight: 1, letterSpacing: '-0.03em', margin: 0 }}>
                      {fmt(getVal(data))}
                    </p>
                    <p style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                      {unit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>}

          {/* Rows below podium / search results */}
          {restList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 10px 12px' }}>
              {restList.map((m, i) => {
                const opacity = Math.max(0.45, 1 - i * 0.12);
                const isHighlighted = q && (m.userName || '').toLowerCase().includes(q);
                return (
                  <div 
                    key={m.userId || i} 
                    onClick={() => navigate(createPageUrl('UserProfile') + '?id=' + m.userId)}
                    style={{
                      ...CARD_STYLE, borderRadius: 12, padding: '8px 10px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      border: isHighlighted ? `1px solid rgba(${currentTab.accentRgb},0.4)` : '1px solid transparent',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.transform = 'scale(1.01)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.transform = '';
                    }}
                  >
                    <div style={{ width: 24, flexShrink: 0, textAlign: 'center', fontSize: 12, fontWeight: 900, color: `rgba(255,255,255,${opacity * 0.55})`, fontVariantNumeric: 'tabular-nums' }}>#{m.rank}</div>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,${opacity * 0.1})`, color: `rgba(255,255,255,${opacity * 0.6})` }}>
                      {m.userAvatar ? <img src={m.userAvatar} alt={m.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(m.userName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: `rgba(255,255,255,${opacity * 0.9})`, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.userName || '—'}</p>
                    </div>
                    <div style={{ flexShrink: 0, padding: '3px 8px', borderRadius: 7, background: `rgba(${currentTab.accentRgb},0.1)`, border: `1px solid rgba(${currentTab.accentRgb},0.2)`, fontSize: 12, fontWeight: 800, color: `rgba(255,255,255,${opacity * 0.85})` }}>
                      {fmt(getVal(m))}
                    </div>
                  </div>
                );
              })}
              {q && restList.length === 0 && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '12px 0', margin: 0 }}>No members found</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}