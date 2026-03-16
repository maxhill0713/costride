import React, { useState, useMemo } from 'react';
import { format, subDays, startOfDay, addDays } from 'date-fns';
import {
  Clock, Dumbbell, Calendar, QrCode, Pencil, Check,
  ChevronDown, ChevronUp, UserCheck, Bell, ClipboardList,
  Users, AlertCircle, Star, RefreshCw, MessageCircle,
  CheckCircle, User, BookOpen, Zap,
} from 'lucide-react';
import { CoachCard, MiniAvatar, classColor } from './CoachHelpers';

// ── Sub-request pill ───────────────────────────────────────────────────────────
function StatusPill({ label, color }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}22`, borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

export default function TabCoachSchedule({
  myClasses, checkIns, events, allMemberships = [], avatarMap, openModal, now,
}) {
  const todayIndex = 3;
  const [selectedDay,  setSelectedDay]  = useState(todayIndex);
  const [showRoster,   setShowRoster]   = useState({});
  const [rosterSearch, setRosterSearch] = useState('');
  const [activeTab,    setActiveTab]    = useState('classes'); // 'classes' | 'appointments' | 'sub'
  const [expandedPrep, setExpandedPrep] = useState({});

  // ── Persisted state ──────────────────────────────────────────────────────
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachSessionNotes') || '{}'); } catch { return {}; }
  });
  const [attendance, setAttendance] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachAttendanceSheets') || '{}'); } catch { return {}; }
  });
  const [prepChecklists, setPrepChecklists] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachClassPrep') || '{}'); } catch { return {}; }
  });
  const [subRequests, setSubRequests] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachSubRequests') || '[]'); } catch { return []; }
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  const saveNote = (key, val) => {
    const u = { ...notes, [key]: val };
    setNotes(u);
    try { localStorage.setItem('coachSessionNotes', JSON.stringify(u)); } catch {}
  };

  const toggleAttendance = (rosterKey, uid) => {
    const sheet = attendance[rosterKey] || [];
    const u = { ...attendance, [rosterKey]: sheet.includes(uid) ? sheet.filter(id => id !== uid) : [...sheet, uid] };
    setAttendance(u);
    try { localStorage.setItem('coachAttendanceSheets', JSON.stringify(u)); } catch {}
  };

  const markAllPresent = (rosterKey, ids) => {
    const u = { ...attendance, [rosterKey]: ids };
    setAttendance(u);
    try { localStorage.setItem('coachAttendanceSheets', JSON.stringify(u)); } catch {}
  };

  const clearAttendance = (rosterKey) => {
    const u = { ...attendance, [rosterKey]: [] };
    setAttendance(u);
    try { localStorage.setItem('coachAttendanceSheets', JSON.stringify(u)); } catch {}
  };

  const togglePrep = (key, item) => {
    const list = prepChecklists[key] || [];
    const u = { ...prepChecklists, [key]: list.includes(item) ? list.filter(i => i !== item) : [...list, item] };
    setPrepChecklists(u);
    try { localStorage.setItem('coachClassPrep', JSON.stringify(u)); } catch {}
  };

  const addSubRequest = (cls, date) => {
    const req = { id: Date.now(), className: cls.name, date: format(date, 'yyyy-MM-dd'), status: 'pending', note: '' };
    const u = [req, ...subRequests];
    setSubRequests(u);
    try { localStorage.setItem('coachSubRequests', JSON.stringify(u)); } catch {}
  };

  const removeSubRequest = (id) => {
    const u = subRequests.filter(r => r.id !== id);
    setSubRequests(u);
    try { localStorage.setItem('coachSubRequests', JSON.stringify(u)); } catch {}
  };

  // ── Date/data helpers ────────────────────────────────────────────────────
  const week        = Array.from({ length: 7 }, (_, i) => subDays(now, 3 - i));
  const selDay      = week[selectedDay];
  const isToday     = startOfDay(selDay).getTime() === startOfDay(now).getTime();
  const dayCheckIns = (day) => checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(day).getTime());
  const selCIs      = dayCheckIns(selDay);

  // Personal training / appointment-type classes
  const appointments = useMemo(() =>
    myClasses.filter(c => c.type === 'personal_training' || c.is_appointment || c.type === 'pt'),
    [myClasses]
  );
  const groupClasses = useMemo(() =>
    myClasses.filter(c => !c.type || (c.type !== 'personal_training' && !c.is_appointment && c.type !== 'pt')),
    [myClasses]
  );

  // Upcoming events
  const upcomingEvents = useMemo(() =>
    events.filter(e => new Date(e.event_date) >= now).sort((a,b) => new Date(a.event_date) - new Date(b.event_date)).slice(0, 4),
    [events, now]
  );

  // 30-day sparkline data
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return { label: format(d,'MMM d'), count: dayCheckIns(d).length };
  });
  const maxCount = Math.max(...last30.map(d => d.count), 1);

  // Classes with attendance data
  const classesWithData = useMemo(() => groupClasses.map(cls => {
    const capacity = cls.max_capacity || cls.capacity || 20;
    const attended = selCIs.filter(ci => {
      if (!cls.schedule) return false;
      const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!match) return false;
      let sh = parseInt(match[1]);
      if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
      const h = new Date(ci.check_in_date).getHours();
      return h === sh || h === sh + 1;
    });
    // Regulars = members who've attended this class hour 2+ times historically
    const classHour = (() => {
      if (!cls.schedule) return null;
      const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!match) return null;
      let h = parseInt(match[1]);
      if (match[2].toLowerCase() === 'pm' && h !== 12) h += 12;
      return h;
    })();
    const expectedMap = {};
    if (classHour !== null) {
      checkIns.forEach(c => {
        const h = new Date(c.check_in_date).getHours();
        if (h === classHour || h === classHour + 1) expectedMap[c.user_id] = (expectedMap[c.user_id] || 0) + 1;
      });
    }
    const regulars = allMemberships.filter(m => (expectedMap[m.user_id] || 0) >= 2);
    const booked   = cls.bookings || [];
    const waitlist = cls.waitlist || [];
    return { ...cls, attended, capacity, fill: Math.min(100, Math.round((attended.length / capacity) * 100)), regulars, booked, waitlist };
  }), [groupClasses, selCIs, checkIns, allMemberships]);

  const filteredRoster = allMemberships.filter(m =>
    !rosterSearch || (m.user_name || '').toLowerCase().includes(rosterSearch.toLowerCase())
  );

  // Default prep checklist items per class type
  const defaultPrepItems = ['Equipment set up', 'Music playlist ready', 'Warm-up planned', 'Modifications noted', 'Register marked'];

  const inputStyle = {
    padding: '4px 8px', borderRadius: 7,
    background: '#060c18', border: '1px solid rgba(255,255,255,0.07)',
    color: '#f0f4f8', fontSize: 10, outline: 'none',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Week navigator */}
        <CoachCard accent="#a78bfa" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>Week at a Glance</span>
            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{format(week[0], 'MMM d')} – {format(week[6], 'MMM d')}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {week.map((d, i) => {
              const isT    = startOfDay(d).getTime() === startOfDay(now).getTime();
              const count  = dayCheckIns(d).length;
              const active = i === selectedDay;
              const hasClasses = groupClasses.length > 0; // simplified; ideally per-day schedule
              return (
                <button key={i} onClick={() => setSelectedDay(i)} style={{ flex: 1, padding: '10px 4px', borderRadius: 12, border: active ? '1px solid rgba(167,139,250,0.45)' : isT ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.06)', background: active ? 'rgba(167,139,250,0.12)' : isT ? 'rgba(167,139,250,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: active ? '#a78bfa' : '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{format(d, 'EEE')}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: active ? '#a78bfa' : isT ? '#f0f4f8' : '#64748b', lineHeight: 1 }}>{format(d, 'd')}</div>
                  {count > 0
                    ? <div style={{ marginTop: 5, fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#64748b' }}>{count}</div>
                    : <div style={{ marginTop: 5, height: 12 }}/>
                  }
                  {isT && !active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa', margin: '4px auto 0' }}/>}
                </button>
              );
            })}
          </div>
        </CoachCard>

        {/* Tab switcher: Classes / PT Appointments / Sub Requests */}
        <div style={{ display: 'flex', gap: 4, padding: '2px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { id: 'classes',      label: `Group Classes · ${groupClasses.length}`,       color: '#a78bfa' },
            { id: 'appointments', label: `PT / 1:1 · ${appointments.length}`,            color: '#38bdf8' },
            { id: 'sub',          label: `Sub Requests · ${subRequests.length}`,          color: '#f87171' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: '8px 6px', borderRadius: 10, border: activeTab===t.id ? `1px solid ${t.color}30` : '1px solid transparent', background: activeTab===t.id ? `${t.color}12` : 'transparent', color: activeTab===t.id ? t.color : '#3a5070', fontSize: 10, fontWeight: activeTab===t.id ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── GROUP CLASSES TAB ── */}
        {activeTab === 'classes' && (
          <CoachCard accent="#38bdf8" title={isToday ? `Today · ${selCIs.length} checked in` : `${format(selDay, 'EEEE, MMM d')} · ${selCIs.length} checked in`}>
            <div style={{ padding: '12px 16px' }}>
              {classesWithData.length === 0 && selCIs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#3a5070' }}>
                  <Clock style={{ width: 20, height: 20, opacity: 0.3, margin: '0 auto 8px' }}/>
                  <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 10px' }}>No classes this day</p>
                  <button onClick={() => openModal('classes')} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>Add a Class</button>
                </div>
              ) : classesWithData.map((cls, i) => {
                const c          = classColor(cls);
                const key        = `${cls.id}-${format(selDay, 'yyyy-MM-dd')}`;
                const fillColor  = cls.fill >= 70 ? '#34d399' : cls.fill >= 40 ? '#fbbf24' : '#38bdf8';
                const manualAttd = attendance[key] || [];
                const isOpen     = showRoster[key];
                const totalPresent = [...new Set([...manualAttd, ...cls.attended.map(ci => ci.user_id)])].length;
                const checkedInIds = cls.attended.map(ci => ci.user_id);
                const prepDone     = (prepChecklists[key] || []).length;
                const isPrepExpanded = expandedPrep[key];

                return (
                  <div key={cls.id||i} style={{ marginBottom: i < classesWithData.length-1 ? 16 : 0, borderRadius: 14, background: `${c}06`, border: `1px solid ${c}18`, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px' }}>

                      {/* Class header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Dumbbell style={{ width: 13, height: 13, color: c }}/>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{cls.name}</div>
                            <div style={{ fontSize: 10, color: '#64748b', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              {cls.schedule && <span>🕐 {cls.schedule}</span>}
                              {cls.duration_minutes && <span>{cls.duration_minutes}min</span>}
                              {cls.difficulty && <span style={{ color: c, fontWeight: 600 }}>{cls.difficulty}</span>}
                              {cls.waitlist?.length > 0 && <span style={{ color: '#f87171', fontWeight: 700 }}>{cls.waitlist.length} waitlisted</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: fillColor, lineHeight: 1 }}>{cls.attended.length}<span style={{ fontSize: 10, color: '#3a5070', fontWeight: 400 }}>/{cls.capacity}</span></div>
                          <button onClick={() => addSubRequest(cls, selDay)} style={{ fontSize: 9, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}>
                            Need Sub?
                          </button>
                        </div>
                      </div>

                      {/* Fill bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ height: 5, flex: 1, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}bb)`, borderRadius: 99, transition: 'width 0.5s ease' }}/>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: fillColor, flexShrink: 0 }}>{cls.fill}% full</span>
                      </div>

                      {/* Class prep checklist */}
                      <div style={{ marginBottom: 12 }}>
                        <button onClick={() => setExpandedPrep(p => ({...p, [key]: !isPrepExpanded}))} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: isPrepExpanded ? 8 : 0 }}>
                          <ClipboardList style={{ width: 10, height: 10, color: '#64748b' }}/>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Class Prep · {prepDone}/{defaultPrepItems.length} done
                          </span>
                          {isPrepExpanded ? <ChevronUp style={{ width: 9, height: 9, color: '#3a5070' }}/> : <ChevronDown style={{ width: 9, height: 9, color: '#3a5070' }}/>}
                          {prepDone === defaultPrepItems.length && <span style={{ fontSize: 9, color: '#34d399', fontWeight: 700 }}>✓ all set!</span>}
                        </button>
                        {isPrepExpanded && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {defaultPrepItems.map((item, pi) => {
                              const done = (prepChecklists[key] || []).includes(item);
                              return (
                                <div key={pi} onClick={() => togglePrep(key, item)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 7, background: done ? 'rgba(52,211,153,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${done ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', transition: 'all 0.1s' }}>
                                  <div style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${done ? '#34d399' : 'rgba(255,255,255,0.15)'}`, background: done ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {done && <Check style={{ width: 8, height: 8, color: '#fff' }}/>}
                                  </div>
                                  <span style={{ fontSize: 10, color: done ? '#d4fae8' : '#64748b', fontWeight: done ? 600 : 400 }}>{item}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Checked in via QR */}
                      {cls.attended.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Checked In · {cls.attended.length}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {cls.attended.slice(0, 8).map((ci, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 6, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)' }}>
                                <MiniAvatar name={ci.user_name} src={avatarMap[ci.user_id]} size={16} color="#34d399"/>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#f0f4f8' }}>{ci.user_name || 'Client'}</span>
                              </div>
                            ))}
                            {cls.attended.length > 8 && <div style={{ padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 10, color: '#64748b' }}>+{cls.attended.length - 8}</div>}
                          </div>
                        </div>
                      )}

                      {/* Regulars / expected (when no QR check-ins yet) */}
                      {cls.attended.length === 0 && cls.regulars.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Your Regulars · {cls.regulars.length}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {cls.regulars.slice(0, 6).map((m, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 6, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                                <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={16} color="#a78bfa"/>
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{m.user_name || 'Client'}</span>
                              </div>
                            ))}
                            {cls.regulars.length > 6 && <div style={{ padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, color: '#64748b' }}>+{cls.regulars.length - 6} more</div>}
                          </div>
                        </div>
                      )}

                      {/* Waitlist strip */}
                      {cls.waitlist?.length > 0 && (
                        <div style={{ marginBottom: 10, padding: '7px 10px', borderRadius: 8, background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.14)' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Waitlist · {cls.waitlist.length}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {cls.waitlist.map((w, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 6, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.14)' }}>
                                <MiniAvatar name={w.user_name} src={avatarMap[w.user_id]} size={16} color="#f87171"/>
                                <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>{w.user_name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action row */}
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                        <button onClick={() => setShowRoster(p => ({...p, [key]: !isOpen}))} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: isOpen ? `${c}20` : `${c}0c`, border: `1px solid ${c}28`, color: c, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          <UserCheck style={{ width: 11, height: 11 }}/>
                          Take Attendance{totalPresent > 0 ? ` · ${totalPresent} present` : ''}
                          {isOpen ? <ChevronUp style={{ width: 10, height: 10 }}/> : <ChevronDown style={{ width: 10, height: 10 }}/>}
                        </button>
                        <button onClick={() => openModal('post')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', color: '#38bdf8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          <Bell style={{ width: 11, height: 11 }}/> Remind Class
                        </button>
                        <button onClick={() => openModal('qrScanner')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', color: '#10b981', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          <QrCode style={{ width: 11, height: 11 }}/> Scan QR
                        </button>
                      </div>

                      {/* Attendance roster (expandable) */}
                      {isOpen && (
                        <div style={{ borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#f0f4f8' }}>Attendance · {format(selDay, 'MMM d')}</span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input value={rosterSearch} onChange={e => setRosterSearch(e.target.value)} placeholder="Search…" style={{ ...inputStyle, width: 100 }}/>
                              <button onClick={() => markAllPresent(key, allMemberships.map(m => m.user_id))} style={{ ...inputStyle, color: '#34d399', fontWeight: 700, cursor: 'pointer', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, padding: '4px 8px' }}>All Present</button>
                              <button onClick={() => clearAttendance(key)} style={{ ...inputStyle, color: '#f87171', fontWeight: 700, cursor: 'pointer', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6, padding: '4px 8px' }}>Clear</button>
                            </div>
                          </div>
                          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                            {filteredRoster.length === 0
                              ? <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '14px 0', margin: 0 }}>No clients match</p>
                              : filteredRoster.map((m, mi) => {
                                const isManual  = (attendance[key] || []).includes(m.user_id);
                                const isQR      = checkedInIds.includes(m.user_id);
                                const present   = isManual || isQR;
                                return (
                                  <div key={m.user_id||mi} onClick={() => !isQR && toggleAttendance(key, m.user_id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: isQR ? 'default' : 'pointer', background: present ? 'rgba(52,211,153,0.04)' : 'transparent', transition: 'background 0.1s' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${present ? '#34d399' : 'rgba(255,255,255,0.15)'}`, background: present ? '#34d399' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {present && <Check style={{ width: 10, height: 10, color: '#fff' }}/>}
                                    </div>
                                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={26} color={present ? '#34d399' : '#64748b'}/>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: present ? '#f0f4f8' : '#94a3b8' }}>{m.user_name || 'Client'}</div>
                                      {isQR && <div style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>QR checked in</div>}
                                    </div>
                                    {present && <span style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.1)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>Present</span>}
                                  </div>
                                );
                              })
                            }
                          </div>
                          <div style={{ display: 'flex', gap: 16, padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: 10, color: '#34d399', fontWeight: 700 }}>{totalPresent} present</span>
                            <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700 }}>{Math.max(0, allMemberships.length - totalPresent)} absent</span>
                            <span style={{ fontSize: 10, color: '#64748b' }}>of {allMemberships.length} clients</span>
                          </div>
                        </div>
                      )}

                      {/* Session notes */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <Pencil style={{ width: 9, height: 9, color: '#3a5070' }}/>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Session Notes</span>
                          {notes[key] && <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>✓ saved</span>}
                        </div>
                        <textarea
                          placeholder="Cues, modifications, feedback, things to try next time…"
                          value={notes[key] || ''}
                          onChange={e => saveNote(key, e.target.value)}
                          style={{ width: '100%', minHeight: 60, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Drop-in check-ins not matched to a class */}
              {selCIs.length > 0 && classesWithData.every(c => c.attended.length === 0) && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Drop-in Clients</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {selCIs.map((ci, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.13)' }}>
                        <MiniAvatar name={ci.user_name} src={avatarMap[ci.user_id]} size={20} color="#34d399"/>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#f0f4f8' }}>{ci.user_name || 'Client'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CoachCard>
        )}

        {/* ── PT / APPOINTMENTS TAB ── */}
        {activeTab === 'appointments' && (
          <CoachCard accent="#38bdf8" title="Personal Training & 1:1 Sessions">
            <div style={{ padding: '12px 16px' }}>
              {appointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#3a5070' }}>
                  <User style={{ width: 20, height: 20, opacity: 0.3, margin: '0 auto 8px' }}/>
                  <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 10px' }}>No PT sessions scheduled</p>
                  <button onClick={() => openModal('classes')} style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>Schedule a Session</button>
                </div>
              ) : appointments.map((appt, i) => {
                const key       = `${appt.id}-${format(selDay, 'yyyy-MM-dd')}`;
                const hasNote   = !!notes[key];
                const client    = allMemberships.find(m => m.user_id === appt.client_id || m.user_id === appt.user_id);
                return (
                  <div key={appt.id||i} style={{ marginBottom: i < appointments.length-1 ? 14 : 0, padding: '14px', borderRadius: 14, background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.14)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#38bdf8', borderRadius: '14px 0 0 14px' }}/>
                    <div style={{ paddingLeft: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          {client && <MiniAvatar name={client.user_name} src={avatarMap[client.user_id]} size={32} color="#38bdf8"/>}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{appt.client_name || client?.user_name || appt.name || 'Client'}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>
                              {appt.schedule || '—'}{appt.duration_minutes ? ` · ${appt.duration_minutes}min` : ''}
                              {appt.session_type && <span style={{ marginLeft: 6, color: '#38bdf8', fontWeight: 600 }}>{appt.session_type}</span>}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => openModal('memberNote', client)} style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}>Progress</button>
                          <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}>Remind</button>
                        </div>
                      </div>
                      {/* Session plan / notes */}
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                          <Pencil style={{ width: 9, height: 9, color: '#3a5070' }}/>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Session Plan / Notes</span>
                          {hasNote && <span style={{ fontSize: 9, color: '#34d399', fontWeight: 600 }}>✓ saved</span>}
                        </div>
                        <textarea
                          placeholder={`Goals, exercises, sets/reps, progressions for ${appt.client_name || client?.user_name || 'this client'}…`}
                          value={notes[key] || ''}
                          onChange={e => saveNote(key, e.target.value)}
                          style={{ width: '100%', minHeight: 72, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CoachCard>
        )}

        {/* ── SUB REQUESTS TAB ── */}
        {activeTab === 'sub' && (
          <CoachCard accent="#f87171" title="Substitute Requests">
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Request a substitute for any of your classes. Your gym admin will be notified.
              </div>
              {/* Request form */}
              <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.12)', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 10 }}>Request a Sub</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groupClasses.map((cls, i) => (
                    <div key={cls.id||i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{cls.name}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{cls.schedule || '—'}</div>
                      </div>
                      <button onClick={() => addSubRequest(cls, selDay)} style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 7, padding: '5px 10px', cursor: 'pointer' }}>
                        Request Sub
                      </button>
                    </div>
                  ))}
                  {groupClasses.length === 0 && <p style={{ fontSize: 11, color: '#3a5070', margin: 0, textAlign: 'center', padding: '8px 0' }}>No classes to request subs for</p>}
                </div>
              </div>
              {/* Active requests */}
              {subRequests.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Active Requests</div>
                  {subRequests.map((req, i) => (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 0', borderBottom: i < subRequests.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.className}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{req.date}</div>
                      </div>
                      <StatusPill
                        label={req.status === 'pending' ? '⏳ Pending' : req.status === 'covered' ? '✓ Covered' : req.status}
                        color={req.status === 'pending' ? '#fbbf24' : req.status === 'covered' ? '#34d399' : '#64748b'}
                      />
                      <button onClick={() => removeSubRequest(req.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a5070', padding: '2px', display: 'flex' }}>
                        <span style={{ fontSize: 12, lineHeight: 1 }}>×</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {subRequests.length === 0 && (
                <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '8px 0', margin: 0 }}>No active sub requests</p>
              )}
            </div>
          </CoachCard>
        )}

        {/* 30-day activity chart */}
        <CoachCard accent="#0ea5e9" title="30-Day Client Activity">
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 64, marginTop: 14 }}>
              {last30.map((d, i) => {
                const h   = d.count === 0 ? 3 : Math.max(5, (d.count / maxCount) * 56);
                const isT = i === 29;
                return (
                  <div key={i} title={`${d.label}: ${d.count}`} style={{ flex: 1, height: h, borderRadius: '3px 3px 1px 1px', background: isT ? '#a78bfa' : d.count > 0 ? 'rgba(167,139,250,0.38)' : 'rgba(255,255,255,0.04)', transition: 'height 0.3s ease' }}/>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 9, color: '#3a5070' }}>{format(subDays(now, 29), 'MMM d')}</span>
              <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700 }}>Today</span>
            </div>
          </div>
        </CoachCard>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Quick actions */}
        <CoachCard accent="#a78bfa" title="Quick Actions">
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { icon: QrCode,       label: 'Scan Check-in',   color: '#10b981', fn: () => openModal('qrScanner')  },
              { icon: Bell,         label: 'Send Reminder',   color: '#38bdf8', fn: () => openModal('post')       },
              { icon: ClipboardList,label: 'Class Notes',     color: '#a78bfa', fn: () => openModal('classNotes') },
              { icon: Calendar,     label: 'View Schedule',   color: '#34d399', fn: () => openModal('schedule')   },
              { icon: RefreshCw,    label: 'Request Sub',     color: '#f87171', fn: () => setActiveTab('sub')     },
            ].map(({ icon: Ic, label, color, fn }, i) => (
              <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ic style={{ width: 12, height: 12, color }}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#d4e4f4' }}>{label}</span>
              </button>
            ))}
          </div>
        </CoachCard>

        {/* Session notes history */}
        {Object.keys(notes).filter(k => notes[k]).length > 0 && (
          <CoachCard accent="#a78bfa" title="Recent Session Notes">
            <div style={{ padding: '10px 14px' }}>
              {Object.entries(notes).filter(([,v]) => v).slice(-4).reverse().map(([key, text], i, arr) => {
                const parts     = key.split('-');
                const dateStr   = parts.slice(1).join('-');
                const cls       = myClasses.find(c => key.startsWith(String(c.id)));
                const className = cls?.name || 'Session';
                return (
                  <div key={key} style={{ padding: '8px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8' }}>{className}</span>
                      <span style={{ fontSize: 9, color: '#3a5070' }}>{dateStr}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</div>
                  </div>
                );
              })}
            </div>
          </CoachCard>
        )}

        {/* Attendance records */}
        {Object.keys(attendance).filter(k => (attendance[k]||[]).length > 0).length > 0 && (
          <CoachCard accent="#34d399" title="Attendance Records">
            <div style={{ padding: '10px 14px' }}>
              {Object.entries(attendance).filter(([,ids]) => ids.length > 0).slice(-4).reverse().map(([key, ids], i, arr) => {
                const parts     = key.split('-');
                const dateStr   = parts.slice(1).join('-');
                const cls       = myClasses.find(c => key.startsWith(String(c.id)));
                const className = cls?.name || 'Class';
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8' }}>{className}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{dateStr}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#34d399', background: 'rgba(52,211,153,0.1)', borderRadius: 6, padding: '2px 8px' }}>{ids.length} attended</span>
                  </div>
                );
              })}
            </div>
          </CoachCard>
        )}

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <CoachCard accent="#34d399" title="Upcoming Events" action="+ New" onAction={() => openModal('event')}>
            <div style={{ padding: '10px 14px' }}>
              {upcomingEvents.map((ev, i) => {
                const d    = new Date(ev.event_date);
                const diff = Math.floor((d - now) / 86400000);
                return (
                  <div key={ev.id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < upcomingEvents.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', borderRadius: 7, padding: '4px 6px', textAlign: 'center', minWidth: 30 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d,'d')}</div>
                      <div style={{ fontSize: 7, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d,'MMM')}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                      <div style={{ fontSize: 10, color: diff <= 2 ? '#f87171' : '#64748b' }}>{diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CoachCard>
        )}
      </div>
    </div>
  );
}
