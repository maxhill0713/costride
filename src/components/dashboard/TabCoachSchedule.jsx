import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, subDays, startOfDay } from 'date-fns';
import {
  QrCode, Dumbbell, Calendar, Bell, Clock,
  Check, ChevronDown, ChevronUp, UserCheck,
  Users, AlertCircle, CheckCircle, RefreshCw,
  Pencil, Trash2, X, ClipboardList, User,
} from 'lucide-react';
import { CoachCard, MiniAvatar, classColor } from './CoachHelpers';

// ─── StatusPill ───────────────────────────────────────────────────────────────
function StatusPill({ label, color }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}25`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
      <div style={{ background: '#0d1526', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 16, padding: '24px 28px', maxWidth: 320, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <AlertCircle style={{ width: 18, height: 18, color: '#f87171' }}/>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', textAlign: 'center', margin: '0 0 18px', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel Class</button>
        </div>
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = '#a78bfa' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 3, height: 14, borderRadius: 99, background: accent, flexShrink: 0 }}/>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>{children}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabCoachSchedule({
  myClasses, checkIns, events, allMemberships = [], avatarMap, openModal, now,
}) {
  const todayIndex = 3;
  const [selectedDay,   setSelectedDay]   = useState(todayIndex);
  const [expandedClass, setExpandedClass] = useState(null);   // cls.id that's open
  const [activePane,    setActivePane]    = useState({});     // { [classKey]: 'roster'|'waitlist'|'attendance' }
  const [rosterSearch,  setRosterSearch]  = useState('');
  const [confirmCancel, setConfirmCancel] = useState(null);   // cls to confirm-cancel

  const gymId = allMemberships[0]?.gym_id || null;

  // ── Persisted schedule data — write-through to backend ───────────────────
  // SECURITY: Attendance records, session notes, and cancellations are coach
  // operational data. localStorage exposes them to shared-device access and XSS.
  // Backend is source of truth; localStorage is the immediate local cache.
  const [attendance, setAttendance] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachAttendanceSheets') || '{}'); } catch { return {}; }
  });
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachSessionNotes') || '{}'); } catch { return {}; }
  });
  const [cancelledClasses, setCancelledClasses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachCancelledClasses') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (!gymId) return;
    base44.functions.invoke('coachData', { action: 'read', gymId })
      .then(result => {
        if (!result?.data) return;
        const d = result.data;
        if (d.attendance_sheets && Object.keys(d.attendance_sheets).length) { setAttendance(d.attendance_sheets); localStorage.setItem('coachAttendanceSheets', JSON.stringify(d.attendance_sheets)); }
        if (d.session_notes    && Object.keys(d.session_notes).length)    { setNotes(d.session_notes);     localStorage.setItem('coachSessionNotes',    JSON.stringify(d.session_notes));    }
        if (Array.isArray(d.cancelled_classes) && d.cancelled_classes.length) { setCancelledClasses(d.cancelled_classes); localStorage.setItem('coachCancelledClasses', JSON.stringify(d.cancelled_classes)); }
      })
      .catch(() => {});
  }, [gymId]);

  const saveNote = (key, val) => {
    const u = { ...notes, [key]: val };
    setNotes(u);
    try { localStorage.setItem('coachSessionNotes', JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'session_notes', data: u }).catch(() => {});
  };

  const toggleAttendance = (rosterKey, uid) => {
    const sheet = attendance[rosterKey] || [];
    const u = { ...attendance, [rosterKey]: sheet.includes(uid) ? sheet.filter(id => id !== uid) : [...sheet, uid] };
    setAttendance(u);
    try { localStorage.setItem('coachAttendanceSheets', JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'attendance_sheets', data: u }).catch(() => {});
  };

  const markAllPresent = (rosterKey) => {
    const u = { ...attendance, [rosterKey]: allMemberships.map(m => m.user_id) };
    setAttendance(u);
    try { localStorage.setItem('coachAttendanceSheets', JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'attendance_sheets', data: u }).catch(() => {});
  };

  const clearAttendance = (rosterKey) => {
    const u = { ...attendance, [rosterKey]: [] };
    setAttendance(u);
    try { localStorage.setItem('coachAttendanceSheets', JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'attendance_sheets', data: u }).catch(() => {});
  };

  const cancelClass = (cls, dateStr) => {
    const key = `${cls.id}-${dateStr}`;
    const u = [...cancelledClasses, key];
    setCancelledClasses(u);
    try { localStorage.setItem('coachCancelledClasses', JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'cancelled_classes', data: u }).catch(() => {});
    setConfirmCancel(null);
    setExpandedClass(null);
  };

  const reinstateClass = (cls, dateStr) => {
    const key = `${cls.id}-${dateStr}`;
    const u = cancelledClasses.filter(k => k !== key);
    setCancelledClasses(u);
    try { localStorage.setItem('coachCancelledClasses', JSON.stringify(u)); } catch {}
    if (gymId) base44.functions.invoke('coachData', { action: 'write', gymId, field: 'cancelled_classes', data: u }).catch(() => {});
  };

  // ── Date helpers ──────────────────────────────────────────────────────────
  const week        = Array.from({ length: 7 }, (_, i) => subDays(now, 3 - i));
  const selDay      = week[selectedDay];
  const isToday     = startOfDay(selDay).getTime() === startOfDay(now).getTime();
  const selDateStr  = format(selDay, 'yyyy-MM-dd');

  const dayCheckIns = (day) =>
    checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(day).getTime());
  const selCIs = dayCheckIns(selDay);

  // Day counts for the navigator dots
  const dayCounts = useMemo(() => week.map(d => dayCheckIns(d).length), [week, checkIns]);

  // 30-day spark data
  const last30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return { label: format(d, 'MMM d'), count: dayCheckIns(d).length };
  }), [checkIns, now]);
  const maxCount30 = Math.max(...last30.map(d => d.count), 1);

  // Appointments vs group classes
  const appointments = useMemo(() =>
    myClasses.filter(c => c.type === 'personal_training' || c.is_appointment || c.type === 'pt'),
    [myClasses]
  );
  const groupClasses = useMemo(() =>
    myClasses.filter(c => !c.type || (c.type !== 'personal_training' && !c.is_appointment && c.type !== 'pt')),
    [myClasses]
  );

  // Classes enriched with attendance data for selected day
  const classesWithData = useMemo(() => groupClasses.map(cls => {
    const capacity    = cls.max_capacity || cls.capacity || 20;
    const booked      = cls.bookings || [];
    const waitlist    = cls.waitlist || [];
    const isCancelled = cancelledClasses.includes(`${cls.id}-${selDateStr}`);

    const attended = selCIs.filter(ci => {
      if (!cls.schedule) return false;
      const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!match) return false;
      let sh = parseInt(match[1]);
      if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
      const h = new Date(ci.check_in_date).getHours();
      return h === sh || h === sh + 1;
    });

    // Regulars: members who've attended this time slot 2+ times historically
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
      checkIns.forEach(c => {
        const h = new Date(c.check_in_date).getHours();
        if (h === classHour || h === classHour + 1) freq[c.user_id] = (freq[c.user_id] || 0) + 1;
      });
    }
    const regulars = allMemberships.filter(m => (freq[m.user_id] || 0) >= 2);

    const fill = booked.length > 0
      ? Math.min(100, Math.round((booked.length / capacity) * 100))
      : Math.min(100, Math.round((attended.length / capacity) * 100));

    return { ...cls, attended, capacity, booked, waitlist, regulars, fill, isCancelled };
  }), [groupClasses, selCIs, checkIns, allMemberships, cancelledClasses, selDateStr]);

  const upcomingEvents = useMemo(() =>
    events.filter(e => new Date(e.event_date) >= now)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 4),
    [events, now]
  );

  // Week summary stats
  const weekTotalBooked  = groupClasses.reduce((s, c) => s + (c.bookings?.length || 0), 0);
  const weekWaitlisted   = groupClasses.reduce((s, c) => s + (c.waitlist?.length || 0), 0);
  const avgFill          = classesWithData.length > 0
    ? Math.round(classesWithData.reduce((s, c) => s + c.fill, 0) / classesWithData.length) : 0;

  const inputStyle = {
    padding: '4px 8px', borderRadius: 7,
    background: '#060c18', border: '1px solid rgba(255,255,255,0.07)',
    color: '#f0f4f8', fontSize: 10, outline: 'none',
  };

  const filteredRoster = allMemberships.filter(m =>
    !rosterSearch || (m.user_name || '').toLowerCase().includes(rosterSearch.toLowerCase())
  );

  return (
    <>
      {/* Cancel confirm dialog */}
      {confirmCancel && (
        <ConfirmDialog
          message={`Cancel "${confirmCancel.name}" on ${format(selDay, 'EEE, MMM d')}? Members will need to be notified manually.`}
          onConfirm={() => cancelClass(confirmCancel, selDateStr)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>

        {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── WEEK CALENDAR ──────────────────────────────────────────────── */}
          <div style={{ borderRadius: 18, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <SectionLabel accent="#a78bfa">Week Calendar</SectionLabel>
              <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>
                {format(week[0], 'MMM d')} – {format(week[6], 'MMM d')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {week.map((d, i) => {
                const isT    = startOfDay(d).getTime() === startOfDay(now).getTime();
                const active = i === selectedDay;
                const count  = dayCounts[i];
                // How many classes fall on this day (simplified: show all if today or use schedule day)
                const classCount = groupClasses.length; // In real app, filter by day-of-week
                return (
                  <button key={i} onClick={() => { setSelectedDay(i); setExpandedClass(null); }}
                    style={{ flex: 1, padding: '12px 4px 10px', borderRadius: 13, border: active ? '1px solid rgba(167,139,250,0.5)' : isT ? '1px solid rgba(167,139,250,0.22)' : '1px solid rgba(255,255,255,0.06)', background: active ? 'rgba(167,139,250,0.13)' : isT ? 'rgba(167,139,250,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', position: 'relative' }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: active ? '#a78bfa' : '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{format(d, 'EEE')}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: active ? '#a78bfa' : isT ? '#f0f4f8' : '#64748b', lineHeight: 1, marginBottom: 6 }}>{format(d, 'd')}</div>
                    {/* Class count dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 4 }}>
                      {Array.from({ length: Math.min(classCount, 4) }, (_, j) => (
                        <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: active ? '#a78bfa' : 'rgba(167,139,250,0.35)' }}/>
                      ))}
                    </div>
                    {/* Check-in count */}
                    {count > 0 && (
                      <div style={{ fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#3a5070' }}>{count} in</div>
                    )}
                    {isT && !active && <div style={{ position: 'absolute', top: 6, right: 8, width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }}/>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── CLASS LIST ─────────────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <SectionLabel accent="#38bdf8">
                {isToday ? `Today's Classes` : `${format(selDay, 'EEEE, MMM d')} Classes`}
              </SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{selCIs.length} checked in</span>
                <button onClick={() => openModal('classes')} style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>+ Add Class</button>
              </div>
            </div>

            {classesWithData.length === 0 ? (
              <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', padding: '28px', textAlign: 'center' }}>
                <Clock style={{ width: 20, height: 20, color: '#3a5070', margin: '0 auto 10px' }}/>
                <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: '0 0 12px' }}>No classes on this day</p>
                <button onClick={() => openModal('classes')} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Add a Class</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {classesWithData.map((cls, idx) => {
                  const c         = classColor(cls);
                  const key       = `${cls.id}-${selDateStr}`;
                  const fillColor = cls.fill >= 80 ? '#34d399' : cls.fill >= 50 ? '#fbbf24' : '#38bdf8';
                  const isOpen    = expandedClass === cls.id;
                  const pane      = activePane[key] || 'roster';
                  const manualIds = attendance[key] || [];
                  const checkedIds = cls.attended.map(ci => ci.user_id);
                  const totalPresent = [...new Set([...manualIds, ...checkedIds])].length;
                  const spotsLeft = cls.capacity - (cls.booked.length || cls.attended.length);

                  return (
                    <div key={cls.id || idx} style={{ borderRadius: 16, background: '#0c1a2e', border: `1px solid ${isOpen ? c : 'rgba(255,255,255,0.07)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>

                      {/* ── CLASS CARD HEADER ── */}
                      <div style={{ padding: '14px 16px', position: 'relative' }}>
                        {/* Cancelled banner */}
                        {cls.isCancelled && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#ef4444,#f87171)' }}/>
                        )}
                        {!cls.isCancelled && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${c},${c}88)` }}/>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          {/* Icon */}
                          <div style={{ width: 38, height: 38, borderRadius: 11, background: `${c}18`, border: `1px solid ${c}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                            <Dumbbell style={{ width: 15, height: 15, color: c }}/>
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 15, fontWeight: 900, color: cls.isCancelled ? '#475569' : '#f0f4f8', letterSpacing: '-0.01em' }}>{cls.name}</span>
                              {cls.isCancelled && (
                                <span style={{ fontSize: 9, fontWeight: 800, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 5, padding: '1px 6px' }}>CANCELLED</span>
                              )}
                              {cls.difficulty && !cls.isCancelled && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: c, background: `${c}12`, border: `1px solid ${c}22`, borderRadius: 5, padding: '1px 6px' }}>{cls.difficulty}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                              {cls.schedule && (
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                                  🕐 {cls.schedule}
                                </span>
                              )}
                              {cls.duration_minutes && <span style={{ fontSize: 11, color: '#64748b' }}>{cls.duration_minutes}min</span>}
                              <span style={{ fontSize: 11, color: fillColor, fontWeight: 800 }}>
                                {cls.booked.length > 0 ? cls.booked.length : cls.attended.length}
                                <span style={{ color: '#3a5070', fontWeight: 400 }}>/{cls.capacity}</span> booked
                              </span>
                              {spotsLeft <= 3 && spotsLeft > 0 && (
                                <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>{spotsLeft} spots left</span>
                              )}
                              {spotsLeft <= 0 && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 800 }}>🔴 Full</span>}
                              {cls.waitlist.length > 0 && (
                                <span style={{ fontSize: 10, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 5, padding: '1px 6px', fontWeight: 700 }}>
                                  {cls.waitlist.length} waitlisted
                                </span>
                              )}
                            </div>
                            {/* Fill bar */}
                            {!cls.isCancelled && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}99)`, borderRadius: 99, transition: 'width 0.6s ease' }}/>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 700, color: fillColor, flexShrink: 0 }}>{cls.fill}%</span>
                              </div>
                            )}
                          </div>

                          {/* Right: Start Check-In + expand toggle */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                            {!cls.isCancelled && (
                              <button onClick={() => openModal('qrScanner', cls)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.1))', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.28)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.1))'}>
                                <QrCode style={{ width: 12, height: 12 }}/> Start Check-In
                              </button>
                            )}
                            <button onClick={() => { setExpandedClass(isOpen ? null : cls.id); setActivePane(p => ({ ...p, [key]: 'roster' })); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, background: isOpen ? `${c}16` : 'rgba(255,255,255,0.04)', border: `1px solid ${isOpen ? `${c}35` : 'rgba(255,255,255,0.08)'}`, color: isOpen ? c : '#64748b', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                              {isOpen ? <ChevronUp style={{ width: 10, height: 10 }}/> : <ChevronDown style={{ width: 10, height: 10 }}/>}
                              {isOpen ? 'Close' : 'Manage'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ── CLASS CONTROLS (expanded) ── */}
                      {isOpen && (
                        <div style={{ borderTop: `1px solid ${c}20`, background: `${c}04` }}>

                          {/* Sub-tab navigation */}
                          <div style={{ display: 'flex', borderBottom: `1px solid ${c}12`, overflowX: 'auto' }}>
                            {[
                              { id: 'roster',     label: `Members (${cls.booked.length || cls.regulars.length})` },
                              { id: 'waitlist',   label: `Waitlist (${cls.waitlist.length})` },
                              { id: 'attendance', label: `Attendance (${totalPresent})` },
                            ].map(t => (
                              <button key={t.id} onClick={() => setActivePane(p => ({ ...p, [key]: t.id }))}
                                style={{ flex: 1, padding: '10px 8px', background: 'none', border: 'none', borderBottom: pane === t.id ? `2px solid ${c}` : '2px solid transparent', color: pane === t.id ? c : '#3a5070', fontSize: 10, fontWeight: pane === t.id ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                                {t.label}
                              </button>
                            ))}
                          </div>

                          {/* ── ROSTER pane ── */}
                          {pane === 'roster' && (
                            <div style={{ padding: '12px 16px' }}>
                              {/* Booked members */}
                              {(cls.booked.length > 0 || cls.regulars.length > 0) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {(cls.booked.length > 0 ? cls.booked : cls.regulars).map((m, j) => {
                                    const isCheckedIn = checkedIds.includes(m.user_id) || manualIds.includes(m.user_id);
                                    return (
                                      <div key={m.user_id || j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: isCheckedIn ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.025)', border: `1px solid ${isCheckedIn ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.06)'}` }}>
                                        <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={28} color={isCheckedIn ? '#34d399' : '#64748b'}/>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                                          {m.membership_type && <div style={{ fontSize: 9, color: '#3a5070' }}>{m.membership_type}</div>}
                                        </div>
                                        {isCheckedIn
                                          ? <StatusPill label="✓ Checked in" color="#34d399"/>
                                          : <StatusPill label="Booked" color="#a78bfa"/>
                                        }
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                  <Users style={{ width: 18, height: 18, color: '#3a5070', margin: '0 auto 7px' }}/>
                                  <p style={{ fontSize: 11, color: '#3a5070', fontWeight: 600, margin: 0 }}>
                                    {cls.attended.length > 0 ? `${cls.attended.length} member${cls.attended.length !== 1 ? 's' : ''} checked in` : 'No bookings yet'}
                                  </p>
                                </div>
                              )}
                              {/* QR check-ins not on booked list */}
                              {cls.attended.filter(ci => !cls.booked.some(b => b.user_id === ci.user_id)).length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Walk-ins / Drop-ins</div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                    {cls.attended.filter(ci => !cls.booked.some(b => b.user_id === ci.user_id)).map((ci, j) => (
                                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 7, background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.18)' }}>
                                        <MiniAvatar name={ci.user_name} src={avatarMap[ci.user_id]} size={16} color="#38bdf8"/>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: '#f0f4f8' }}>{ci.user_name || 'Member'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── WAITLIST pane ── */}
                          {pane === 'waitlist' && (
                            <div style={{ padding: '12px 16px' }}>
                              {cls.waitlist.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                                  <CheckCircle style={{ width: 18, height: 18, color: '#34d399', margin: '0 auto 7px' }}/>
                                  <p style={{ fontSize: 11, color: '#34d399', fontWeight: 700, margin: 0 }}>No one on the waitlist</p>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {cls.waitlist.map((w, j) => (
                                    <div key={w.user_id || j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.14)' }}>
                                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#f87171', flexShrink: 0 }}>{j + 1}</div>
                                      <MiniAvatar name={w.user_name} src={avatarMap[w.user_id]} size={28} color="#f87171"/>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.user_name || 'Member'}</div>
                                        {w.wait_since && <div style={{ fontSize: 9, color: '#64748b' }}>Waiting since {format(new Date(w.wait_since), 'MMM d')}</div>}
                                      </div>
                                      <button onClick={() => openModal('promoteWaitlist', w)} style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', flexShrink: 0 }}>Move Up</button>
                                    </div>
                                  ))}
                                  <p style={{ fontSize: 10, color: '#3a5070', margin: '6px 0 0', textAlign: 'center' }}>
                                    {spotsLeft <= 0 ? 'Class is full — promote a member if a spot opens' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} available`}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── ATTENDANCE pane ── */}
                          {pane === 'attendance' && (
                            <div style={{ padding: '12px 16px' }}>
                              {/* Toolbar */}
                              <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                                <input value={rosterSearch} onChange={e => setRosterSearch(e.target.value)} placeholder="Search member…" style={{ ...inputStyle, flex: 1, minWidth: 110 }}/>
                                <button onClick={() => markAllPresent(key)} style={{ ...inputStyle, color: '#34d399', fontWeight: 700, cursor: 'pointer', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '4px 9px', flexShrink: 0 }}>All Present</button>
                                <button onClick={() => clearAttendance(key)} style={{ ...inputStyle, color: '#f87171', fontWeight: 700, cursor: 'pointer', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6, padding: '4px 9px', flexShrink: 0 }}>Clear</button>
                              </div>
                              {/* Member checklist */}
                              <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                {filteredRoster.length === 0
                                  ? <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '14px 0', margin: 0 }}>No members match</p>
                                  : filteredRoster.map((m, mi) => {
                                    const isManual  = manualIds.includes(m.user_id);
                                    const isQR      = checkedIds.includes(m.user_id);
                                    const present   = isManual || isQR;
                                    return (
                                      <div key={m.user_id || mi}
                                        onClick={() => !isQR && toggleAttendance(key, m.user_id)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: mi < filteredRoster.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: isQR ? 'default' : 'pointer', background: present ? 'rgba(52,211,153,0.04)' : 'transparent', transition: 'background 0.1s' }}>
                                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${present ? '#34d399' : 'rgba(255,255,255,0.15)'}`, background: present ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.1s' }}>
                                          {present && <Check style={{ width: 10, height: 10, color: '#fff' }}/>}
                                        </div>
                                        <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={26} color={present ? '#34d399' : '#475569'}/>
                                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: present ? '#d4fae8' : '#94a3b8' }}>{m.user_name || 'Member'}</span>
                                        {isQR      && <StatusPill label="QR"     color="#34d399"/>}
                                        {isManual && !isQR && <StatusPill label="Manual" color="#a78bfa"/>}
                                      </div>
                                    );
                                  })
                                }
                              </div>
                              {/* Summary bar */}
                              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{totalPresent} present · {Math.max(0, filteredRoster.length - totalPresent)} absent</span>
                                <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${filteredRoster.length > 0 ? (totalPresent / filteredRoster.length) * 100 : 0}%`, background: 'linear-gradient(90deg,#34d399,#10b981)', borderRadius: 99 }}/>
                                </div>
                              </div>
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
                              <ClipboardList style={{ width: 9, height: 9 }}/> Session Notes
                              {notes[key] && <span style={{ color: '#34d399', fontWeight: 700 }}>✓ saved</span>}
                            </div>
                            <textarea
                              value={notes[key] || ''}
                              onChange={e => saveNote(key, e.target.value)}
                              placeholder="Cues, modifications, highlights, things to improve…"
                              style={{ width: '100%', minHeight: 52, padding: '7px 9px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', transition: 'border-color 0.2s' }}
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
          </div>

          {/* ── PT / APPOINTMENTS ──────────────────────────────────────────── */}
          {appointments.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <SectionLabel accent="#38bdf8">PT / 1:1 Appointments</SectionLabel>
                <button onClick={() => openModal('bookAppointment')} style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}>+ Book</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {appointments.map((apt, i) => {
                  const m = allMemberships.find(x => x.user_id === apt.client_id || x.user_id === apt.user_id);
                  return (
                    <div key={apt.id || i} style={{ borderRadius: 14, background: '#0c1a2e', border: '1px solid rgba(56,189,248,0.16)', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ position: 'absolute' }}/>
                      <MiniAvatar name={apt.client_name || m?.user_name || 'Client'} src={avatarMap[apt.client_id || apt.user_id]} size={36} color="#38bdf8"/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{apt.client_name || m?.user_name || 'Client'}</div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                          {apt.schedule || apt.time || 'Time TBD'}
                          {apt.notes && ` · ${apt.notes}`}
                          {apt.session_type && <span style={{ marginLeft: 6, color: '#38bdf8', fontWeight: 600 }}>{apt.session_type}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => openModal('qrScanner')} style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}>Check In</button>
                        <button onClick={() => openModal('memberNote', m)} style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}>Note</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT SIDEBAR ═════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 0 }}>

          {/* Quick Actions */}
          <div style={{ borderRadius: 16, background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '13px 15px 9px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Quick Actions</span>
            </div>
            <div style={{ padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { icon: QrCode,   label: 'Scan Check-In',  sub: 'Start a class',       color: '#10b981', fn: () => openModal('qrScanner') },
                { icon: Calendar, label: 'Create Event',   sub: 'Add to calendar',     color: '#34d399', fn: () => openModal('event')     },
                { icon: Dumbbell, label: 'Manage Classes', sub: 'Edit your timetable', color: '#a78bfa', fn: () => openModal('classes')   },
                { icon: Bell,     label: 'Send Reminder',  sub: 'Post to members',     color: '#38bdf8', fn: () => openModal('post')      },
              ].map(({ icon: Ic, label, sub, color, fn }, i) => (
                <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 11, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${color}0f`; e.currentTarget.style.borderColor = `${color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `${color}16`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic style={{ width: 13, height: 13, color }}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{label}</div>
                    <div style={{ fontSize: 10, color: '#3a5070' }}>{sub}</div>
                  </div>
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
                { label: 'Classes today',    value: groupClasses.length,    color: '#a78bfa' },
                { label: 'Members expected', value: weekTotalBooked,         color: '#38bdf8' },
                { label: 'Avg fill rate',    value: `${avgFill}%`,           color: avgFill >= 70 ? '#34d399' : avgFill >= 40 ? '#fbbf24' : '#f87171' },
                { label: 'On waitlist',      value: weekWaitlisted,          color: weekWaitlisted > 0 ? '#f87171' : '#34d399' },
                { label: 'PT sessions',      value: appointments.length,     color: '#38bdf8' },
              ].map((s, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: 11, color: '#7a93ad', fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}20`, borderRadius: 6, padding: '1px 8px' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

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
                      <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: 8, padding: '4px 7px', textAlign: 'center', minWidth: 32 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d, 'd')}</div>
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
              {/* X axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 9, color: '#3a5070' }}>{format(subDays(now, 29), 'MMM d')}</span>
                <span style={{ fontSize: 9, color: '#3a5070' }}>{format(subDays(now, 14), 'MMM d')}</span>
                <span style={{ fontSize: 9, color: '#38bdf8', fontWeight: 700 }}>Today</span>
              </div>
              {/* Summary row */}
              <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {[
                  { label: 'total',   value: last30.reduce((s, d) => s + d.count, 0),  color: '#38bdf8' },
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
        </div>
      </div>
    </>
  );
}
