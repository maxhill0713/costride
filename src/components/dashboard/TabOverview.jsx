import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Users, ArrowUpRight, Activity,
  AlertTriangle, Flame, TrendingUp, ChevronRight, ChevronDown,
  Dumbbell,
} from 'lucide-react';

/* ─── TOKENS ─────────────────────────────────────────────── */
const C = {
  bg:       '#000000',
  sidebar:  '#0f0f12',
  card:     '#141416',
  brd:      '#222226',
  t1:       '#ffffff',
  t2:       '#8a8a94',
  t3:       '#444450',
  cyan:     '#4d7fff',
  cyanDim:  'rgba(77,127,255,0.14)',
  cyanBrd:  'rgba(77,127,255,0.38)',
  red:      '#ff4d6d',
  redDim:   'rgba(255,77,109,0.15)',
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,0.15)',
  green:    '#22c55e',
  greenDim: 'rgba(34,197,94,0.12)',
};
const FONT = "'DM Sans', 'Segoe UI', sans-serif";

/* ─── shared timeline constants ─────────────────────────── */
// 4.5 hours visible — 80% reduction then +20% increase
const TIMELINE_PX_PER_MIN = 1.1;
const TIMELINE_VISIBLE_H  = Math.round(4.5 * 60 * TIMELINE_PX_PER_MIN);
const TIMELINE_VIEWPORT_H = Math.round(TIMELINE_VISIBLE_H * 0.80 * 1.20); // +20% taller

/* ─── CLASS COLOR BY TYPE ─────────────────────────────────── */
function classTypeColor(name = '') {
  const n = name.toLowerCase();
  if (n.includes('hiit') || n.includes('boxing') || n.includes('kick')) return '#f59e0b';
  if (n.includes('yoga') || n.includes('pilates') || n.includes('flow')) return '#14b8a6';
  if (n.includes('strength') || n.includes('weight') || n.includes('conditioning')) return '#ff4d6d';
  if (n.includes('spin') || n.includes('cycle') || n.includes('cardio')) return '#6366f1';
  if (n.includes('open') || n.includes('gym') || n.includes('free')) return '#4d7fff';
  return '#8b5cf6';
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ─── MINI COMPONENTS ─────────────────────────────────────── */
function Av({ name, src, size = 28 }) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444'];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[idx], border: `1.5px solid ${C.card}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name || '?')[0].toUpperCase()}
    </div>
  );
}

function MiniSparkline({ data = [], color = C.cyan }) {
  const vals = data.length ? data : [0];
  return (
    <ResponsiveContainer width="100%" height={28}>
      <AreaChart data={vals.map(v => ({ v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#spark-grad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Donut({ pct, size = 58, stroke = 5, color = C.cyan }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size < 50 ? 9 : 10, fontWeight: 700, color: C.t1,
      }}>{pct}%</div>
    </div>
  );
}

/* ─── KPI CARD ───────────────────────────────────────────── */
function KpiCard({ label, value, sub, subColor, delta, donutPct, donutColor, sparkData, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '7px 14px 8px' }}>
      <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</div>
      {delta != null && (
        <div style={{ fontSize: 11, color: delta >= 0 ? C.cyan : C.red, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 2 }}>
          <ArrowUpRight style={{ width: 10, height: 10, transform: delta < 0 ? 'rotate(90deg)' : 'none' }} />
          {delta >= 0 ? '+' : ''}{delta}%
        </div>
      )}
      {sub && <div style={{ fontSize: 10.5, color: subColor || C.t3, marginTop: 1, marginBottom: 2 }}>{sub}</div>}
      {donutPct != null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <div />
          <Donut pct={donutPct} size={40} stroke={4} color={donutColor || C.cyan} />
        </div>
      )}
      {sparkData && <MiniSparkline data={sparkData} color={C.cyan} />}
      {children}
    </div>
  );
}

