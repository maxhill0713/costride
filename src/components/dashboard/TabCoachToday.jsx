import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Users, ArrowUpRight, Activity, Star,
  Clock, ChevronRight, ChevronDown, CheckCircle,
  Calendar, Dumbbell, AlertCircle, MessageSquare,
  TrendingUp, Flame, Award, Target,
} from 'lucide-react';

/* ─── TOKENS — identical to TabOverview ─────────────────── */
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
  purple:   '#8b5cf6',
  purpleDim:'rgba(139,92,246,0.14)',
};
const FONT = "'DM Sans', 'Segoe UI', sans-serif";

/* ─── CLASS COLOR BY TYPE — identical to TabOverview ────── */
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

/* ─── shared timeline constants — identical to TabOverview ── */
const TIMELINE_PX_PER_MIN = 1.1;
const TIMELINE_VISIBLE_H  = Math.round(4.5 * 60 * TIMELINE_PX_PER_MIN);
const TIMELINE_VIEWPORT_H = Math.round(TIMELINE_VISIBLE_H * 0.80 * 1.20);

/* ─── MINI COMPONENTS — identical to TabOverview ────────── */
function Av({ name, src, size = 28 }) {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];
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
          <linearGradient id="coach-spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#coach-spark-grad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Donut({ pct, size = 58, stroke = 5, color = C.cyan }) {
  const r      = (size - stroke * 2) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size < 50 ? 9 : 10, fontWeight: 700, color: C.t1,
      }}>{pct}%</div>
    </div>
  );
}

/* ─── KPI CARD — identical to TabOverview ────────────────── */
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

/* ─── COUNTDOWN TICKER ────────────────────────────────────── */
function CoachTicker({ todayClasses, coachName }) {
  const indexRef = useRef(0);
  const [index, setIndex]             = useState(0);
  const [prevIndex, setPrevIndex]     = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  const messages = useMemo(() => {
    const msgs = [];
    const now    = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const upcoming = todayClasses.filter(cls => {
      const [h, m] = (cls.time || '00:00').split(':').map(Number);
      return (h * 60 + m) > nowMin;
    }).sort((a, b) => {
      const [ah, am] = (a.time || '00:00').split(':').map(Number);
      const [bh, bm] = (b.time || '00:00').split(':').map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    });

    const inProgress = todayClasses.find(cls => {
      const [h, m] = (cls.time || '00:00').split(':').map(Number);
      const startMin = h * 60 + m;
      return nowMin >= startMin && nowMin < startMin + (cls.duration_minutes || 60);
    });

    if (inProgress) {
      const attendees = (inProgress.attendee_ids || []).length || inProgress.booked || 0;
      msgs.push(`Currently teaching ${inProgress.name}${attendees ? ` · ${attendees} members` : ''}`);
    }

    if (upcoming.length > 0) {
      const next = upcoming[0];
      const [nh, nm] = (next.time || '00:00').split(':').map(Number);
      const diff = (nh * 60 + nm) - nowMin;
      const diffLabel = diff < 60 ? `${diff} min` : `${Math.round(diff / 60)} hr`;
      msgs.push(`Next class — ${next.name} in ${diffLabel}`);
    }

    const totalToday = todayClasses.length;
    const completed  = todayClasses.filter(cls => {
      const [h, m] = (cls.time || '00:00').split(':').map(Number);
      return (h * 60 + m) + (cls.duration_minutes || 60) <= nowMin;
    }).length;

    if (totalToday > 0) msgs.push(`${completed} of ${totalToday} sessions complete today`);

    const totalAttendees = todayClasses.reduce((acc, cls) => {
      return acc + ((cls.attendee_ids || []).length || cls.booked || 0);
    }, 0);
    if (totalAttendees > 0) msgs.push(`${totalAttendees} members training with you today`);

    if (msgs.length === 0) msgs.push('No classes scheduled — enjoy your rest day');
    return msgs;
  }, [todayClasses]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      const prev = indexRef.current;
      const next = (prev + 1) % messages.length;
      indexRef.current = next;
      setPrevIndex(prev);
      setIndex(next);
      setTransitioning(true);
      setTimeout(() => { setPrevIndex(null); setTransitioning(false); }, 800);
    }, 5000);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <>
      <style>{`
        @keyframes coachTickOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(-110%); opacity:0; } }
        @keyframes coachTickIn  { from { transform:translateX(110%); opacity:0; } to { transform:translateX(0); opacity:1; } }
      `}</style>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '80%', height: 37,
          background: 'rgba(77,127,255,0.11)',
          borderRadius: 4, overflow: 'hidden',
          position: 'relative', display: 'flex', alignItems: 'center',
        }}>
          {transitioning && prevIndex !== null && (
            <span style={{
              position: 'absolute', left: 0, right: 0, textAlign: 'center',
              fontSize: 11.5, fontWeight: 600, color: '#93c5fd',
              fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', padding: '0 14px', boxSizing: 'border-box',
              animation: 'coachTickOut 0.8s cubic-bezier(0.4,0,0.2,1) forwards',
            }}>
              {messages[prevIndex]}
            </span>
          )}
          <span key={index} style={{
            position: 'absolute', left: 0, right: 0, textAlign: 'center',
            fontSize: 11.5, fontWeight: 600, color: '#93c5fd',
            fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis', padding: '0 14px', boxSizing: 'border-box',
            animation: transitioning ? 'coachTickIn 0.8s cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
          }}>
            {messages[index]}
          </span>
        </div>
      </div>
    </>
  );
}

