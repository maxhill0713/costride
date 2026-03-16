import React, { useState } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { Clock, Dumbbell, Calendar, QrCode, Users, Pencil } from 'lucide-react';
import { CoachCard, MiniAvatar, classColor } from './CoachHelpers';

export default function TabCoachSchedule({ myClasses, checkIns, events, avatarMap, openModal, now }) {
  const todayIndex = 3;
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachSessionNotes') || '{}'); } catch { return {}; }
  });

  const saveNote = (key, val) => {
    const updated = { ...notes, [key]: val };
    setNotes(updated);
    try { localStorage.setItem('coachSessionNotes', JSON.stringify(updated)); } catch {}
  };

  // 7-day window: 3 days back, today, 3 days ahead
  const week = Array.from({ length: 7 }, (_, i) => subDays(now, 3 - i));

  const dayCheckIns = (day) => checkIns.filter(c =>
    startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(day).getTime()
  );

  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= now)
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5);

  const selDay   = week[selectedDay];
  const selCIs   = dayCheckIns(selDay);
  const isToday  = startOfDay(selDay).getTime() === startOfDay(now).getTime();

  // Class attendance for selected day
  const classesWithAttendance = myClasses.map(cls => {
    const attended = selCIs.filter(ci => {
      if (!cls.schedule) return false;
      const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!match) return false;
      let sh = parseInt(match[1]);
      if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
      const h = new Date(ci.check_in_date).getHours();
      return h === sh || h === sh + 1;
    });
    return { ...cls, attendees: attended };
  });

  // Last 30 days for mini chart
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return { label: format(d, 'MMM d'), count: dayCheckIns(d).length };
  });
  const maxCount = Math.max(...last30.map(d => d.count), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>

      {/* LEFT COLUMN */}
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
              const isPast = d < now && !isT;
              return (
                <button key={i} onClick={() => setSelectedDay(i)} style={{ flex: 1, padding: '10px 4px', borderRadius: 12, border: active ? '1px solid rgba(167,139,250,0.45)' : isT ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.06)', background: active ? 'rgba(167,139,250,0.12)' : isT ? 'rgba(167,139,250,0.05)' : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: active ? '#a78bfa' : '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{format(d, 'EEE')}</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: active ? '#a78bfa' : isT ? '#f0f4f8' : '#64748b', lineHeight: 1 }}>{format(d, 'd')}</div>
                  {count > 0 ? (
                    <div style={{ marginTop: 5, fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#64748b' }}>{count}</div>
                  ) : (
                    <div style={{ marginTop: 5, height: 12 }}/>
                  )}
                  {isT && !active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa', margin: '4px auto 0' }}/>}
                </button>
              );
            })}
          </div>
        </CoachCard>

        {/* Selected day — classes + attendees */}
        <CoachCard accent="#38bdf8" title={isToday ? `Today · ${selCIs.length} check-ins` : `${format(selDay, 'EEEE, MMM d')} · ${selCIs.length} check-ins`}>
          <div style={{ padding: '12px 16px' }}>
            {classesWithAttendance.length === 0 && selCIs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#3a5070' }}>
                <Clock style={{ width: 20, height: 20, opacity: 0.3, margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No classes or check-ins</p>
                <button onClick={() => openModal('classes')} style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
                  Add a Class
                </button>
              </div>
            ) : (
              <>
                {/* Classes */}
                {classesWithAttendance.map((cls, i) => {
                  const c     = classColor(cls);
                  const key   = `${cls.id}-${format(selDay, 'yyyy-MM-dd')}`;
                  const capacity = cls.max_capacity || 20;
                  const fill = Math.min(100, Math.round((cls.attendees.length / capacity) * 100));
                  const fillColor = fill >= 70 ? '#34d399' : fill >= 40 ? '#fbbf24' : '#38bdf8';
                  return (
                    <div key={cls.id || i} style={{ marginBottom: 14, padding: '14px', borderRadius: 13, background: `${c}06`, border: `1px solid ${c}18` }}>
                      {/* Class header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Dumbbell style={{ width: 13, height: 13, color: c }}/>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{cls.name}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{cls.schedule || 'No time set'}{cls.duration_minutes ? ` · ${cls.duration_minutes}min` : ''}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 900, color: fillColor, lineHeight: 1 }}>{cls.attendees.length}</div>
                          <div style={{ fontSize: 9, color: '#3a5070', marginTop: 1 }}>/{capacity} cap</div>
                        </div>
                      </div>

                      {/* Attendance bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ height: 4, flex: 1, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}bb)`, borderRadius: 99, transition: 'width 0.5s ease' }}/>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: fillColor, flexShrink: 0 }}>{fill}%</span>
                      </div>

                      {/* Attendees */}
                      {cls.attendees.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {cls.attendees.slice(0, 8).map((ci, j) => (
                            <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 7, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)' }}>
                              <MiniAvatar name={ci.user_name} src={avatarMap[ci.user_id]} size={18} color="#34d399"/>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#f0f4f8' }}>{ci.user_name || 'Member'}</span>
                            </div>
                          ))}
                          {cls.attendees.length > 8 && (
                            <div style={{ padding: '3px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 10, color: '#64748b' }}>+{cls.attendees.length - 8}</div>
                          )}
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
                          placeholder="Notes, cues, feedback for this session…"
                          value={notes[key] || ''}
                          onChange={e => saveNote(key, e.target.value)}
                          style={{ width: '100%', minHeight: 60, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Other check-ins (not class-attributed) */}
                {selCIs.length > 0 && classesWithAttendance.every(c => c.attendees.length === 0) && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Members In</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {selCIs.map((ci, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.13)' }}>
                          <MiniAvatar name={ci.user_name} src={avatarMap[ci.user_id]} size={20} color="#34d399"/>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#f0f4f8' }}>{ci.user_name || 'Member'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CoachCard>

        {/* 30-day attendance mini chart */}
        <CoachCard accent="#0ea5e9" title="30-Day Member Activity">
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 64, marginTop: 14 }}>
              {last30.map((d, i) => {
                const h   = d.count === 0 ? 3 : Math.max(5, (d.count / maxCount) * 56);
                const isT = i === 29;
                return (
                  <div key={i} title={`${d.label}: ${d.count}`}
                    style={{ flex: 1, height: h, borderRadius: '3px 3px 1px 1px',
                      background: isT ? '#a78bfa' : d.count > 0 ? 'rgba(167,139,250,0.38)' : 'rgba(255,255,255,0.04)',
                      transition: 'height 0.3s ease' }}/>
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

      {/* RIGHT SIDEBAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Quick actions */}
        <CoachCard accent="#a78bfa" title="Quick Actions">
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { icon: QrCode,   label: 'Scan Check-in',  color: '#10b981', fn: () => openModal('qrScanner') },
              { icon: Calendar, label: 'Create Event',   color: '#34d399', fn: () => openModal('event')     },
              { icon: Dumbbell, label: 'Manage Classes', color: '#a78bfa', fn: () => openModal('classes')   },
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

        {/* My classes list */}
        <CoachCard accent="#a78bfa" title="My Classes">
          <div style={{ padding: '10px 14px' }}>
            {myClasses.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '10px 0', margin: 0 }}>No classes yet</p>
            ) : myClasses.map((cls, i) => {
              const c = classColor(cls);
              return (
                <div key={cls.id || i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < myClasses.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Dumbbell style={{ width: 11, height: 11, color: c }}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{cls.schedule || '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CoachCard>

        {/* Upcoming events */}
        <CoachCard accent="#34d399" title="Upcoming Events" action="+ New" onAction={() => openModal('event')}>
          <div style={{ padding: '10px 14px' }}>
            {upcomingEvents.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '10px 0', margin: 0 }}>None scheduled</p>
            ) : upcomingEvents.map((ev, i) => {
              const d    = new Date(ev.event_date);
              const diff = Math.floor((d - now) / 86400000);
              return (
                <div key={ev.id || i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < upcomingEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', borderRadius: 7, padding: '4px 6px', textAlign: 'center', minWidth: 30 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d, 'd')}</div>
                    <div style={{ fontSize: 7, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d, 'MMM')}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: diff <= 2 ? '#f87171' : '#64748b' }}>
                      {diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CoachCard>
      </div>
    </div>
  );
}