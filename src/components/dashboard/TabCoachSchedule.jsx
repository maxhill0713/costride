import React, { useState, useMemo, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  format, subDays, addDays, startOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth,
  differenceInMinutes, isWithinInterval, parseISO, isValid,
} from 'date-fns';
import {
  QrCode, Dumbbell, Calendar, Bell, Clock, Check, ChevronDown, ChevronUp,
  UserCheck, Users, AlertCircle, CheckCircle, RefreshCw, Pencil, Trash2,
  X, ClipboardList, User, DollarSign, Repeat, MapPin, Filter, ChevronLeft,
  ChevronRight, TrendingUp, Zap, BarChart2, Eye, Ban, AlertTriangle,
  Activity, Flame, ArrowRight, Info, MessageCircle, TrendingDown, UserX,
} from 'lucide-react';
import { CoachCard, MiniAvatar, classColor } from './CoachHelpers';

// ─── Class type config ─────────────────────────────────────────────────────────
const CLASS_TYPE_CFG = {
  hiit:            { color: '#f87171', label: 'HIIT',       emoji: '🔥' },
  yoga:            { color: '#34d399', label: 'Yoga',       emoji: '🧘' },
  spin:            { color: '#38bdf8', label: 'Spin',       emoji: '🚴' },
  strength:        { color: '#fb923c', label: 'Strength',   emoji: '💪' },
  pilates:         { color: '#e879f9', label: 'Pilates',    emoji: '🌸' },
  boxing:          { color: '#fbbf24', label: 'Boxing',     emoji: '🥊' },
  crossfit:        { color: '#f97316', label: 'CrossFit',   emoji: '⚡' },
  cardio:          { color: '#f472b6', label: 'Cardio',     emoji: '❤️' },
  functional:      { color: '#a78bfa', label: 'Functional', emoji: '🎯' },
  personal_training:{ color: '#38bdf8', label: 'PT',        emoji: '👤' },
  default:         { color: '#a78bfa', label: 'Class',      emoji: '🏋️' },
};

function getClassTypeCfg(cls) {
  const name = (cls.name || cls.class_type || cls.type || '').toLowerCase();
  for (const [key, cfg] of Object.entries(CLASS_TYPE_CFG)) {
    if (name.includes(key)) return cfg;
  }
  return CLASS_TYPE_CFG.default;
}

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ label, color }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}25`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function ScheduleKpi({ icon: Ic, label, value, sub, color, bar }) {
  return (
    <div style={{ borderRadius: 14, padding: '14px 16px', background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic style={{ width: 15, height: 15, color }}/>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 9, color: '#3a5070', marginTop: 3, fontWeight: 600 }}>{sub}</div>}
        </div>
      </div>
      {bar !== undefined && (
        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, bar)}%`, background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: 99, transition: 'width 0.7s ease' }}/>
        </div>
      )}
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{label}</div>
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Cancel Class', confirmColor = '#f87171' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#0d1526', border: `1px solid ${confirmColor}40`, borderRadius: 18, padding: '28px', maxWidth: 340, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${confirmColor}12`, border: `1px solid ${confirmColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertCircle style={{ width: 20, height: 20, color: confirmColor }}/>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', textAlign: 'center', margin: '0 0 20px', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Go Back</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: 10, background: `${confirmColor}18`, border: `1px solid ${confirmColor}40`, color: confirmColor, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = '#a78bfa', action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 3, height: 16, borderRadius: 99, background: accent, flexShrink: 0 }}/>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em', flex: 1 }}>{children}</span>
      {action}
    </div>
  );
}

// ─── Revenue estimate ─────────────────────────────────────────────────────────
function calcRevenue(cls, allMemberships) {
  const booked = cls.bookings?.length || cls.attended?.length || 0;
  if (booked === 0) return 0;
  const prices = allMemberships.map(m => m.membership_price || m.price || 0).filter(p => p > 0);
  const avg    = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
  if (cls.drop_in_price) return Math.round(booked * cls.drop_in_price);
  if (avg > 0) return Math.round((avg / 4.3) * booked); // apportion monthly fee
  return null;
}

// ─── Late cancel helpers ──────────────────────────────────────────────────────
const LATE_CANCEL_WINDOW_HRS = 24;
function getLateCancel(cls, now) {
  if (!cls.late_cancels || !Array.isArray(cls.late_cancels)) return [];
  return cls.late_cancels.filter(lc => {
    const cancelledAt = lc.cancelled_at ? new Date(lc.cancelled_at) : null;
    const classTime   = cls.start_time  ? new Date(cls.start_time)  : null;
    if (!cancelledAt || !classTime) return false;
    return differenceInMinutes(classTime, cancelledAt) < LATE_CANCEL_WINDOW_HRS * 60;
  });
}

// ─── Retention score (lightweight, same logic as Today page) ─────────────────
function calcRS(userId, checkIns, now) {
  const uci    = checkIns.filter(c => c.user_id === userId);
  const ms     = d => now - new Date(d.check_in_date);
  const r30    = uci.filter(c => ms(c) < 30 * 864e5).length;
  const p30    = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;
  const sorted = [...uci].sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const daysAgo= sorted[0] ? Math.floor(ms(sorted[0]) / 864e5) : 999;
  let score = 100;
  if      (daysAgo >= 999) score -= 60;
  else if (daysAgo > 21)   score -= 45;
  else if (daysAgo > 14)   score -= 30;
  else if (daysAgo > 7)    score -= 15;
  if      (r30 === 0)      score -= 25;
  else if (r30 <= 2)       score -= 15;
  score = Math.max(0, Math.min(100, score));
  const trend  = p30 > 0 ? (r30 > p30*1.1 ? 'improving' : r30 < p30*0.7 ? 'declining' : 'stable') : (r30 >= 2 ? 'improving' : 'stable');
  const status = score >= 65 ? 'safe' : score >= 35 ? 'at_risk' : 'high_risk';
  const color  = status === 'safe' ? '#10b981' : status === 'at_risk' ? '#f59e0b' : '#ef4444';
  const emoji  = status === 'safe' ? '🟢' : status === 'at_risk' ? '🟡' : '🔴';
  return { score, status, trend, color, emoji, daysAgo, recent30: r30 };
}