/* ─── AT-RISK MEMBER ROW ──────────────────────────────────── */
function AtRiskRow({ member, avatarMap = {} }) {
  const days = member.daysSinceLastCheckIn ?? member.days ?? '?';
  const isHigh = typeof days === 'number' && days >= 21;
  const riskLabel = isHigh ? 'High' : 'Medium';
  const riskColor = isHigh ? C.red : C.amber;
  const riskBg    = isHigh ? C.redDim : C.amberDim;
  const riskBdr   = isHigh ? 'rgba(255,77,109,0.28)' : 'rgba(245,158,11,0.28)';
  const name = member.user_name || member.name || 'Member';
  const avatar = avatarMap[member.user_id] || member.avatar_url || null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Av name={name} src={avatar} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 10.5, color: C.t3 }}>{typeof days === 'number' ? `${days} days away` : 'Inactive'}</div>
      </div>
      <span style={{ fontSize: 9.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', flexShrink: 0, color: riskColor, background: riskBg, border: `1px solid ${riskBdr}` }}>
        {riskLabel}
      </span>
    </div>
  );
}

/* ─── NOTIFICATION TICKER ─────────────────────────────────── */
function NotificationTicker({ posts, events, challenges, checkIns, gymId, classes }) {
  const WINDOW_MS = 60 * 60 * 1000;

  const notifications = useMemo(() => {
    const recentMs = Date.now() - WINDOW_MS;
    const isRecent = (dateStr) => {
      if (!dateStr) return false;
      let d = new Date(dateStr);
      if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        d = new Date(dateStr + 'Z');
      }
      return d.getTime() > recentMs;
    };

    const notifs = [];

    const todayDay = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
    const todayClasses = (classes || []).filter(cls => {
      if (!cls.schedule || cls.schedule.length === 0) return true;
      return cls.schedule.some(s => s.day?.toLowerCase() === todayDay.toLowerCase());
    });
    const classCount = todayClasses.length;
    const eventCount = (events || []).length;
    if (classCount > 0) notifs.push(`${classCount} class${classCount !== 1 ? 'es' : ''} scheduled today`);
    if (eventCount > 0) notifs.push(`${eventCount} event${eventCount !== 1 ? 's' : ''} today`);

    const recentPosts = (posts || []).filter(p =>
      !p.is_hidden && p.share_with_community && !p.post_type &&
      (!gymId || p.gym_id === gymId) && isRecent(p.created_date || p.created_at)
    );
    if (recentPosts.length === 1) notifs.push('1 member just posted to the community');
    else if (recentPosts.length > 1) notifs.push(`${recentPosts.length} members just posted to the community`);

    (events || []).forEach(ev => {
      if (!ev.title) return;
      const count = (ev.participants || []).length;
      if (count > 0 && isRecent(ev.updated_date || ev.updated_at)) {
        const label = ev.title.length > 34 ? ev.title.slice(0, 32) + '…' : ev.title;
        notifs.push(`${count} member${count !== 1 ? 's' : ''} just joined ${label}`);
      }
    });

    const recentCI = (checkIns || []).filter(c =>
      (!gymId || c.gym_id === gymId) &&
      isRecent(c.check_in_date || c.created_date || c.created_at)
    );
    if (recentCI.length === 1) notifs.push('1 member just checked in');
    else if (recentCI.length > 1) notifs.push(`${recentCI.length} members just checked in`);

    const activeChallenge = (challenges || []).find(c => c.status === 'active');
    if (activeChallenge) {
      const joined = (activeChallenge.participants || []).length;
      if (joined > 0) notifs.push(`${joined} member${joined !== 1 ? 's' : ''} active in ${activeChallenge.title}`);
    }

    return notifs;
  }, [posts, events, challenges, checkIns, gymId, classes]);

  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (notifications.length <= 1) return;
    const id = setInterval(() => {
      const prev = indexRef.current;
      const next = (prev + 1) % notifications.length;
      indexRef.current = next;
      setPrevIndex(prev);
      setIndex(next);
      setTransitioning(true);
      setTimeout(() => { setPrevIndex(null); setTransitioning(false); }, 800);
    }, 5000);
    return () => clearInterval(id);
  }, [notifications.length]);

  if (!notifications.length) return null;

  return (
    <>
      <style>{`
        @keyframes notifSlideOut {
          from { transform: translateX(0);     opacity: 1; }
          to   { transform: translateX(-110%); opacity: 0; }
        }
        @keyframes notifSlideInR {
          from { transform: translateX(110%);  opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
      {/* Outer wrapper: takes up the flex-1 space, centres the narrowed ticker */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Inner ticker: 80% of available width, centred */}
        <div style={{
          width: '80%',
          height: 37,
          background: 'rgba(77,127,255,0.11)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          {transitioning && prevIndex !== null && (
            <span style={{
              position: 'absolute', left: 0, right: 0,
              textAlign: 'center',
              fontSize: 11.5, fontWeight: 600, color: '#93c5fd',
              fontFamily: FONT, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
              padding: '0 14px', boxSizing: 'border-box',
              animation: 'notifSlideOut 0.8s cubic-bezier(0.4,0,0.2,1) forwards',
            }}>
              {notifications[prevIndex]}
            </span>
          )}
          <span
            key={index}
            style={{
              position: 'absolute', left: 0, right: 0,
              textAlign: 'center',
              fontSize: 11.5, fontWeight: 600, color: '#93c5fd',
              fontFamily: FONT, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
              padding: '0 14px', boxSizing: 'border-box',
              animation: transitioning ? 'notifSlideInR 0.8s cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
            }}
          >
            {notifications[index]}
          </span>
        </div>
      </div>
    </>
  );
}

/* ─── SCHEDULE TIMELINE ───────────────────────────────────── */
function ScheduleTimeline({ classes }) {
  const PX_PER_MIN   = TIMELINE_PX_PER_MIN;
  const CONTENT_H    = Math.round(24 * 60 * PX_PER_MIN);
  const VIEWPORT_H   = TIMELINE_VIEWPORT_H;
  const HOUR_LABEL_W = 38;

  const scrollRef = useRef(null);
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  useEffect(() => {
    if (scrollRef.current) {
      const nowPx        = Math.round(nowMin * PX_PER_MIN);
      const centreOffset = nowPx - VIEWPORT_H / 2;
      scrollRef.current.scrollTop = Math.max(0, centreOffset);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayDay     = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const todayClasses = (classes || []).filter(cls => {
    if (!cls.schedule || cls.schedule.length === 0) return true;
    return cls.schedule.some(s => s.day?.toLowerCase() === todayDay.toLowerCase());
  });

  const items = todayClasses.map(cls => {
    let timeStr = cls.time || '';
    if (!timeStr && cls.schedule?.length > 0) timeStr = cls.schedule[0].time || '';
    const [h, m]      = (timeStr || '00:00').split(':').map(Number);
    const startMin    = (h || 0) * 60 + (m || 0);
    const durationMin = cls.duration_minutes || 60;
    return { cls, startMin, durationMin, color: classTypeColor(cls.name) };
  });

  // Greedy column assignment
  const columns = [];
  const itemsWithCol = items.map(item => {
    let col = 0;
    while (true) {
      const colItems = columns[col] || [];
      const overlaps = colItems.some(ci =>
        ci.startMin < item.startMin + item.durationMin && ci.startMin + ci.durationMin > item.startMin
      );
      if (!overlaps) {
        if (!columns[col]) columns[col] = [];
        columns[col].push(item);
        return { ...item, col };
      }
      col++;
    }
  });
  const numCols    = Math.max(1, ...itemsWithCol.map(i => i.col + 1));
  const nowPx      = Math.round(nowMin * PX_PER_MIN);
  const hourLabels = Array.from({ length: 24 }, (_, i) => i);
  const minToPx    = (m) => Math.round(m * PX_PER_MIN);

  return (
    <>
      <style>{`
        .sched-block { transition: opacity 0.12s; }
        .sched-block:hover { opacity: 0.8 !important; }
      `}</style>
      <div
        ref={scrollRef}
        style={{
          height: VIEWPORT_H,
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative',
          scrollbarWidth: 'thin',
          scrollbarColor: `${C.brd} transparent`,
        }}
      >
        <div style={{ position: 'relative', height: CONTENT_H, display: 'flex' }}>

          {/* Hour labels */}
          <div style={{ width: HOUR_LABEL_W, flexShrink: 0, position: 'relative' }}>
            {hourLabels.map(h => (
              <div key={h} style={{
                position: 'absolute', top: minToPx(h * 60) - 7,
                left: 0, width: HOUR_LABEL_W,
                textAlign: 'right', paddingRight: 8,
                fontSize: 10, fontWeight: 700, color: C.t3,
                lineHeight: 1, userSelect: 'none',
              }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ flex: 1, position: 'relative', marginRight: 2 }}>
            {hourLabels.map(h => (
              <div key={h} style={{ position: 'absolute', top: minToPx(h * 60), left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            ))}
            {hourLabels.map(h => (
              <div key={`hh-${h}`} style={{ position: 'absolute', top: minToPx(h * 60 + 30), left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.03)' }} />
            ))}

            {/* Now line */}
            <div style={{ position: 'absolute', top: nowPx, left: 0, right: 0, height: 2, background: C.cyan, borderRadius: 2, zIndex: 10, boxShadow: `0 0 6px ${C.cyan}` }}>
              <div style={{ position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: '50%', background: C.cyan }} />
            </div>

            {items.length === 0 && (
              <div style={{ position: 'absolute', top: nowPx + 12, left: 0, right: 0, textAlign: 'center', fontSize: 12, color: C.t3, fontFamily: FONT }}>
                No classes scheduled today
              </div>
            )}

            {/* ── Class blocks — styled like DayDetailModal popup, no capacity bar ── */}
            {itemsWithCol.map((item, i) => {
              const top    = minToPx(item.startMin);
              const height = Math.max(20, Math.round(item.durationMin * PX_PER_MIN));
              const colW   = 1 / numCols;
              const left   = `${item.col * colW * 100}%`;
              const width  = `calc(${colW * 100}% - 4px)`;
              const color  = item.color;

              const absH       = Math.floor(item.startMin / 60) % 24;
              const absM       = item.startMin % 60;
              const endTotal   = item.startMin + item.durationMin;
              const endH       = Math.floor(endTotal / 60) % 24;
              const endM       = endTotal % 60;
              const timeStr    = `${String(absH).padStart(2,'0')}:${String(absM).padStart(2,'0')}`;
              const timeEndStr = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
              const attendeeCount = (item.cls.attendee_ids || []).length;

              return (
                <button
                  key={i}
                  className="sched-block"
                  style={{
                    position: 'absolute', top, left, width, height,
                    background: hexToRgba(color, 0.18),
                    border: `1px solid ${hexToRgba(color, 0.22)}`,
                    borderLeft: `3px solid ${hexToRgba(color, 0.55)}`,
                    borderRadius: 5,
                    padding: '3px 6px 3px 5px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    gap: 1,
                    boxSizing: 'border-box',
                    cursor: 'default',
                    textAlign: 'left',
                    fontFamily: FONT,
                  }}
                >
                  {/* Title row: name left, time-range + chevron right */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                    <div style={{
                      fontSize: 11.5, fontWeight: 700, color: C.t1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.2, flex: 1, minWidth: 0,
                    }}>
                      {item.cls.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      {height > 20 && (
                        <div style={{ fontSize: 9.5, color: C.t1, fontWeight: 500, lineHeight: 1.2, whiteSpace: 'nowrap', opacity: 0.75 }}>
                          {timeStr}–{timeEndStr}
                        </div>
                      )}
                      <ChevronRight style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
                    </div>
                  </div>

                  {/* Instructor — "Coach — Name · N attending" */}
                  {height > 32 && item.cls.instructor && (
                    <div style={{ fontSize: 10.5, color: C.t1, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>
                      Coach — {item.cls.instructor}{attendeeCount > 0 ? ` · ${attendeeCount} attending` : ''}
                    </div>
                  )}

                  {/* No instructor but has attendees */}
                  {height > 32 && !item.cls.instructor && attendeeCount > 0 && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, lineHeight: 1.2 }}>
                      {attendeeCount} attending
                    </div>
                  )}

                  {/* Capacity bar intentionally removed */}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP OVERVIEW
═══════════════════════════════════════════════════════════════ */
function DesktopOverview({
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers,
  retentionRate, newSignUps, monthChangePct, atRisk, sparkData,
  checkIns, allMemberships, challenges, posts, events, classes,
  atRiskMembers, openModal, setTab, ownerName, avatarMap = {},
  peakLabel, peakEntry,
}) {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const liveCount = (checkIns || []).filter(c =>
    new Date(c.check_in_date || c.created_date || 0).getTime() > twoHoursAgo
  ).length;
  const livePct = totalMembers > 0 ? Math.round((liveCount / totalMembers) * 100) : 0;

  const computedRetention = retentionRate ?? (
    totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0
  );
  const retentionTier = computedRetention >= 80 ? 'Elite Tier' : computedRetention >= 60 ? 'Good' : 'Needs Attention';

  const atRiskList = useMemo(() => {
    if (atRiskMembers?.length > 0) return atRiskMembers.slice(0, 5);
    const now = Date.now();
    return (allMemberships || [])
      .map(m => {
        const memberCIs = (checkIns || []).filter(c => c.user_id === m.user_id);
        const lastCI = memberCIs.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        const daysSince = lastCI
          ? Math.floor((now - new Date(lastCI.check_in_date).getTime()) / 86400000)
          : 999;
        return { ...m, daysSinceLastCheckIn: daysSince };
      })
      .filter(m => m.daysSinceLastCheckIn >= 14)
      .sort((a, b) => b.daysSinceLastCheckIn - a.daysSinceLastCheckIn)
      .slice(0, 5);
  }, [atRiskMembers, allMemberships, checkIns]);

  const firstName   = ownerName || 'there';
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const greetingCap = greeting.charAt(0).toUpperCase() + greeting.slice(1);
  const gymId       = events?.[0]?.gym_id;

  // Schedule + at-risk card total height
  const CARD_INNER_H = TIMELINE_VIEWPORT_H + 46 + 32;

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 11, background: '#000', height: 'calc(100vh - 56px)', boxSizing: 'border-box', paddingBottom: 32 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{
          fontSize: 23, fontWeight: 700, color: C.t1,
          margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Good {greetingCap} <span style={{ color: C.cyan }}>{firstName}</span>
        </h1>

        <NotificationTicker
          posts={posts}
          events={events}
          challenges={challenges}
          checkIns={checkIns}
          gymId={gymId}
          classes={classes}
        />
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <KpiCard label="Today's Check-ins"      value={todayCI ?? 0}       delta={todayVsYest}    sparkData={sparkData} />
        <KpiCard label="Weekly Active Members"  value={activeThisWeek ?? 0} delta={monthChangePct} sparkData={sparkData?.slice(-7)} />

        {/* Live in Gym */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '7px 14px 8px' }}>
          <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 1 }}>Live in Gym</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {liveCount}<span style={{ fontSize: 13, color: C.t3, fontWeight: 400 }}> now</span>
              </div>
              <div style={{ fontSize: 10.5, color: C.t3, marginTop: 3 }}>
                {peakLabel ? `Peak: ${peakLabel}` : `${livePct}% of total`}
              </div>
            </div>
            <Donut pct={livePct} size={42} stroke={4} color={C.cyan} />
          </div>
        </div>

        {/* Retention */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '7px 14px 8px' }}>
          <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 1 }}>Retention Score</div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.cyan, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 2 }}>{computedRetention}%</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>{retentionTier}</div>
          </div>
        </div>
      </div>

      {/* ── Schedule + At-Risk ── */}
      <div style={{ display: 'flex', gap: 11 }}>

        {/* Schedule card — 20% taller via TIMELINE_VIEWPORT_H */}
        <div style={{
          background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10,
          padding: '8px 18px 14px',
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          height: CARD_INNER_H, boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Today's Schedule</span>
            <button
              onClick={() => setTab?.('content')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7.5px 18px', borderRadius: 9, background: '#2563eb', border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              Edit Schedule
            </button>
          </div>
          <ScheduleTimeline classes={classes} />
        </div>

        {/* At-Risk card — same height as schedule card */}
        <div style={{
          background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10,
          padding: '14px 16px',
          width: 248, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          height: CARD_INNER_H, boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: C.redDim, border: `1px solid rgba(255,77,109,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle style={{ width: 11, height: 11, color: C.red }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>At-Risk Members</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.red, background: C.redDim, border: `1px solid rgba(255,77,109,0.28)`, borderRadius: 5, padding: '2px 7px' }}>
              {atRiskList.length}
            </span>
          </div>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 12, flexShrink: 0 }}>Haven't visited in 14+ days</div>

          {atRiskList.length === 0 ? (
            <div style={{ fontSize: 12, color: C.green, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
              <TrendingUp style={{ width: 14, height: 14 }} /> All members active!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {atRiskList.map((m, i) => (
                <AtRiskRow key={m.user_id || i} member={m} avatarMap={avatarMap} />
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${C.brd}` }}>
            <button
              onClick={() => setTab?.('members')}
              style={{ background: 'none', border: 'none', padding: 0, color: C.cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              See all at-risk members <ChevronRight style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Currently in the Gym — grows to fill remaining page space ── */}
      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '8px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 80 }}>
        <div style={{ marginBottom: 11, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Currently in the Gym</span>
        </div>
        <div style={{
          fontSize: 12, color: C.t3, textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flex: 1,
        }}>
          Live gym presence will appear here
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE OVERVIEW
═══════════════════════════════════════════════════════════════ */
function MobileOverview({
  todayCI, todayVsYest, activeThisWeek, totalMembers,
  retentionRate, checkIns, allMemberships,
  challenges, posts, events, classes, atRiskMembers,
  openModal, setTab, monthChangePct, avatarMap = {},
}) {
  const [expanded, setExpanded] = useState(false);

  const todayDay     = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
  const todayClasses = (classes || []).filter(cls => {
    if (!cls.schedule || cls.schedule.length === 0) return true;
    return cls.schedule.some(s => s.day?.toLowerCase() === todayDay.toLowerCase());
  });
  const shown = expanded ? todayClasses : todayClasses.slice(0, 4);

  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const liveCount   = (checkIns || []).filter(c => new Date(c.check_in_date || c.created_date || 0).getTime() > twoHoursAgo).length;
  const livePct     = totalMembers > 0 ? Math.round((liveCount / totalMembers) * 100) : 0;
  const computedRetention = retentionRate ?? (totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0);

  const atRiskList = useMemo(() => {
    if (atRiskMembers?.length > 0) return atRiskMembers.slice(0, 3);
    const now = Date.now();
    return (allMemberships || [])
      .map(m => {
        const memberCIs = (checkIns || []).filter(c => c.user_id === m.user_id);
        const lastCI    = memberCIs.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        const daysSince = lastCI ? Math.floor((now - new Date(lastCI.check_in_date).getTime()) / 86400000) : 999;
        return { ...m, daysSinceLastCheckIn: daysSince };
      })
      .filter(m => m.daysSinceLastCheckIn >= 14)
      .sort((a, b) => b.daysSinceLastCheckIn - a.daysSinceLastCheckIn)
      .slice(0, 3);
  }, [atRiskMembers, allMemberships, checkIns]);

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Check-ins</span>
            <Activity style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{todayCI ?? 0}</div>
          {todayVsYest != null && (
            <div style={{ fontSize: 11, color: todayVsYest >= 0 ? C.cyan : C.red, fontWeight: 600, marginTop: 4 }}>
              <ArrowUpRight style={{ width: 10, height: 10, display: 'inline' }} /> {todayVsYest >= 0 ? '+' : ''}{todayVsYest}% vs yesterday
            </div>
          )}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Weekly Active</span>
            <Users style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{activeThisWeek ?? 0}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>of {totalMembers ?? 0} total</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Live in Gym</span>
            <Flame style={{ width: 14, height: 14, color: '#6366f1' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{liveCount}</div>
              <div style={{ fontSize: 10.5, color: C.t3, marginTop: 5 }}>{livePct}% of members</div>
            </div>
            <Donut pct={livePct} size={52} stroke={5} color="#6366f1" />
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.cyanBrd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Retention</span>
            <TrendingUp style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.cyan, letterSpacing: '-0.04em', lineHeight: 1 }}>{computedRetention}%</div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
            {computedRetention >= 80 ? 'Elite' : computedRetention >= 60 ? 'Good' : 'Needs Work'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 10 }}>Today's Schedule</div>
        {todayClasses.length === 0 ? (
          <div style={{ fontSize: 12, color: C.t3, padding: '16px 0' }}>No classes scheduled today</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {shown.map((cls, i) => {
                const color    = classTypeColor(cls.name);
                const booked   = cls.booked ?? 0;
                const capacity = cls.max_capacity || cls.capacity || 0;
                const pct      = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
                const full     = capacity > 0 && booked >= capacity;
                let timeLabel  = cls.time || '';
                if (!timeLabel && cls.schedule?.length > 0) timeLabel = cls.schedule[0].time || '';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.brd}`, borderLeft: `3px solid ${color}` }}>
                    {timeLabel && <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, width: 36, flexShrink: 0 }}>{timeLabel}</div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</div>
                      {cls.instructor && <div style={{ fontSize: 10.5, color: C.t2, marginTop: 1 }}>{cls.instructor}</div>}
                    </div>
                    {capacity > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                        <div style={{ width: 60 }}>
                          <div style={{ height: 3, background: C.brd, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: full ? C.red : color, borderRadius: 2 }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: full ? C.red : C.t2, minWidth: 32, textAlign: 'right' }}>{booked}/{capacity}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {todayClasses.length > 4 && (
              <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', marginTop: 8, padding: '11px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.brd}`, borderRadius: 12, color: C.t2, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {expanded ? 'Show less' : `${todayClasses.length - 4} more classes`}
                <ChevronDown style={{ width: 13, height: 13, transform: expanded ? 'rotate(180deg)' : 'none' }} />
              </button>
            )}
          </>
        )}
      </div>

      {atRiskList.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 10 }}>At-Risk Members</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {atRiskList.map((m, i) => (
              <div key={m.user_id || i} style={{ padding: '12px 14px', borderRadius: 13, background: C.card, border: `1px solid ${C.brd}` }}>
                <AtRiskRow member={m} avatarMap={avatarMap} />
              </div>
            ))}
          </div>
          <button onClick={() => setTab?.('members')} style={{ marginTop: 8, fontSize: 12, color: C.cyan, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: FONT }}>
            See all at-risk members →
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabOverview(props) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return isMobile
    ? <MobileOverview {...props} />
    : <DesktopOverview {...props} />;
}