/* ─── SCHEDULE TIMELINE — identical to TabOverview ──────── */
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

  const items = (classes || []).map(cls => {
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
        ci.startMin < item.startMin + item.durationMin &&
        ci.startMin + ci.durationMin > item.startMin
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
  const minToPx    = m => Math.round(m * PX_PER_MIN);

  return (
    <>
      <style>{`
        .coach-sched-block { transition: opacity 0.12s; }
        .coach-sched-block:hover { opacity: 0.8 !important; }
      `}</style>
      <div ref={scrollRef} style={{
        height: VIEWPORT_H, overflowY: 'auto', overflowX: 'hidden',
        position: 'relative', scrollbarWidth: 'thin',
        scrollbarColor: `${C.brd} transparent`,
      }}>
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
              const attendeeCount = (item.cls.attendee_ids || []).length || item.cls.booked || 0;

              // Is this class happening right now?
              const isLive = nowMin >= item.startMin && nowMin < item.startMin + item.durationMin;

              return (
                <button key={i} className="coach-sched-block" style={{
                  position: 'absolute', top, left, width, height,
                  background: isLive ? hexToRgba(color, 0.28) : hexToRgba(color, 0.18),
                  border: `1px solid ${hexToRgba(color, isLive ? 0.5 : 0.22)}`,
                  borderLeft: `3px solid ${hexToRgba(color, isLive ? 0.9 : 0.55)}`,
                  borderRadius: 5, padding: '3px 6px 3px 5px', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
                  gap: 1, boxSizing: 'border-box', cursor: 'default',
                  textAlign: 'left', fontFamily: FONT,
                  boxShadow: isLive ? `0 0 12px ${hexToRgba(color, 0.2)}` : 'none',
                }}>
                  {/* Live badge */}
                  {isLive && height > 18 && (
                    <div style={{
                      position: 'absolute', top: 3, right: 5,
                      fontSize: 8.5, fontWeight: 800, color: color,
                      background: hexToRgba(color, 0.2),
                      border: `1px solid ${hexToRgba(color, 0.4)}`,
                      borderRadius: 3, padding: '1px 5px', letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>
                      Live
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                    <div style={{
                      fontSize: 11.5, fontWeight: 700, color: C.t1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      lineHeight: 1.2, flex: 1, minWidth: 0,
                    }}>
                      {item.cls.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      {height > 20 && !isLive && (
                        <div style={{ fontSize: 9.5, color: C.t1, fontWeight: 500, lineHeight: 1.2, whiteSpace: 'nowrap', opacity: 0.75 }}>
                          {timeStr}–{timeEndStr}
                        </div>
                      )}
                      {!isLive && <ChevronRight style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }} />}
                    </div>
                  </div>

                  {height > 32 && attendeeCount > 0 && (
                    <div style={{ fontSize: 10.5, color: C.t1, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>
                      {attendeeCount} attending
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── ATTENDEE ROW — mirrors AtRiskRow ───────────────────── */
function AttendeeRow({ member, classColor, classTime }) {
  const name   = member.user_name || member.name || 'Member';
  const avatar = member.avatar_url || null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Av name={name} src={avatar} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        {classTime && (
          <div style={{ fontSize: 10.5, color: C.t3 }}>{classTime}</div>
        )}
      </div>
      {classColor && (
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: classColor, flexShrink: 0 }} />
      )}
    </div>
  );
}

/* ─── UPCOMING CLASSES SIDE PANEL ────────────────────────── */
function UpcomingPanel({ todayClasses, onViewAll }) {
  const now     = new Date();
  const nowMin  = now.getHours() * 60 + now.getMinutes();
  const CARD_INNER_H = TIMELINE_VIEWPORT_H + 46 + 32;

  // Group attendees across all today's classes
  const allAttendees = useMemo(() => {
    const seen = new Set();
    const list = [];
    const sorted = [...todayClasses].sort((a, b) => {
      const [ah, am] = (a.time || '00:00').split(':').map(Number);
      const [bh, bm] = (b.time || '00:00').split(':').map(Number);
      return (ah * 60 + am) - (bh * 60 + bm);
    });
    sorted.forEach(cls => {
      const [h, m] = (cls.time || '00:00').split(':').map(Number);
      const color  = classTypeColor(cls.name);
      (cls.attendee_ids || cls.attendees || []).forEach(a => {
        const id  = a.user_id || a.id || JSON.stringify(a);
        const uid = `${id}`;
        if (!seen.has(uid)) {
          seen.add(uid);
          list.push({
            ...(typeof a === 'object' ? a : { user_name: String(a) }),
            classTime: cls.time,
            className: cls.name,
            classColor: color,
          });
        }
      });
    });
    return list;
  }, [todayClasses]);

  // Next upcoming class
  const nextClass = useMemo(() => {
    return [...todayClasses]
      .map(cls => {
        let timeStr = cls.time || '';
        if (!timeStr && cls.schedule?.length > 0) timeStr = cls.schedule[0].time || '';
        const [h, m] = (timeStr || '00:00').split(':').map(Number);
        return { ...cls, startMin: h * 60 + m, time: timeStr };
      })
      .filter(cls => cls.startMin > nowMin)
      .sort((a, b) => a.startMin - b.startMin)[0] || null;
  }, [todayClasses, nowMin]);

  const completedCount = todayClasses.filter(cls => {
    let timeStr = cls.time || '';
    if (!timeStr && cls.schedule?.length > 0) timeStr = cls.schedule[0].time || '';
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h * 60 + m) + (cls.duration_minutes || 60) <= nowMin;
  }).length;

  const totalAttendees = todayClasses.reduce((acc, cls) => {
    return acc + ((cls.attendee_ids || cls.attendees || []).length || cls.booked || 0);
  }, 0);

  const nextColor = nextClass ? classTypeColor(nextClass.name) : C.cyan;

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10,
      padding: '14px 16px',
      width: 248, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      height: CARD_INNER_H, boxSizing: 'border-box',
    }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexShrink: 0 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 5,
          background: C.cyanDim, border: `1px solid ${C.cyanBrd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Calendar style={{ width: 11, height: 11, color: C.cyan }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Today's Classes</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.cyan, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, borderRadius: 5, padding: '2px 7px' }}>
          {todayClasses.length}
        </span>
      </div>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 12, flexShrink: 0 }}>
        {completedCount} complete · {totalAttendees} members today
      </div>

      {/* Next class highlight */}
      {nextClass && (
        <div style={{
          marginBottom: 12, padding: '10px 12px', borderRadius: 8, flexShrink: 0,
          background: hexToRgba(nextColor, 0.1),
          border: `1px solid ${hexToRgba(nextColor, 0.25)}`,
          borderLeft: `3px solid ${hexToRgba(nextColor, 0.7)}`,
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: nextColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Up Next</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nextClass.name}
          </div>
          <div style={{ fontSize: 11, color: C.t2, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock style={{ width: 10, height: 10 }} />
            {nextClass.time}
            {nextClass.duration_minutes && ` · ${nextClass.duration_minutes} min`}
          </div>
          {(() => {
            const [nh, nm] = (nextClass.time || '00:00').split(':').map(Number);
            const diff = (nh * 60 + nm) - nowMin;
            return diff > 0 && diff < 120 && (
              <div style={{ fontSize: 10.5, color: nextColor, fontWeight: 700, marginTop: 4 }}>
                Starts in {diff < 60 ? `${diff} min` : `${Math.floor(diff / 60)}h ${diff % 60}m`}
              </div>
            );
          })()}
        </div>
      )}

      {/* Attendee list */}
      {allAttendees.length > 0 ? (
        <>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, flexShrink: 0 }}>
            Members Today
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: `${C.brd} transparent` }}>
            {allAttendees.slice(0, 8).map((member, i) => (
              <AttendeeRow
                key={member.user_id || i}
                member={member}
                classColor={member.classColor}
                classTime={member.classTime}
              />
            ))}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <Users style={{ width: 22, height: 22, color: C.t3 }} />
          <div style={{ fontSize: 12, color: C.t3 }}>No attendees yet</div>
        </div>
      )}

      {/* Footer link */}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${C.brd}`, flexShrink: 0 }}>
        <button onClick={onViewAll} style={{
          background: 'none', border: 'none', padding: 0,
          color: C.cyan, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: FONT,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          View all attendees <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}

/* ─── RECENT FEEDBACK ROW ────────────────────────────────── */
function FeedbackRow({ review }) {
  const name   = review.user_name || review.name || 'Member';
  const avatar = review.avatar_url || null;
  const rating = review.rating || 5;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <Av name={name} src={avatar} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{name}</span>
          <div style={{ display: 'flex', gap: 2, marginLeft: 'auto', flexShrink: 0 }}>
            {[1,2,3,4,5].map(s => (
              <div key={s} style={{ width: 8, height: 8, borderRadius: 1, background: s <= rating ? '#f59e0b' : C.brd }} />
            ))}
          </div>
        </div>
        {review.text && (
          <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {review.text}
          </div>
        )}
        {review.class_name && (
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>{review.class_name}</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DESKTOP COACH TODAY
═══════════════════════════════════════════════════════════ */
function DesktopCoachToday({
  coachName, todayClasses, totalSessions, avgRating, reviewCount,
  totalMembers, weeklyRetention, recentReviews, sparkData,
  openModal, setTab,
}) {
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const hour        = now.getHours();
  const greeting    = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const greetingCap = greeting.charAt(0).toUpperCase() + greeting.slice(1);
  const firstName   = coachName?.split(' ')[0] || 'Coach';

  // Derived KPIs
  const classesToday = todayClasses.length;
  const completedToday = todayClasses.filter(cls => {
    let timeStr = cls.time || '';
    if (!timeStr && cls.schedule?.length > 0) timeStr = cls.schedule[0].time || '';
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h * 60 + m) + (cls.duration_minutes || 60) <= nowMin;
  }).length;

  const totalAttendeesToday = todayClasses.reduce((acc, cls) => {
    return acc + ((cls.attendee_ids || cls.attendees || []).length || cls.booked || 0);
  }, 0);

  const maxCapacityToday = todayClasses.reduce((acc, cls) => {
    return acc + (cls.max_capacity || cls.capacity || 0);
  }, 0);

  const fillRate = maxCapacityToday > 0
    ? Math.round((totalAttendeesToday / maxCapacityToday) * 100)
    : 0;

  const ratingPct   = Math.round(((avgRating ?? 5) / 5) * 100);
  const CARD_INNER_H = TIMELINE_VIEWPORT_H + 46 + 32;

  return (
    <div style={{
      fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 11,
      background: '#000', height: 'calc(100vh - 80px)',
      boxSizing: 'border-box', paddingBottom: 32, overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{
          fontSize: 23, fontWeight: 700, color: C.t1,
          margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Good {greetingCap} <span style={{ color: C.cyan }}>{firstName}</span>
        </h1>
        <CoachTicker todayClasses={todayClasses} coachName={coachName} />
      </div>

      {/* ── KPI row — 4 cards, identical structure to TabOverview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>

        {/* Classes Today */}
        <KpiCard
          label="Classes Today"
          value={classesToday}
          sub={`${completedToday} completed`}
          sparkData={sparkData}
        />

        {/* Members Today */}
        <KpiCard
          label="Members Today"
          value={totalAttendeesToday}
          sub={maxCapacityToday > 0 ? `of ${maxCapacityToday} capacity` : undefined}
          sparkData={sparkData?.slice(-7)}
        />

        {/* Fill Rate — mirrors Live in Gym card exactly */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '7px 14px 8px' }}>
          <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 1 }}>Class Fill Rate</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {fillRate}<span style={{ fontSize: 13, color: C.t3, fontWeight: 400 }}>%</span>
              </div>
              <div style={{ fontSize: 10.5, color: C.t3, marginTop: 3 }}>
                {totalSessions != null ? `${totalSessions} total sessions` : 'Avg across classes'}
              </div>
            </div>
            <Donut pct={fillRate} size={42} stroke={4} color={fillRate >= 80 ? C.green : fillRate >= 50 ? C.amber : C.red} />
          </div>
        </div>

        {/* Rating — mirrors Retention card exactly */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '7px 14px 8px' }}>
          <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 1 }}>Average Rating</div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.cyan, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 2 }}>
              {avgRating != null ? Number(avgRating).toFixed(1) : '—'}
              <span style={{ fontSize: 13, color: C.t3, fontWeight: 400 }}> / 5</span>
            </div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>
              {reviewCount != null ? `${reviewCount} review${reviewCount !== 1 ? 's' : ''}` : 'No reviews yet'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Schedule + Upcoming panel — identical layout to TabOverview ── */}
      <div style={{ display: 'flex', gap: 11 }}>

        {/* Schedule card */}
        <div style={{
          background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10,
          padding: '8px 18px 14px', flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          height: CARD_INNER_H, boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Today's Schedule</span>
            <button
              onClick={() => setTab?.('content')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '7.5px 18px', borderRadius: 9,
                background: '#2563eb', border: 'none',
                color: '#fff', fontSize: 12.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: FONT,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              Edit Schedule
            </button>
          </div>
          <ScheduleTimeline classes={todayClasses} />
        </div>

        {/* Upcoming panel — mirrors At-Risk card */}
        <UpcomingPanel
          todayClasses={todayClasses}
          onViewAll={() => setTab?.('members')}
        />
      </div>

      {/* ── Recent Feedback — fills remaining height, mirrors "Currently in Gym" card ── */}
      <div style={{
        background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10,
        padding: '8px 16px 14px', flex: 1,
        display: 'flex', flexDirection: 'column', minHeight: 80,
      }}>
        <div style={{ marginBottom: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Recent Feedback</span>
          {reviewCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1,2,3,4,5].map(s => (
                  <div key={s} style={{ width: 9, height: 9, borderRadius: 1, background: s <= Math.round(avgRating ?? 0) ? '#f59e0b' : C.brd }} />
                ))}
              </div>
              <span style={{ fontSize: 11.5, color: C.t2, fontWeight: 600 }}>{Number(avgRating).toFixed(1)} from {reviewCount} reviews</span>
            </div>
          )}
        </div>

        {(recentReviews || []).length > 0 ? (
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', flex: 1,
            scrollbarWidth: 'thin', scrollbarColor: `${C.brd} transparent`,
            alignItems: 'flex-start', paddingBottom: 4,
          }}>
            {(recentReviews || []).slice(0, 6).map((review, i) => (
              <div key={i} style={{
                minWidth: 220, maxWidth: 260, flexShrink: 0,
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${C.brd}`,
              }}>
                <FeedbackRow review={review} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: 12, color: C.t3, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flex: 1, gap: 8, flexDirection: 'column',
          }}>
            <MessageSquare style={{ width: 18, height: 18, color: C.t3 }} />
            Member reviews will appear here
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOBILE COACH TODAY — mirrors MobileOverview exactly
═══════════════════════════════════════════════════════════ */
function MobileCoachToday({
  coachName, todayClasses, totalSessions, avgRating, reviewCount,
  recentReviews, setTab,
}) {
  const [expanded, setExpanded] = useState(false);
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const shown = expanded ? todayClasses : todayClasses.slice(0, 4);

  const completedToday = todayClasses.filter(cls => {
    let timeStr = cls.time || '';
    if (!timeStr && cls.schedule?.length > 0) timeStr = cls.schedule[0].time || '';
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h * 60 + m) + (cls.duration_minutes || 60) <= nowMin;
  }).length;

  const totalAttendeesToday = todayClasses.reduce((acc, cls) => {
    return acc + ((cls.attendee_ids || cls.attendees || []).length || cls.booked || 0);
  }, 0);

  const maxCapacityToday = todayClasses.reduce((acc, cls) => {
    return acc + (cls.max_capacity || cls.capacity || 0);
  }, 0);

  const fillRate  = maxCapacityToday > 0 ? Math.round((totalAttendeesToday / maxCapacityToday) * 100) : 0;
  const ratingPct = Math.round(((avgRating ?? 5) / 5) * 100);

  return (
    <div style={{ fontFamily: FONT }}>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Classes Today</span>
            <Calendar style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{todayClasses.length}</div>
          <div style={{ fontSize: 11, color: C.t2, fontWeight: 600, marginTop: 4 }}>{completedToday} completed</div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Members Today</span>
            <Users style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{totalAttendeesToday}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>{maxCapacityToday > 0 ? `of ${maxCapacityToday} cap.` : 'total'}</div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Fill Rate</span>
            <Flame style={{ width: 14, height: 14, color: '#6366f1' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{fillRate}%</div>
              <div style={{ fontSize: 10.5, color: C.t3, marginTop: 5 }}>avg capacity</div>
            </div>
            <Donut pct={fillRate} size={52} stroke={5} color={fillRate >= 80 ? C.green : C.amber} />
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.cyanBrd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Rating</span>
            <TrendingUp style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.cyan, letterSpacing: '-0.04em', lineHeight: 1 }}>
            {avgRating != null ? Number(avgRating).toFixed(1) : '—'}
          </div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
            {reviewCount != null ? `from ${reviewCount} reviews` : 'out of 5.0'}
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 10 }}>Today's Schedule</div>
        {todayClasses.length === 0 ? (
          <div style={{ fontSize: 12, color: C.t3, padding: '16px 0' }}>No classes scheduled today</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {shown.map((cls, i) => {
                const color      = classTypeColor(cls.name);
                const attendees  = (cls.attendee_ids || cls.attendees || []).length || cls.booked || 0;
                const capacity   = cls.max_capacity || cls.capacity || 0;
                const pct        = capacity > 0 ? Math.round((attendees / capacity) * 100) : 0;
                const full       = capacity > 0 && attendees >= capacity;
                let timeLabel    = cls.time || '';
                if (!timeLabel && cls.schedule?.length > 0) timeLabel = cls.schedule[0].time || '';

                // Is live?
                const [h, m] = (timeLabel || '00:00').split(':').map(Number);
                const startMin = h * 60 + m;
                const isLive   = nowMin >= startMin && nowMin < startMin + (cls.duration_minutes || 60);

                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px',
                    borderRadius: 8,
                    background: isLive ? hexToRgba(color, 0.1) : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isLive ? hexToRgba(color, 0.3) : C.brd}`,
                    borderLeft: `3px solid ${color}`,
                  }}>
                    {timeLabel && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, width: 36, flexShrink: 0 }}>{timeLabel}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cls.name}
                        </div>
                        {isLive && (
                          <span style={{ fontSize: 8.5, fontWeight: 800, color, background: hexToRgba(color, 0.18), border: `1px solid ${hexToRgba(color, 0.35)}`, borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                            Live
                          </span>
                        )}
                      </div>
                      {cls.duration_minutes && (
                        <div style={{ fontSize: 10.5, color: C.t2, marginTop: 1 }}>{cls.duration_minutes} min</div>
                      )}
                    </div>
                    {capacity > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                        <div style={{ width: 60 }}>
                          <div style={{ height: 3, background: C.brd, borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: full ? C.red : color, borderRadius: 2 }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: full ? C.red : C.t2, minWidth: 32, textAlign: 'right' }}>
                          {attendees}/{capacity}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {todayClasses.length > 4 && (
              <button onClick={() => setExpanded(!expanded)} style={{
                width: '100%', marginTop: 8, padding: '11px',
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.brd}`,
                borderRadius: 12, color: C.t2, fontSize: 12.5,
                cursor: 'pointer', fontFamily: FONT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                {expanded ? 'Show less' : `${todayClasses.length - 4} more classes`}
                <ChevronDown style={{ width: 13, height: 13, transform: expanded ? 'rotate(180deg)' : 'none' }} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Recent Feedback */}
      {(recentReviews || []).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 10 }}>Recent Feedback</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(recentReviews || []).slice(0, 3).map((review, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 13, background: C.card, border: `1px solid ${C.brd}` }}>
                <FeedbackRow review={review} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════ */
export default function TabCoachToday({ todayClasses = [], ...rest }) {
  const props = { todayClasses, ...rest };
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return isMobile
    ? <MobileCoachToday {...props} />
    : <DesktopCoachToday {...props} />;
}

/*
─── PROP REFERENCE ──────────────────────────────────────────

TabCoachToday accepts:

  coachName        string                 Coach's full name — drives greeting + ticker
  todayClasses     Class[]                Classes teaching today. Each Class:
                                            { name, time, duration_minutes, max_capacity,
                                              capacity, booked, instructor,
                                              attendee_ids: string[] | { user_name, avatar_url }[],
                                              attendees: { user_name, avatar_url }[],
                                              schedule: [{ day, time, date }] }
  totalSessions    number                 Career total sessions (shown in fill-rate sub-label)
  avgRating        number                 Average rating out of 5
  reviewCount      number                 Total number of reviews
  recentReviews    Review[]               Latest reviews. Each Review:
                                            { user_name, avatar_url, rating, text, class_name }
  sparkData        number[]               Array of numbers for sparkline charts
  openModal        (modal: string) => void
  setTab           (tab: string) => void   Navigate to another tab ('content', 'members', etc.)
*/