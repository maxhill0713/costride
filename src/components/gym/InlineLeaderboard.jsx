import React, { useState, useRef, useEffect } from 'react';
import { Trophy, CheckCircle, Dumbbell, TrendingUp } from 'lucide-react';

const CARD_BG = 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)';
const CARD_STYLE = { background: CARD_BG, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

const TIMEFRAMES = [
  { key: 'week',  label: '1 Week' },
  { key: 'month', label: '1 Month' },
  { key: 'all',   label: 'All Time' },
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
        borderRadius: 7, padding: 1.5,
      }}
    >
      <div
        ref={pillRef}
        style={{
          position: 'absolute', top: 1.5, height: 'calc(100% - 3px)',
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
            padding: '3px 8px', borderRadius: 5,
            fontSize: 9, fontWeight: 700, cursor: 'pointer', border: 'none',
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

export default function InlineLeaderboard({ view, setView, checkInLeaderboard, streakLeaderboard, progressLeaderboardWeek, progressLeaderboardMonth, progressLeaderboardAllTime }) {
  const [timeframe, setTimeframe] = useState('week');

  const currentTab = TABS.find((t) => t.id === view) || TABS[0];

  const getList = () => {
    if (view === 'checkins') return checkInLeaderboard || [];
    if (view === 'lifts')    return streakLeaderboard || [];
    return (timeframe === 'week' ? progressLeaderboardWeek : timeframe === 'month' ? progressLeaderboardMonth : progressLeaderboardAllTime) || [];
  };

  const list = getList();
  const { getVal, fmt, unit } = currentTab;
  const initials = (n) => (n || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const podium   = list.slice(0, 3);
  const restList = list.slice(3, 10);

  const PODIUM_COLORS = [
    { color: '#FFD700', bg: 'rgba(255,215,0,0.08)',   border: 'rgba(255,215,0,0.3)',   ring: 'rgba(255,215,0,0.6)',   shadow: 'rgba(255,215,0,0.2)'   },
    { color: '#C8D8EC', bg: 'rgba(200,216,236,0.06)', border: 'rgba(200,216,236,0.25)', ring: 'rgba(200,216,236,0.5)', shadow: 'rgba(200,216,236,0.15)' },
    { color: '#E8904A', bg: 'rgba(232,144,74,0.07)',  border: 'rgba(232,144,74,0.28)', ring: 'rgba(232,144,74,0.55)', shadow: 'rgba(232,144,74,0.15)'  },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
      borderRadius: 18,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top shine — matching challenge cards */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 1, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)',
      }} />

      {/* accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,rgba(${currentTab.accentRgb},0.7),transparent)` }} />

      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        {/* Header: title + slider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            Community Leaderboard
          </span>
          <TimeframeSlider value={timeframe} onChange={setTimeframe} />
        </div>

        {/* Category tabs */}
        <div className="grid grid-cols-3 gap-2">
          {TABS.map(({ id, label, icon: Icon, activeClass, inactiveClass }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`px-2 py-2.5 rounded-2xl font-bold text-xs transition-all duration-100 flex flex-col items-center gap-1 backdrop-blur-md border active:shadow-none active:translate-y-[5px] active:scale-95 transform-gpu ${view === id ? activeClass : inactiveClass}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, gap: 8 }}>
          <Trophy style={{ width: 20, height: 20, color: 'rgba(255,255,255,0.1)' }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.2)', margin: 0 }}>No rankings yet</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, padding: '16px 14px 8px' }}>
            {[
              { data: podium[1], pcIdx: 1, heightBoost: 0  },
              { data: podium[0], pcIdx: 0, heightBoost: 20 },
              { data: podium[2], pcIdx: 2, heightBoost: 0  },
            ].filter(p => p.data).map(({ data, pcIdx, heightBoost }) => {
              const pc = PODIUM_COLORS[pcIdx];
              const isFirst = pcIdx === 0;
              const avatarSz = isFirst ? 44 : 34;
              return (
                <div key={pcIdx} style={{ flex: isFirst ? '0 0 100px' : '0 0 82px', borderRadius: 14, overflow: 'hidden', ...CARD_STYLE, border: `1px solid ${pc.border}`, boxShadow: `0 0 0 1px ${pc.border}, 0 4px 16px rgba(0,0,0,0.5)`, marginBottom: heightBoost }}>
                  <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${pc.color}, transparent)` }} />
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: isFirst ? 10 : 8, paddingBottom: 2 }}>
                    <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: pc.color, background: pc.bg, border: `1px solid ${pc.border}`, borderRadius: 99, padding: '1px 6px' }}>#{pcIdx + 1}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 2px' }}>
                    <div style={{ width: avatarSz + 4, height: avatarSz + 4, borderRadius: '50%', border: `2px solid ${pc.ring}`, boxShadow: `0 0 8px ${pc.shadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: CARD_BG, fontSize: isFirst ? 14 : 11, fontWeight: 900, color: pc.color }}>
                      {data.userAvatar ? <img src={data.userAvatar} alt={data.userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(data.userName)}
                    </div>
                  </div>
                  <p style={{ color: '#fff', fontWeight: 900, textAlign: 'center', fontSize: isFirst ? 10 : 8.5, lineHeight: 1.2, padding: '0 6px 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{data.userName || '—'}</p>
                  <div style={{ textAlign: 'center', padding: `2px 6px ${isFirst ? 10 : 8}px` }}>
                    <p style={{ fontSize: isFirst ? 18 : 14, fontWeight: 900, color: pc.color, lineHeight: 1, letterSpacing: '-0.03em', margin: 0 }}>{fmt(getVal(data))}</p>
                    <p style={{ fontSize: 6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{unit}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rows 4–10 */}
          {restList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 10px 12px' }}>
              {restList.map((m, i) => {
                const globalRank = i + 4;
                const opacity = Math.max(0.35, 1 - i * 0.1);
                return (
                  <div key={m.userId || i} style={{ ...CARD_STYLE, borderRadius: 12, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, flexShrink: 0, textAlign: 'center', fontSize: 12, fontWeight: 900, color: `rgba(255,255,255,${opacity * 0.55})`, fontVariantNumeric: 'tabular-nums' }}>{globalRank}</div>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}