// ─── Contextual Side Panel ─────────────────────────────────────────────────────
function ContextPanel({ allMemberships, checkIns, myClasses, now, openModal }) {
  const D = {
    surface: '#0c1a2e', card: '#060c14', border: 'rgba(255,255,255,0.07)',
    t1: '#f0f4f8', t2: '#94a3b8', t3: '#475569', t4: '#2d3f55',
    red: '#ef4444', amber: '#f59e0b', green: '#10b981', blue: '#38bdf8',
  };

  const btnStyle = (color) => ({
    display:'flex', alignItems:'center', gap:4, padding:'4px 9px', borderRadius:7,
    background:`${color}0e`, border:`1px solid ${color}22`, color, fontSize:10,
    fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit',
  });

  // A. Today's Exceptions: no-shows + late cancels
  const todayExceptions = useMemo(() => {
    const noShows = myClasses.flatMap(cls => {
      const booked   = cls.bookings || [];
      const attended = checkIns.filter(c => isSameDay(new Date(c.check_in_date), now));
      return booked.filter(b => !attended.some(a => a.user_id === b.user_id))
        .map(b => ({ ...b, className: cls.name, type: 'no_show', reason: `Booked "${cls.name}" — didn't show` }));
    });
    const lateCancels = myClasses.flatMap(cls =>
      (cls.late_cancels || []).filter(lc => {
        const d = lc.cancelled_at ? new Date(lc.cancelled_at) : null;
        return d && isSameDay(d, now);
      }).map(lc => ({ ...lc, className: cls.name, type: 'late_cancel', reason: `Late cancellation — "${cls.name}"` }))
    );
    return [...noShows, ...lateCancels].slice(0, 6);
  }, [myClasses, checkIns, now]);

  // B. Clients with no upcoming sessions this week
  const notScheduled = useMemo(() => {
    const weekEnd = addDays(startOfDay(now), 7);
    const bookedThisWeek = new Set(
      myClasses.flatMap(cls => (cls.bookings || []).map(b => b.user_id))
    );
    return allMemberships.filter(m => {
      if (bookedThisWeek.has(m.user_id)) return false;
      const r30 = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) < 30*864e5).length;
      return r30 >= 2; // only surface members who were somewhat active
    }).slice(0, 5);
  }, [allMemberships, myClasses, checkIns, now]);

  // C. Attendance irregularities
  const irregulars = useMemo(() => {
    return allMemberships.map(m => {
      const rs   = calcRS(m.user_id, checkIns, now);
      if (rs.status === 'safe') return null;
      const r30  = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) < 30*864e5).length;
      const p30  = checkIns.filter(c => c.user_id===m.user_id && (now-new Date(c.check_in_date)) >= 30*864e5 && (now-new Date(c.check_in_date)) < 60*864e5).length;
      let reason='', action='';
      if (rs.daysAgo > 21)           { reason = `${rs.daysAgo}d without visiting`; action = 'Book session'; }
      else if (p30 > 0 && r30 < p30 * 0.5) { reason = `Visits down ${Math.round((1-r30/p30)*100)}% vs last month`; action = 'Send check-in'; }
      else                           { reason = 'Low engagement this month'; action = 'Message'; }
      return { ...m, rs, reason, action };
    }).filter(Boolean).sort((a,b) => a.rs.score - b.rs.score).slice(0, 5);
  }, [allMemberships, checkIns, now]);

  const SH = ({ icon: Icon, label, color, count }) => (
    <div style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 14px', borderBottom:`1px solid ${D.border}` }}>
      <div style={{ width:22, height:22, borderRadius:6, background:`${color}12`, border:`1px solid ${color}22`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon style={{ width:10, height:10, color }}/>
      </div>
      <span style={{ fontSize:11, fontWeight:800, color:D.t1, flex:1 }}>{label}</span>
      {count > 0 && <span style={{ fontSize:9, fontWeight:800, color, background:`${color}12`, border:`1px solid ${color}22`, borderRadius:99, padding:'1px 6px' }}>{count}</span>}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

      {/* A. Today's Exceptions */}
      <div style={{ borderRadius:14, background:D.surface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
        <SH icon={AlertTriangle} label="Today's Exceptions" color={D.red} count={todayExceptions.length}/>
        <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
          {todayExceptions.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 2px' }}>
              <CheckCircle style={{ width:12, height:12, color:D.green, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:D.green, fontWeight:600 }}>No exceptions today</span>
            </div>
          ) : todayExceptions.map((m, i) => (
            <div key={i} style={{ padding:'9px 11px', borderRadius:9, background:D.card, border:`1px solid ${m.type==='no_show'?`${D.red}20`:`${D.amber}20`}`, borderLeft:`2px solid ${m.type==='no_show'?D.red:D.amber}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:D.t1 }}>{m.user_name || 'Client'}</div>
              <div style={{ fontSize:10, color:D.t3, margin:'2px 0 6px' }}>{m.reason}</div>
              <div style={{ display:'flex', gap:5 }}>
                <button style={btnStyle(D.blue)} onClick={() => openModal('post', { memberId: m.user_id })}>
                  <MessageCircle style={{ width:9, height:9 }}/> Message
                </button>
                {m.type === 'no_show' && (
                  <button style={btnStyle(D.amber)} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })}>
                    <Calendar style={{ width:9, height:9 }}/> Rebook
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* B. Not Scheduled This Week */}
      <div style={{ borderRadius:14, background:D.surface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
        <SH icon={UserX} label="Not Booked This Week" color={D.amber} count={notScheduled.length}/>
        <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
          {notScheduled.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 2px' }}>
              <CheckCircle style={{ width:12, height:12, color:D.green, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:D.green, fontWeight:600 }}>All active clients are booked</span>
            </div>
          ) : notScheduled.map((m, i) => {
            const rs = calcRS(m.user_id, checkIns, now);
            return (
              <div key={i} style={{ padding:'9px 11px', borderRadius:9, background:D.card, border:`1px solid ${D.border}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:D.t1 }}>{m.user_name || 'Client'}</div>
                    <div style={{ fontSize:9, color:D.t3 }}>{rs.emoji} {rs.label} · {rs.recent30} visits this month</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:5 }}>
                  <button style={btnStyle(D.amber)} onClick={() => openModal('bookIntoClass', { memberId: m.user_id, memberName: m.user_name })}>
                    <Calendar style={{ width:9, height:9 }}/> Book Session
                  </button>
                  <button style={btnStyle(D.blue)} onClick={() => openModal('post', { memberId: m.user_id })}>
                    <MessageCircle style={{ width:9, height:9 }}/> Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* C. Attendance Irregularities */}
      <div style={{ borderRadius:14, background:D.surface, border:`1px solid ${D.border}`, overflow:'hidden' }}>
        <SH icon={TrendingDown} label="Attendance Irregularities" color={D.red} count={irregulars.length}/>
        <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:7 }}>
          {irregulars.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 2px' }}>
              <CheckCircle style={{ width:12, height:12, color:D.green, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:D.green, fontWeight:600 }}>Attendance looking healthy</span>
            </div>
          ) : irregulars.map((m, i) => (
            <div key={i} style={{ padding:'9px 11px', borderRadius:9, background:D.card, border:`1px solid ${m.rs.color}18`, borderLeft:`2px solid ${m.rs.color}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:D.t1 }}>{m.user_name || 'Client'}</div>
                  <div style={{ fontSize:9, color:D.t3 }}>{m.reason}</div>
                  <div style={{ fontSize:9, color:m.rs.color, marginTop:1, fontWeight:600 }}>→ {m.action}</div>
                </div>
                <div style={{ textAlign:'center', flexShrink:0 }}>
                  <div style={{ fontSize:12, fontWeight:900, color:m.rs.color }}>{m.rs.score}</div>
                  <div style={{ fontSize:7, color:D.t4, textTransform:'uppercase', letterSpacing:'0.05em' }}>score</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:5 }}>
                <button style={btnStyle(D.blue)} onClick={() => openModal('post', { memberId: m.user_id })}>
                  <MessageCircle style={{ width:9, height:9 }}/> Message
                </button>
                <button style={btnStyle('#a78bfa')} onClick={() => openModal('bookIntoClass', { memberId: m.user_id, memberName: m.user_name })}>
                  <Calendar style={{ width:9, height:9 }}/> Book
                </button>
                <button style={btnStyle('#10b981')} onClick={() => openModal('assignWorkout', { memberId: m.user_id, memberName: m.user_name })}>
                  <Dumbbell style={{ width:9, height:9 }}/> Workout
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Month view cell ──────────────────────────────────────────────────────────
function MonthCell({ date, isCurrentMonth, isSelected, isToday, classCount, checkInCount, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 5px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
        background: isSelected ? 'rgba(167,139,250,0.16)' : isToday ? 'rgba(167,139,250,0.07)' : 'transparent',
        border: isSelected ? '1px solid rgba(167,139,250,0.45)' : isToday ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
        transition: 'all 0.12s', opacity: isCurrentMonth ? 1 : 0.28,
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(167,139,250,0.07)' : 'transparent'; }}>
      <div style={{ fontSize: 13, fontWeight: isToday || isSelected ? 900 : 600, color: isSelected ? '#a78bfa' : isToday ? '#e2d9f3' : '#64748b', lineHeight: 1, marginBottom: 4 }}>
        {format(date, 'd')}
      </div>
      {classCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
          {Array.from({ length: Math.min(classCount, 3) }, (_, j) => (
            <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#a78bfa' : 'rgba(167,139,250,0.5)' }}/>
          ))}
        </div>
      )}
      {checkInCount > 0 && (
        <div style={{ fontSize: 8, fontWeight: 700, color: isSelected ? '#a78bfa' : '#3a5070' }}>{checkInCount}</div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabCoachSchedule({
  myClasses, checkIns, events, allMemberships = [], avatarMap, openModal, now,
}) {
  const [calView,       setCalView]       = useState('week');   // 'day' | 'week' | 'month'
  const [selectedDate,  setSelectedDate]  = useState(now);
  const [monthDate,     setMonthDate]     = useState(now);
  const [expandedClass, setExpandedClass] = useState(null);
  const [activePane,    setActivePane]    = useState({});
  const [rosterSearch,  setRosterSearch]  = useState('');
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [showTypeMenu,  setShowTypeMenu]  = useState(false);
  const [lateCancelOpen,setLateCancelOpen]= useState(false);

  const gymId = allMemberships[0]?.gym_id || null;

  // ── Persisted data ───────────────────────────────────────────────────────
  const [attendance,       setAttendance]       = useState(() => { try { return JSON.parse(localStorage.getItem('coachAttendanceSheets')   || '{}'); } catch { return {}; } });
  const [notes,            setNotes]            = useState(() => { try { return JSON.parse(localStorage.getItem('coachSessionNotes')        || '{}'); } catch { return {}; } });
  const [cancelledClasses, setCancelledClasses] = useState(() => { try { return JSON.parse(localStorage.getItem('coachCancelledClasses')   || '[]'); } catch { return []; } });
  const [classAnnounce,    setClassAnnounce]    = useState(() => { try { return JSON.parse(localStorage.getItem('coachClassAnnouncements') || '{}'); } catch { return {}; } });

  useEffect(() => {
    if (!gymId) return;
    base44.functions.invoke('coachData', { action: 'read', gymId })
      .then(result => {
        if (!result?.data) return;
        const d = result.data;
        if (d.attendance_sheets    && Object.keys(d.attendance_sheets).length)    { setAttendance(d.attendance_sheets);    try { localStorage.setItem('coachAttendanceSheets',   JSON.stringify(d.attendance_sheets)); } catch {} }
        if (d.session_notes        && Object.keys(d.session_notes).length)        { setNotes(d.session_notes);             try { localStorage.setItem('coachSessionNotes',        JSON.stringify(d.session_notes)); } catch {} }
        if (Array.isArray(d.cancelled_classes) && d.cancelled_classes.length)     { setCancelledClasses(d.cancelled_classes); try { localStorage.setItem('coachCancelledClasses', JSON.stringify(d.cancelled_classes)); } catch {} }
        if (d.class_announcements  && Object.keys(d.class_announcements).length)  { setClassAnnounce(d.class_announcements); try { localStorage.setItem('coachClassAnnouncements', JSON.stringify(d.class_announcements)); } catch {} }
      })
      .catch(() => {});
  }, [gymId]);

  const writeThrough = (field, data, lsKey) => {
    try { localStorage.setItem(lsKey, JSON.stringify(data)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field, data }).catch(() => {});
  };

  const saveNote       = (key, val) => { const u = { ...notes, [key]: val }; setNotes(u); writeThrough('session_notes', u, 'coachSessionNotes'); };
  const saveAnnounce   = (key, val) => { const u = { ...classAnnounce, [key]: val }; setClassAnnounce(u); writeThrough('class_announcements', u, 'coachClassAnnouncements'); };

  const toggleAttendance = (rosterKey, uid) => {
    const sheet = attendance[rosterKey] || [];
    const u     = { ...attendance, [rosterKey]: sheet.includes(uid) ? sheet.filter(id => id !== uid) : [...sheet, uid] };
    setAttendance(u); writeThrough('attendance_sheets', u, 'coachAttendanceSheets');
  };
  const markAllPresent = (rosterKey) => {
    const u = { ...attendance, [rosterKey]: allMemberships.map(m => m.user_id) };
    setAttendance(u); writeThrough('attendance_sheets', u, 'coachAttendanceSheets');
  };
  const clearAttendance = (rosterKey) => {
    const u = { ...attendance, [rosterKey]: [] };
    setAttendance(u); writeThrough('attendance_sheets', u, 'coachAttendanceSheets');
  };
  const cancelClass = (cls, dateStr) => {
    const key = `${cls.id}-${dateStr}`;
    const u   = [...cancelledClasses, key];
    setCancelledClasses(u); writeThrough('cancelled_classes', u, 'coachCancelledClasses');
    setConfirmCancel(null); setExpandedClass(null);
  };
  const reinstateClass = (cls, dateStr) => {
    const key = `${cls.id}-${dateStr}`;
    const u   = cancelledClasses.filter(k => k !== key);
    setCancelledClasses(u); writeThrough('cancelled_classes', u, 'coachCancelledClasses');
  };

  // ── Calendar helpers ────────────────────────────────────────────────────
  const selDateStr  = format(selectedDate, 'yyyy-MM-dd');
  const isToday     = isSameDay(selectedDate, now);

  // Week days for the 7-day strip
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const week      = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Month grid
  const monthStart  = startOfMonth(monthDate);
  const monthEnd    = endOfMonth(monthDate);
  const gridStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const monthDays   = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const dayCheckIns = (day) => checkIns.filter(c => isSameDay(new Date(c.check_in_date), day));
  const selCIs      = dayCheckIns(selectedDate);

  const dayCounts   = useMemo(() => week.map(d => dayCheckIns(d).length), [week, checkIns]);

  const navigate = (dir) => {
    if (calView === 'day')   setSelectedDate(d => dir > 0 ? addDays(d, 1) : subDays(d, 1));
    if (calView === 'week')  setSelectedDate(d => dir > 0 ? addDays(d, 7) : subDays(d, 7));
    if (calView === 'month') setMonthDate(d => dir > 0 ? addDays(startOfMonth(d), 32) : subDays(startOfMonth(d), 1));
  };

  // 30-day sparkline
  const last30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return { label: format(d, 'MMM d'), count: dayCheckIns(d).length };
  }), [checkIns, now]);
  const maxCount30 = Math.max(...last30.map(d => d.count), 1);

  // ── Class enrichment ────────────────────────────────────────────────────
  const appointments = useMemo(() => myClasses.filter(c => c.type === 'personal_training' || c.is_appointment || c.type === 'pt'), [myClasses]);
  const groupClasses = useMemo(() => myClasses.filter(c => !c.type || (c.type !== 'personal_training' && !c.is_appointment && c.type !== 'pt')), [myClasses]);

  const classesWithData = useMemo(() => {
    let cls = groupClasses;
    if (typeFilter !== 'all') cls = cls.filter(c => {
      const name = (c.name || c.class_type || c.type || '').toLowerCase();
      return name.includes(typeFilter);
    });
    return cls.map(cls => {
      const typeCfg     = getClassTypeCfg(cls);
      const c           = typeCfg.color;
      const capacity    = cls.max_capacity || cls.capacity || 20;
      const booked      = cls.bookings || [];
      const waitlist    = cls.waitlist || [];
      const isCancelled = cancelledClasses.includes(`${cls.id}-${selDateStr}`);
      const lateCancels = getLateCancel(cls, now);
      const revenue     = calcRevenue(cls, allMemberships);
      const attended    = selCIs.filter(ci => {
        if (!cls.schedule) return false;
        const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!match) return false;
        let sh = parseInt(match[1]);
        if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
        const h = new Date(ci.check_in_date).getHours();
        return h === sh || h === sh + 1;
      });
      const classHour = (() => {
        if (!cls.schedule) return null;
        const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!match) return null;
        let h = parseInt(match[1]);
        if (match[2].toLowerCase() === 'pm' && h !== 12) h += 12;
        return h;
      })();
      const freq = {};
      if (classHour !== null) {
        checkIns.forEach(ci => {
          const h = new Date(ci.check_in_date).getHours();
          if (h === classHour || h === classHour + 1) freq[ci.user_id] = (freq[ci.user_id] || 0) + 1;
        });
      }
      const regulars = allMemberships.filter(m => (freq[m.user_id] || 0) >= 2);
      const fill     = booked.length > 0
        ? Math.min(100, Math.round((booked.length / capacity) * 100))
        : Math.min(100, Math.round((attended.length / capacity) * 100));
      return { ...cls, attended, capacity, booked, waitlist, regulars, fill, isCancelled, typeCfg, revenue, lateCancels };
    });
  }, [groupClasses, selCIs, checkIns, allMemberships, cancelledClasses, selDateStr, typeFilter, now]);

  // ── Week / month class lookup (for calendar dots) ────────────────────────
  const classCountForDay = (day) => groupClasses.length; // simplified — in real app filter by DOW schedule

  // ── Summary KPIs ────────────────────────────────────────────────────────
  const totalBookedWeek     = groupClasses.reduce((s, c) => s + (c.bookings?.length || 0), 0);
  const totalWaitlistWeek   = groupClasses.reduce((s, c) => s + (c.waitlist?.length || 0), 0);
  const avgFill             = classesWithData.length > 0 ? Math.round(classesWithData.reduce((s, c) => s + c.fill, 0) / classesWithData.length) : 0;
  const totalRevToday       = classesWithData.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalLateCancels    = classesWithData.reduce((s, c) => s + c.lateCancels.length, 0);
  const allLateCancels      = classesWithData.flatMap(c => c.lateCancels.map(lc => ({ ...lc, className: c.name })));

  const upcomingEvents = useMemo(() =>
    events.filter(e => new Date(e.event_date) >= now)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 4),
    [events, now]);

  const filteredRoster = allMemberships.filter(m =>
    !rosterSearch || (m.user_name || '').toLowerCase().includes(rosterSearch.toLowerCase())
  );

  const inputStyle = { padding: '4px 8px', borderRadius: 7, background: '#060c18', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4f8', fontSize: 10, outline: 'none' };

  // Distinct class types for the filter
  const classTypes = useMemo(() => {
    const types = new Set(groupClasses.map(c => {
      const name = (c.name || c.class_type || c.type || '').toLowerCase();
      for (const key of Object.keys(CLASS_TYPE_CFG)) {
        if (name.includes(key) && key !== 'default') return key;
      }
      return null;
    }).filter(Boolean));
    return [...types];
  }, [groupClasses]);

  return (
    <>
      {/* Cancel confirm */}
      {confirmCancel && (
        <ConfirmDialog
          message={`Cancel "${confirmCancel.name}" on ${format(selectedDate, 'EEE, MMM d')}? Members will need to be notified manually.`}
          onConfirm={() => cancelClass(confirmCancel, selDateStr)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {/* Late cancel panel (slide-in overlay) */}
      {lateCancelOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setLateCancelOpen(false)}>
          <div style={{ width: 340, height: '100%', background: '#0a1628', borderLeft: '1px solid rgba(248,113,113,0.2)', padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#f0f4f8' }}>⚠️ Late Cancellations</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>Cancellations within {LATE_CANCEL_WINDOW_HRS}hr of class</div>
              </div>
              <button onClick={() => setLateCancelOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X style={{ width: 13, height: 13 }}/>
              </button>
            </div>
            {allLateCancels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#3a5070' }}>
                <CheckCircle style={{ width: 24, height: 24, opacity: 0.4, margin: '0 auto 10px' }}/>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No late cancellations today</p>
              </div>
            ) : allLateCancels.map((lc, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.18)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <MiniAvatar name={lc.user_name} src={null} size={28} color="#f87171"/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{lc.user_name || 'Member'}</div>
                    <div style={{ fontSize: 9, color: '#f87171', fontWeight: 600 }}>Late cancel · {lc.className}</div>
                  </div>
                </div>
                {lc.cancelled_at && (
                  <div style={{ fontSize: 10, color: '#64748b' }}>Cancelled at {format(new Date(lc.cancelled_at), 'h:mm a, MMM d')}</div>
                )}
                <button onClick={() => openModal('post', { memberId: lc.user_id, lateCancel: true })} style={{ marginTop: 8, width: '100%', padding: '6px', borderRadius: 7, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.22)', color: '#f87171', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                  Send policy reminder
                </button>
              </div>
            ))}
            <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', marginTop: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>Late Cancel Policy</div>
              <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
                Members who cancel within {LATE_CANCEL_WINDOW_HRS} hours may be charged a fee per your cancellation policy. You can send a reminder from each entry above.
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          <ScheduleKpi icon={Dumbbell}    label="Classes today"     value={classesWithData.length} sub={`${appointments.length} PT sessions`}   color="#a78bfa"/>
          <ScheduleKpi icon={Users}       label="Members expected"  value={totalBookedWeek}        sub="total bookings"                         color="#38bdf8" bar={Math.min(100, (totalBookedWeek / Math.max(allMemberships.length, 1)) * 100)}/>
          <ScheduleKpi icon={Activity}    label="Avg fill rate"     value={`${avgFill}%`}          sub="across all classes"                     color={avgFill >= 70 ? '#34d399' : avgFill >= 40 ? '#fbbf24' : '#f87171'} bar={avgFill}/>
          <ScheduleKpi icon={DollarSign}  label="Est. revenue today" value={totalRevToday > 0 ? `£${totalRevToday}` : '—'} sub="from today's classes"           color="#34d399"/>
          <ScheduleKpi
            icon={Ban}
            label="Late cancellations"
            value={totalLateCancels}
            sub={`within ${LATE_CANCEL_WINDOW_HRS}hr window`}
            color={totalLateCancels > 0 ? '#f87171' : '#34d399'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

          {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── CALENDAR HEADER ──────────────────────────────────────────── */}
            <div style={{ borderRadius: 18, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', padding: '16px 18px' }}>

              {/* View controls + navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                {/* View toggle */}
                <div style={{ display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, flexShrink: 0 }}>
                  {[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }].map(v => (
                    <button key={v.id} onClick={() => setCalView(v.id)} style={{ padding: '5px 12px', borderRadius: 7, border: calView === v.id ? '1px solid rgba(167,139,250,0.35)' : '1px solid transparent', background: calView === v.id ? 'rgba(167,139,250,0.12)' : 'transparent', color: calView === v.id ? '#a78bfa' : '#64748b', fontSize: 11, fontWeight: calView === v.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.12s' }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                {/* Month/week nav */}
                <button onClick={() => navigate(-1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft style={{ width: 13, height: 13 }}/>
                </button>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', flex: 1 }}>
                  {calView === 'month' ? format(monthDate, 'MMMM yyyy') : calView === 'week' ? `${format(week[0], 'MMM d')} – ${format(week[6], 'MMM d, yyyy')}` : format(selectedDate, 'EEEE, MMM d, yyyy')}
                </span>
                <button onClick={() => navigate(1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight style={{ width: 13, height: 13 }}/>
                </button>
                <button onClick={() => { setSelectedDate(now); setMonthDate(now); }} style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Today</button>
              </div>

              {/* ── WEEK STRIP ── */}
              {(calView === 'week' || calView === 'day') && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {week.map((d, i) => {
                    const isT    = isSameDay(d, now);
                    const active = isSameDay(d, selectedDate);
                    const count  = dayCounts[i];
                    return (
                      <button key={i} onClick={() => { setSelectedDate(d); setCalView('day'); setExpandedClass(null); }}
                        style={{ flex: 1, padding: '12px 4px 10px', borderRadius: 13, border: active ? '1px solid rgba(167,139,250,0.5)' : isT ? '1px solid rgba(167,139,250,0.22)' : '1px solid rgba(255,255,255,0.06)', background: active ? 'rgba(167,139,250,0.13)' : isT ? 'rgba(167,139,250,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', position: 'relative' }}>
                        <div style={{ fontSize: 8, fontWeight: 800, color: active ? '#a78bfa' : '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{format(d, 'EEE')}</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: active ? '#a78bfa' : isT ? '#f0f4f8' : '#64748b', lineHeight: 1, marginBottom: 6 }}>{format(d, 'd')}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 3 }}>
                          {Array.from({ length: Math.min(groupClasses.length, 4) }, (_, j) => (
                            <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: active ? '#a78bfa' : 'rgba(167,139,250,0.35)' }}/>
                          ))}
                        </div>
                        {count > 0 && <div style={{ fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#3a5070' }}>{count} in</div>}
                        {isT && !active && <div style={{ position: 'absolute', top: 6, right: 8, width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }}/>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── MONTH GRID ── */}
              {calView === 'month' && (
                <div>
                  {/* DOW headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 800, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                    {monthDays.map((d, i) => (
                      <MonthCell
                        key={i}
                        date={d}
                        isCurrentMonth={isSameMonth(d, monthDate)}
                        isSelected={isSameDay(d, selectedDate)}
                        isToday={isSameDay(d, now)}
                        classCount={classCountForDay(d)}
                        checkInCount={dayCheckIns(d).length}
                        onClick={() => { setSelectedDate(d); setCalView('day'); setExpandedClass(null); }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── CLASS TYPE FILTER + CLASS LIST HEADER ────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <div style={{ width: 3, height: 16, borderRadius: 99, background: '#38bdf8', flexShrink: 0 }}/>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>
                  {isToday ? `Today's Classes` : `${format(selectedDate, 'EEEE, MMM d')} Classes`}
                </span>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{selCIs.length} checked in</span>
              </div>
              {/* Type filter chips */}
              <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 1 }}>
                {['all', ...classTypes].map(type => {
                  const cfg = type === 'all' ? { color: '#a78bfa', label: 'All', emoji: '📋' } : CLASS_TYPE_CFG[type] || CLASS_TYPE_CFG.default;
                  return (
                    <button key={type} onClick={() => setTypeFilter(type)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, border: typeFilter === type ? `1px solid ${cfg.color}45` : '1px solid rgba(255,255,255,0.07)', background: typeFilter === type ? `${cfg.color}12` : 'transparent', color: typeFilter === type ? cfg.color : '#64748b', fontSize: 10, fontWeight: typeFilter === type ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.12s' }}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => openModal('classes')} style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 7, padding: '5px 11px', cursor: 'pointer', flexShrink: 0 }}>+ Add Class</button>
            </div>

            {/* ── CLASS CARDS ─────────────────────────────────────────────── */}
            {classesWithData.length === 0 ? (
              <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', padding: '36px', textAlign: 'center' }}>
                <Clock style={{ width: 22, height: 22, color: '#3a5070', margin: '0 auto 12px' }}/>
                <p style={{ fontSize: 13, color: '#3a5070', fontWeight: 700, margin: '0 0 4px' }}>No classes on this day</p>
                <p style={{ fontSize: 11, color: '#3a5070', margin: '0 0 16px' }}>{typeFilter !== 'all' ? 'Try clearing the type filter' : 'Add your first class to get started'}</p>
                <button onClick={() => openModal('classes')} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 9, padding: '8px 16px', cursor: 'pointer' }}>Add a Class</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {classesWithData.map((cls, idx) => {
                  const { typeCfg } = cls;
                  const c           = typeCfg.color;
                  const key         = `${cls.id}-${selDateStr}`;
                  const fillColor   = cls.fill >= 80 ? '#34d399' : cls.fill >= 50 ? '#fbbf24' : '#38bdf8';
                  const isOpen      = expandedClass === cls.id;
                  const pane        = activePane[key] || 'roster';
                  const manualIds   = attendance[key] || [];
                  const checkedIds  = cls.attended.map(ci => ci.user_id);
                  const totalPresent= [...new Set([...manualIds, ...checkedIds])].length;
                  const spotsLeft   = cls.capacity - (cls.booked.length || cls.attended.length);

                  return (
                    <div key={cls.id || idx} style={{ borderRadius: 18, background: '#0c1a2e', border: `1px solid ${isOpen ? c : 'rgba(255,255,255,0.07)'}`, overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: isOpen ? `0 0 0 1px ${c}20` : 'none' }}>

                      {/* Top color bar */}
                      <div style={{ height: 3, background: cls.isCancelled ? 'linear-gradient(90deg,#ef4444,#f87171)' : `linear-gradient(90deg,${c},${c}66)` }}/>

                      {/* Card body */}
                      <div style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          {/* Type icon */}
                          <div style={{ width: 44, height: 44, borderRadius: 13, background: `${c}18`, border: `1px solid ${c}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                            {typeCfg.emoji}
                          </div>

                          {/* Class info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 16, fontWeight: 900, color: cls.isCancelled ? '#475569' : '#f0f4f8', letterSpacing: '-0.01em' }}>{cls.name}</span>
                              {/* Type badge */}
                              <span style={{ fontSize: 9, fontWeight: 800, color: c, background: `${c}12`, border: `1px solid ${c}25`, borderRadius: 5, padding: '1px 7px' }}>{typeCfg.label}</span>
                              {/* Recurring badge */}
                              {cls.is_recurring && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 5, padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <Repeat style={{ width: 8, height: 8 }}/>{cls.recurrence || 'Weekly'}
                                </span>
                              )}
                              {cls.isCancelled && <span style={{ fontSize: 9, fontWeight: 800, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 5, padding: '1px 7px' }}>CANCELLED</span>}
                              {cls.difficulty && !cls.isCancelled && <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '1px 6px' }}>{cls.difficulty}</span>}
                            </div>

                            {/* Meta row */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                              {cls.schedule && (
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                                  🕐 {cls.schedule}
                                </span>
                              )}
                              {cls.duration_minutes && <span style={{ fontSize: 11, color: '#64748b' }}>{cls.duration_minutes}min</span>}
                              {/* Room/location */}
                              {(cls.room || cls.location) && (
                                <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <MapPin style={{ width: 9, height: 9, color: '#475569' }}/>{cls.room || cls.location}
                                </span>
                              )}
                              {/* Booking count */}
                              <span style={{ fontSize: 11, color: fillColor, fontWeight: 800 }}>
                                {cls.booked.length > 0 ? cls.booked.length : cls.attended.length}
                                <span style={{ color: '#3a5070', fontWeight: 400 }}>/{cls.capacity}</span>
                              </span>
                              {spotsLeft <= 3 && spotsLeft > 0 && <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>{spotsLeft} spots left!</span>}
                              {spotsLeft <= 0 && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 800 }}>🔴 Full</span>}
                              {cls.waitlist.length > 0 && <span style={{ fontSize: 10, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>{cls.waitlist.length} waitlisted</span>}
                              {/* Late cancels alert */}
                              {cls.lateCancels.length > 0 && (
                                <span onClick={() => setLateCancelOpen(true)} style={{ fontSize: 10, color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 5, padding: '1px 6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <AlertTriangle style={{ width: 9, height: 9 }}/>{cls.lateCancels.length} late cancel{cls.lateCancels.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            {/* Fill bar + revenue */}
                            {!cls.isCancelled && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}99)`, borderRadius: 99, transition: 'width 0.6s ease' }}/>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: fillColor, flexShrink: 0, minWidth: 30 }}>{cls.fill}%</span>
                                {cls.revenue !== null && cls.revenue > 0 && (
                                  <span style={{ fontSize: 10, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 6, padding: '1px 8px', flexShrink: 0 }}>
                                    £{cls.revenue} est.
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right actions */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
                            {!cls.isCancelled && (
                              <button onClick={() => openModal('qrScanner', cls)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.1))', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.28)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.1))'}>
                                <QrCode style={{ width: 12, height: 12 }}/> Start Check-In
                              </button>
                            )}
                            <button onClick={() => { setExpandedClass(isOpen ? null : cls.id); setActivePane(p => ({ ...p, [key]: 'roster' })); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, background: isOpen ? `${c}16` : 'rgba(255,255,255,0.04)', border: `1px solid ${isOpen ? `${c}35` : 'rgba(255,255,255,0.08)'}`, color: isOpen ? c : '#64748b', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              {isOpen ? <ChevronUp style={{ width: 10, height: 10 }}/> : <ChevronDown style={{ width: 10, height: 10 }}/>}
                              {isOpen ? 'Close' : 'Manage'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ── EXPANDED PANEL ── */}
                      {isOpen && (
                        <div style={{ borderTop: `1px solid ${c}20`, background: `${c}03` }}>
                          {/* Sub-tab strip */}
                          <div style={{ display: 'flex', borderBottom: `1px solid ${c}12`, overflowX: 'auto' }}>
                            {[
                              { id: 'roster',     label: `👥 Members (${cls.booked.length || cls.regulars.length})` },
                              { id: 'waitlist',   label: `⏳ Waitlist (${cls.waitlist.length})`                    },
                              { id: 'attendance', label: `✅ Attendance (${totalPresent})`                          },
                              { id: 'announce',   label: '📢 Announcement'                                          },
                            ].map(t => (
                              <button key={t.id} onClick={() => setActivePane(p => ({ ...p, [key]: t.id }))}
                                style={{ flex: 1, padding: '10px 8px', background: 'none', border: 'none', borderBottom: pane === t.id ? `2px solid ${c}` : '2px solid transparent', color: pane === t.id ? c : '#3a5070', fontSize: 10, fontWeight: pane === t.id ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                                {t.label}
                              </button>
                            ))}
                          </div>

                          {/* ── ROSTER pane ── */}
                          {pane === 'roster' && (
                            <div style={{ padding: '14px 16px' }}>
                              {(cls.booked.length > 0 || cls.regulars.length > 0) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {(cls.booked.length > 0 ? cls.booked : cls.regulars).map((m, j) => {
                                    const isCheckedIn = checkedIds.includes(m.user_id) || manualIds.includes(m.user_id);
                                    const isCancelled = (cls.late_cancels || []).some(lc => lc.user_id === m.user_id);
                                    const attendeeStatus = isCheckedIn ? 'confirmed' : isCancelled ? 'cancelled' : 'booked';
                                    const statusCfg = {
                                      confirmed: { label: '✓ Confirmed', color: '#34d399' },
                                      cancelled: { label: '✗ Cancelled', color: '#f87171' },
                                      booked:    { label: 'Booked',      color: '#a78bfa' },
                                    }[attendeeStatus];
                                    return (
                                      <div key={m.user_id || j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, background: isCheckedIn ? 'rgba(52,211,153,0.06)' : isCancelled ? 'rgba(248,113,113,0.04)' : 'rgba(255,255,255,0.025)', border: `1px solid ${isCheckedIn ? 'rgba(52,211,153,0.2)' : isCancelled ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.06)'}` }}>
                                        <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={30} color={statusCfg.color}/>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                                          {m.membership_type && <div style={{ fontSize: 9, color: '#3a5070' }}>{m.membership_type}</div>}
                                        </div>
                                        <StatusPill label={statusCfg.label} color={statusCfg.color}/>
                                        {!isCheckedIn && !isCancelled && (
                                          <button onClick={() => openModal('post', { memberId: m.user_id })} style={{ fontSize:9, fontWeight:700, color:'#38bdf8', background:'rgba(56,189,248,0.07)', border:'1px solid rgba(56,189,248,0.18)', borderRadius:6, padding:'3px 7px', cursor:'pointer', flexShrink:0 }}>
                                            Message
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center', padding: '18px 0' }}>
                                  <Users style={{ width: 20, height: 20, color: '#3a5070', margin: '0 auto 8px' }}/>
                                  <p style={{ fontSize: 11, color: '#3a5070', fontWeight: 600, margin: 0 }}>
                                    {cls.attended.length > 0 ? `${cls.attended.length} member${cls.attended.length !== 1 ? 's' : ''} checked in` : 'No bookings yet'}
                                  </p>
                                </div>
                              )}
                              {/* Walk-ins */}
                              {cls.attended.filter(ci => !cls.booked.some(b => b.user_id === ci.user_id)).length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Walk-ins / Drop-ins</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {cls.attended.filter(ci => !cls.booked.some(b => b.user_id === ci.user_id)).map((ci, j) => (
                                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 8, background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.18)' }}>
                                        <MiniAvatar name={ci.user_name} src={avatarMap[ci.user_id]} size={18} color="#38bdf8"/>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#f0f4f8' }}>{ci.user_name || 'Member'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Promote to class from waitlist shortcut */}
                              {cls.waitlist.length > 0 && spotsLeft > 0 && (
                                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.16)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <Users style={{ width: 13, height: 13, color: '#34d399', flexShrink: 0 }}/>
                                  <div style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>
                                    <span style={{ fontWeight: 700, color: '#34d399' }}>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} available</span> — {cls.waitlist.length} waiting
                                  </div>
                                  <button onClick={() => openModal('promoteWaitlist', cls.waitlist[0])} style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                                    Promote next →
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── WAITLIST pane ── */}
                          {pane === 'waitlist' && (
                            <div style={{ padding: '14px 16px' }}>
                              {cls.waitlist.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '18px 0' }}>
                                  <CheckCircle style={{ width: 20, height: 20, color: '#34d399', margin: '0 auto 8px' }}/>
                                  <p style={{ fontSize: 11, color: '#34d399', fontWeight: 700, margin: 0 }}>No one on the waitlist</p>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                  {cls.waitlist.map((w, j) => (
                                    <div key={w.user_id || j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.14)' }}>
                                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#f87171', flexShrink: 0 }}>{j + 1}</div>
                                      <MiniAvatar name={w.user_name} src={avatarMap[w.user_id]} size={30} color="#f87171"/>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.user_name || 'Member'}</div>
                                        {w.wait_since && <div style={{ fontSize: 9, color: '#64748b' }}>Waiting since {format(new Date(w.wait_since), 'MMM d, h:mm a')}</div>}
                                      </div>
                                      <button onClick={() => openModal('promoteWaitlist', w)} style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', flexShrink: 0 }}>
                                        ↑ Move up
                                      </button>
                                      <button onClick={() => openModal('post', { memberId: w.user_id, waitlistPromo: true })} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', flexShrink: 0 }}>
                                        Notify
                                      </button>
                                    </div>
                                  ))}
                                  <div style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 10, color: '#64748b', textAlign: 'center' }}>
                                    {spotsLeft <= 0 ? '🔴 Class full — promote a member if a spot opens' : `🟢 ${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} available — promote from waitlist`}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── ATTENDANCE pane ── */}
                          {pane === 'attendance' && (
                            <div style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                                <input value={rosterSearch} onChange={e => setRosterSearch(e.target.value)} placeholder="Search member…" style={{ ...inputStyle, flex: 1, minWidth: 110 }}/>
                                <button onClick={() => markAllPresent(key)} style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>All Present</button>
                                <button onClick={() => clearAttendance(key)} style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Clear</button>
                              </div>
                              <div style={{ maxHeight: 300, overflowY: 'auto', borderRadius: 11, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                {filteredRoster.length === 0
                                  ? <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '16px 0', margin: 0 }}>No members match</p>
                                  : filteredRoster.map((m, mi) => {
                                    const isManual = manualIds.includes(m.user_id);
                                    const isQR     = checkedIds.includes(m.user_id);
                                    const present  = isManual || isQR;
                                    return (
                                      <div key={m.user_id || mi}
                                        onClick={() => !isQR && toggleAttendance(key, m.user_id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderBottom: mi < filteredRoster.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: isQR ? 'default' : 'pointer', background: present ? 'rgba(52,211,153,0.04)' : 'transparent', transition: 'background 0.1s' }}>
                                        <div style={{ width: 19, height: 19, borderRadius: 6, border: `1.5px solid ${present ? '#34d399' : 'rgba(255,255,255,0.15)'}`, background: present ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.1s' }}>
                                          {present && <Check style={{ width: 10, height: 10, color: '#fff' }}/>}
                                        </div>
                                        <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={26} color={present ? '#34d399' : '#475569'}/>
                                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: present ? '#d4fae8' : '#94a3b8' }}>{m.user_name || 'Member'}</span>
                                        {isQR      && <StatusPill label="QR ✓"   color="#34d399"/>}
                                        {isManual && !isQR && <StatusPill label="Manual" color="#a78bfa"/>}
                                      </div>
                                    );
                                  })
                                }
                              </div>
                              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{totalPresent} present · {Math.max(0, filteredRoster.length - totalPresent)} absent</span>
                                <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${filteredRoster.length > 0 ? (totalPresent / filteredRoster.length) * 100 : 0}%`, background: 'linear-gradient(90deg,#34d399,#10b981)', borderRadius: 99 }}/>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ── ANNOUNCEMENT pane ── */}
                          {pane === 'announce' && (
                            <div style={{ padding: '14px 16px' }}>
                              <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                📢 Class Announcement
                                {classAnnounce[key] && <span style={{ color: '#34d399', fontWeight: 700 }}>✓ saved · visible to members</span>}
                              </div>
                              <textarea
                                value={classAnnounce[key] || ''}
                                onChange={e => saveAnnounce(key, e.target.value)}
                                placeholder="Write a note that members will see before this class… e.g. 'Bring a resistance band today! We'll be going heavy on lower body.'"
                                style={{ width: '100%', minHeight: 80, padding: '9px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                                onFocus={e => e.target.style.borderColor = `${c}40`}
                                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                              />
                              <button onClick={() => openModal('post', { classId: cls.id, announcement: classAnnounce[key] })} style={{ marginTop: 9, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: `${c}0f`, border: `1px solid ${c}25`, color: c, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                <Bell style={{ width: 11, height: 11 }}/> Push to members
                              </button>
                            </div>
                          )}

                          {/* ── ACTION STRIP ── */}
                          <div style={{ padding: '12px 16px', borderTop: `1px solid ${c}12`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', background: `${c}02` }}>
                            <button onClick={() => openModal('post', { classId: cls.id })}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              <Bell style={{ width: 11, height: 11 }}/> Send Reminder
                            </button>
                            <button onClick={() => openModal('editClass', cls)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, background: `${c}0a`, border: `1px solid ${c}22`, color: c, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              <Pencil style={{ width: 11, height: 11 }}/> Edit Class
                            </button>
                            {cls.isCancelled ? (
                              <button onClick={() => reinstateClass(cls, selDateStr)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                <RefreshCw style={{ width: 11, height: 11 }}/> Reinstate
                              </button>
                            ) : (
                              <button onClick={() => setConfirmCancel(cls)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}>
                                <X style={{ width: 11, height: 11 }}/> Cancel Class
                              </button>
                            )}
                          </div>

                          {/* Session notes */}
                          <div style={{ padding: '0 16px 14px' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <ClipboardList style={{ width: 9, height: 9 }}/> Coach Session Notes (Private)
                              {notes[key] && <span style={{ color: '#34d399' }}>✓ saved</span>}
                            </div>
                            <textarea
                              value={notes[key] || ''}
                              onChange={e => saveNote(key, e.target.value)}
                              placeholder="Cues, modifications used, what worked, what to improve next time…"
                              style={{ width: '100%', minHeight: 52, padding: '7px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                              onFocus={e => e.target.style.borderColor = `${c}40`}
                              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── PT / APPOINTMENTS ──────────────────────────────────────────── */}
            {appointments.length > 0 && (
              <div>
                <SectionLabel accent="#38bdf8" action={
                  <button onClick={() => openModal('bookAppointment')} style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>+ Book</button>
                }>PT / 1:1 Appointments</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 10 }}>
                  {appointments.map((apt, i) => {
                    const m = allMemberships.find(x => x.user_id === apt.client_id || x.user_id === apt.user_id);
                    return (
                      <div key={apt.id || i} style={{ borderRadius: 14, background: '#0c1a2e', border: '1px solid rgba(56,189,248,0.18)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative' }}>
                          <MiniAvatar name={apt.client_name || m?.user_name || 'Client'} src={avatarMap[apt.client_id || apt.user_id]} size={38} color="#38bdf8"/>
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: '#38bdf8', border: '2px solid #0c1a2e' }}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.client_name || m?.user_name || 'Client'}</div>
                          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                            🕐 {apt.schedule || apt.time || 'Time TBD'}
                            {apt.session_type && <span style={{ color: '#38bdf8', fontWeight: 700 }}>· {apt.session_type}</span>}
                            {apt.duration_minutes && <span>· {apt.duration_minutes}min</span>}
                          </div>
                          {apt.notes && <div style={{ fontSize: 9, color: '#475569', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.notes}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                          <button onClick={() => openModal('qrScanner')} style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}>Check In</button>
                          <button onClick={() => openModal('memberNote', m)} style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}>Note</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>{/* end LEFT */}

          {/* ══ RIGHT SIDEBAR ═════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 0 }}>

            {/* Contextual retention + exceptions panel */}
            <ContextPanel allMemberships={allMemberships} checkIns={checkIns} myClasses={myClasses} now={now} openModal={openModal}/>

            {/* Quick Actions */}
            <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Quick Actions</span>
              </div>
              <div style={{ padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: QrCode,    label: 'Scan Check-In',    sub: 'Start a class',         color: '#10b981', fn: () => openModal('qrScanner')       },
                  { icon: Calendar,  label: 'Create Event',     sub: 'Add to calendar',       color: '#34d399', fn: () => openModal('event')            },
                  { icon: Dumbbell,  label: 'Manage Classes',   sub: 'Edit your timetable',   color: '#a78bfa', fn: () => openModal('classes')          },
                  { icon: Bell,      label: 'Send Reminder',    sub: 'Post to members',       color: '#38bdf8', fn: () => openModal('post')             },
                  { icon: Ban,       label: 'Late Cancels',     sub: `${totalLateCancels} flagged`, color: totalLateCancels > 0 ? '#f87171' : '#64748b', fn: () => setLateCancelOpen(true) },
                ].map(({ icon: Ic, label, sub, color, fn }, i) => (
                  <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 11, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left', width: '100%' }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${color}0f`; e.currentTarget.style.borderColor = `${color}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}16`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ic style={{ width: 13, height: 13, color }}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{label}</div>
                      <div style={{ fontSize: 10, color: color === '#64748b' ? '#3a5070' : totalLateCancels > 0 && label === 'Late Cancels' ? color : '#3a5070' }}>{sub}</div>
                    </div>
                    {label === 'Late Cancels' && totalLateCancels > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#f87171', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 99, padding: '1px 7px' }}>{totalLateCancels}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Week Summary */}
            <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Week Summary</span>
              </div>
              <div style={{ padding: '9px 14px' }}>
                {[
                  { label: 'Classes today',    value: classesWithData.length,     color: '#a78bfa' },
                  { label: 'Members expected', value: totalBookedWeek,             color: '#38bdf8' },
                  { label: 'Avg fill rate',    value: `${avgFill}%`,              color: avgFill >= 70 ? '#34d399' : avgFill >= 40 ? '#fbbf24' : '#f87171' },
                  { label: 'On waitlist',      value: totalWaitlistWeek,           color: totalWaitlistWeek > 0 ? '#f87171' : '#34d399' },
                  { label: 'PT sessions',      value: appointments.length,         color: '#38bdf8' },
                  { label: 'Est. revenue',     value: totalRevToday > 0 ? `£${totalRevToday}` : '—', color: '#34d399' },
                ].map((s, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ fontSize: 11, color: '#7a93ad', fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}20`, borderRadius: 6, padding: '1px 8px' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Class type breakdown */}
            {classTypes.length > 0 && (
              <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Class Types Today</span>
                </div>
                <div style={{ padding: '9px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {classTypes.map(type => {
                    const cfg      = CLASS_TYPE_CFG[type] || CLASS_TYPE_CFG.default;
                    const count    = classesWithData.filter(c => (c.name || '').toLowerCase().includes(type)).length;
                    const avgFillT = classesWithData.filter(c => (c.name || '').toLowerCase().includes(type)).reduce((s, c) => s + c.fill, 0) / Math.max(count, 1);
                    return (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: 13 }}>{cfg.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                            <span style={{ fontSize: 10, color: '#64748b' }}>{count} class{count !== 1 ? 'es' : ''} · {Math.round(avgFillT)}% full</span>
                          </div>
                          <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${avgFillT}%`, background: cfg.color, borderRadius: 99 }}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Upcoming Events</span>
                  <button onClick={() => openModal('event')} style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>+ New</button>
                </div>
                <div style={{ padding: '8px 14px' }}>
                  {upcomingEvents.map((ev, i) => {
                    const d    = new Date(ev.event_date);
                    const diff = Math.floor((d - now) / 86400000);
                    return (
                      <div key={ev.id || i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < upcomingEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: 9, padding: '5px 8px', textAlign: 'center', minWidth: 34 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d, 'd')}</div>
                          <div style={{ fontSize: 7, fontWeight: 800, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d, 'MMM')}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                          <div style={{ fontSize: 9, color: diff <= 2 ? '#f87171' : '#64748b' }}>{diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `${diff}d away`}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 30-Day Client Activity */}
            <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>30-Day Client Activity</span>
              </div>
              <div style={{ padding: '14px 14px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 56 }}>
                  {last30.map((d, i) => {
                    const h       = d.count === 0 ? 2 : Math.max(4, (d.count / maxCount30) * 52);
                    const isLast3 = i >= 27;
                    return (
                      <div key={i} title={`${d.label}: ${d.count} check-ins`}
                        style={{ flex: 1, height: h, borderRadius: '2px 2px 1px 1px', background: isLast3 ? '#38bdf8' : 'rgba(56,189,248,0.28)', transition: 'height 0.4s ease', cursor: 'default' }}/>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 9, color: '#3a5070' }}>{format(subDays(now, 29), 'MMM d')}</span>
                  <span style={{ fontSize: 9, color: '#3a5070' }}>{format(subDays(now, 14), 'MMM d')}</span>
                  <span style={{ fontSize: 9, color: '#38bdf8', fontWeight: 700 }}>Today</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {[
                    { label: 'total',   value: last30.reduce((s, d) => s + d.count, 0), color: '#38bdf8' },
                    { label: 'peak',    value: maxCount30,                                color: '#a78bfa' },
                    { label: 'avg/day', value: (last30.reduce((s, d) => s + d.count, 0) / 30).toFixed(1), color: '#34d399' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: '#3a5070', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>{/* end RIGHT */}
        </div>
      </div>
    </>
  );
}