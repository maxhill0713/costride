import React, { useState } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { Clock, Dumbbell, Calendar, QrCode, Trophy } from 'lucide-react';
import { CoachCard, MiniAvatar, classColor } from './CoachHelpers';

export default function TabCoachSchedule({ myClasses, checkIns, events, challenges, avatarMap, openModal, now }) {
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

  const week = Array.from({ length: 7 }, (_, i) => subDays(now, 3 - i));

  const dayCheckIns = (day) => checkIns.filter(c =>
    startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(day).getTime()
  );

  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= subDays(now, 1))
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 6);

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return {
      label: format(d, 'MMM d'),
      count: checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length,
    };
  });
  const maxCount = Math.max(...last30.map(d => d.count), 1);

  const selDay  = week[selectedDay];
  const selCIs  = dayCheckIns(selDay);
  const isToday = startOfDay(selDay).getTime() === startOfDay(now).getTime();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Week strip */}
        <CoachCard accent="#a78bfa" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', marginBottom: 12 }}>Weekly View</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {week.map((d, i) => {
              const isT   = startOfDay(d).getTime() === startOfDay(now).getTime();
              const count = dayCheckIns(d).length;
              const active = i === selectedDay;
              return (
                <button key={i} onClick={() => setSelectedDay(i)} style={{ flex: 1, padding: '10px 4px', borderRadius: 12, border: active ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.06)', background: active ? 'rgba(167,139,250,0.1)' : isT ? 'rgba(255,255,255,0.03)' : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{format(d,'EEE')}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: active ? '#a78bfa' : isT ? '#f0f4f8' : '#64748b', lineHeight: 1 }}>{format(d,'d')}</div>
                  {count > 0 && <div style={{ marginTop: 5, fontSize: 9, fontWeight: 700, color: active ? '#a78bfa' : '#64748b' }}>{count}</div>}
                  {isT && !active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa', margin: '4px auto 0' }}/>}
                </button>
              );
            })}
          </div>
        </CoachCard>

        {/* Selected day detail */}
        <CoachCard accent="#38bdf8" title={`${isToday ? 'Today' : format(selDay, 'EEEE, MMM d')} · ${selCIs.length} check-ins`}>
          <div style={{ padding: '12px 16px' }}>
            {myClasses.length === 0 && selCIs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#3a5070' }}>
                <Clock style={{ width: 20, height: 20, opacity: 0.3, margin: '0 auto 8px' }}/>
                <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>Nothing scheduled</p>
              </div>
            ) : (
              <>
                {myClasses.map((cls, i) => {
                  const c = classColor(cls);
                  return (
                    <div key={cls.id||i} style={{ marginBottom: 12, padding: '12px 14px', borderRadius: 12, background: `${c}06`, border: `1px solid ${c}20` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Dumbbell style={{ width: 12, height: 12, color: c }}/>
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{cls.name}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{cls.schedule || 'No schedule set'}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 800, color: c, background: `${c}15`, borderRadius: 5, padding: '2px 7px' }}>
                          {selCIs.length} attended
                        </span>
                      </div>
                      <textarea
                        placeholder="Session notes (auto-saved)…"
                        value={notes[`${cls.id}-${format(selDay,'yyyy-MM-dd')}`] || ''}
                        onChange={e => saveNote(`${cls.id}-${format(selDay,'yyyy-MM-dd')}`, e.target.value)}
                        style={{ width: '100%', minHeight: 64, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                      />
                      {notes[`${cls.id}-${format(selDay,'yyyy-MM-dd')}`] && (
                        <div style={{ marginTop: 4, fontSize: 9, color: '#34d399', fontWeight: 600 }}>✓ Notes saved</div>
                      )}
                    </div>
                  );
                })}
                {selCIs.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Checked In</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selCIs.map((ci, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
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

        {/* 30-day attendance chart */}
        <CoachCard accent="#0ea5e9" title="30-Day Attendance" style={{ padding: 0 }}>
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginTop: 14 }}>
              {last30.map((d, i) => {
                const h = d.count === 0 ? 3 : Math.max(6, (d.count / maxCount) * 72);
                const isT = i === 29;
                return (
                  <div key={i} title={`${d.label}: ${d.count}`} style={{ flex: 1, height: h, borderRadius: '3px 3px 1px 1px', background: isT ? '#a78bfa' : d.count > 0 ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.04)', transition: 'height 0.3s ease' }}/>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 9, color: '#3a5070' }}>{format(subDays(now,29),'MMM d')}</span>
              <span style={{ fontSize: 9, color: '#a78bfa', fontWeight: 700 }}>Today</span>
            </div>
          </div>
        </CoachCard>
      </div>

      {/* RIGHT */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <CoachCard accent="#a78bfa" title="Quick Actions">
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { icon: QrCode,   label: 'Scan Check-in',  color: '#10b981', fn: () => openModal('qrScanner') },
              { icon: Calendar, label: 'Schedule Event', color: '#34d399', fn: () => openModal('event')     },
              { icon: Trophy,   label: 'New Challenge',  color: '#fbbf24', fn: () => openModal('challenge') },
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

        <CoachCard accent="#34d399" title="Upcoming Events" action="+ New" onAction={() => openModal('event')}>
          <div style={{ padding: '10px 14px' }}>
            {upcomingEvents.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '10px 0', margin: 0 }}>None scheduled</p>
            ) : upcomingEvents.map((ev, i) => {
              const d = new Date(ev.event_date);
              const diff = Math.floor((d - now) / 86400000);
              return (
                <div key={ev.id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < upcomingEvents.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', borderRadius: 7, padding: '4px 6px', textAlign: 'center', minWidth: 30 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d,'d')}</div>
                    <div style={{ fontSize: 7, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d,'MMM')}</div>
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

        <CoachCard accent="#a78bfa" title="My Classes">
          <div style={{ padding: '10px 14px' }}>
            {myClasses.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '10px 0', margin: 0 }}>No classes yet</p>
            ) : myClasses.map((cls, i) => {
              const c = classColor(cls);
              return (
                <div key={cls.id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < myClasses.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
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
      </div>
    </div>
  );
}