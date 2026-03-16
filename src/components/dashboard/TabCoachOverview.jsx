import React, { useMemo } from 'react';
import { format, subDays, startOfDay, isWithinInterval } from 'date-fns';
import {
  Activity, Users, AlertCircle, QrCode, FileText, Dumbbell,
  Calendar, CheckCircle, Flame, TrendingUp, Clock, UserCheck,
} from 'lucide-react';
import { CoachCard, MiniAvatar, classColor } from './CoachHelpers';

function StatPill({ label, value, color = '#a78bfa', sub }) {
  return (
    <div style={{ borderRadius: 14, padding: '16px 18px', background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: `linear-gradient(90deg,transparent,${color}40,transparent)`, pointerEvents: 'none' }}/>
      <div style={{ fontSize: 9, fontWeight: 800, color: '#3a5070', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginTop: 6 }}>{sub}</div>}
      <div style={{ position: 'absolute', bottom: -12, right: -12, width: 48, height: 48, borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(16px)' }}/>
    </div>
  );
}

export default function TabCoachOverview({ myClasses, checkIns, allMemberships, avatarMap, openModal, now, selectedGym, posts, events, challenges }) {
  const ci7  = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 7),  end: now }));
  const ci30 = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 30), end: now }));

  const todayCI = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime());
  const todayMembers = [...new Set(todayCI.map(c => c.user_id))];

  const memberLastCI = {};
  checkIns.forEach(c => {
    if (!memberLastCI[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCI[c.user_id]))
      memberLastCI[c.user_id] = c.check_in_date;
  });

  const atRisk = allMemberships.filter(m => {
    const l = memberLastCI[m.user_id];
    return !l || Math.floor((now - new Date(l)) / 86400000) >= 14;
  });

  const weekStars = useMemo(() => Object.entries(
    ci7.reduce((acc, c) => {
      acc[c.user_id] = { name: c.user_name || 'Member', count: (acc[c.user_id]?.count || 0) + 1 };
      return acc;
    }, {})
  ).sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([uid, d]) => ({ user_id: uid, ...d })), [ci7]);

  // Today's classes with live attendance
  const classStats = useMemo(() => myClasses.map(cls => {
    const capacity = cls.max_capacity || 20;
    const attended = todayCI.filter(ci => {
      if (!cls.schedule) return false;
      const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!match) return false;
      let sh = parseInt(match[1]);
      if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
      const h = new Date(ci.check_in_date).getHours();
      return h === sh || h === sh + 1;
    }).length;
    return { ...cls, attended, capacity, fill: Math.min(100, Math.round((attended / capacity) * 100)) };
  }), [myClasses, todayCI]);

  // Members close to milestones
  const memberVisits = {};
  checkIns.forEach(c => { memberVisits[c.user_id] = (memberVisits[c.user_id] || 0) + 1; });
  const milestones = allMemberships.map(m => {
    const total = memberVisits[m.user_id] || 0;
    const next  = [5, 10, 25, 50, 100, 200].find(n => n > total);
    return { ...m, total, next, toNext: next ? next - total : 0 };
  }).filter(m => m.next && m.toNext <= 3).sort((a, b) => a.toNext - b.toNext).slice(0, 4);

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= now).slice(0, 3);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Active members this week vs last week
  const ci7prev = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 14), end: subDays(now, 7) }));
  const activeW = new Set(ci7.map(c => c.user_id)).size;
  const activePW = new Set(ci7prev.map(c => c.user_id)).size;
  const weekTrend = activePW > 0 ? Math.round(((activeW - activePW) / activePW) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Coach Daily Briefing Banner */}
      <div style={{ borderRadius: 16, padding: '18px 22px', background: 'linear-gradient(135deg,#0d0720 0%,#0c1a2e 50%,#061020 100%)', border: '1px solid rgba(167,139,250,0.18)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(167,139,250,0.06)', filter: 'blur(50px)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.35),transparent)', pointerEvents: 'none' }}/>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              {format(now, 'EEEE, d MMMM')} · {selectedGym?.name}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.02em', marginBottom: 4 }}>{greeting} 👋</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
              {myClasses.length === 0
                ? 'No classes assigned yet'
                : `${myClasses.length} class${myClasses.length !== 1 ? 'es' : ''} · ${todayMembers.length} members in today`}
              {atRisk.length > 0 && <span style={{ color: '#f87171', marginLeft: 8 }}>· {atRisk.length} need attention</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { icon: QrCode,   label: 'Scan QR',     color: '#10b981', fn: () => openModal('qrScanner') },
              { icon: FileText, label: 'Post Update',  color: '#38bdf8', fn: () => openModal('post')      },
              { icon: Dumbbell, label: 'My Classes',   color: '#a78bfa', fn: () => openModal('classes')   },
            ].map(({ icon: Ic, label, color, fn }, i) => (
              <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: `${color}14`, border: `1px solid ${color}25`, color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                <Ic style={{ width: 12, height: 12 }}/>{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs — coach-relevant only */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatPill label="In Today"        value={todayMembers.length} sub={`of ${allMemberships.length} members`} color="#10b981"/>
        <StatPill label="Active This Week" value={activeW}            sub={weekTrend !== 0 ? `${weekTrend > 0 ? '↑' : '↓'}${Math.abs(weekTrend)}% vs last week` : 'same as last week'} color="#38bdf8"/>
        <StatPill label="My Classes"       value={myClasses.length}   sub="in your schedule" color="#a78bfa"/>
        <StatPill label="Need Attention"   value={atRisk.length}      sub="14+ days absent"  color={atRisk.length > 0 ? '#ef4444' : '#10b981'}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Today's Classes */}
          <CoachCard accent="#a78bfa" title="Today's Classes" action="Manage" onAction={() => openModal('classes')}>
            <div style={{ padding: '12px 16px' }}>
              {classStats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Dumbbell style={{ width: 24, height: 24, color: '#3a5070', margin: '0 auto 8px' }}/>
                  <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: 0 }}>No classes assigned yet</p>
                  <button onClick={() => openModal('classes')} style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
                    Add Your First Class
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {classStats.map((cls, i) => {
                    const c = classColor(cls);
                    const fillColor = cls.fill >= 70 ? '#34d399' : cls.fill >= 40 ? '#fbbf24' : '#38bdf8';
                    return (
                      <div key={cls.id || i} style={{ padding: '14px 16px', borderRadius: 13, background: `${c}06`, border: `1px solid ${c}20`, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c, borderRadius: '13px 0 0 13px' }}/>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f4f8' }}>{cls.name}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                              {cls.schedule && <span style={{ fontSize: 10, color: '#64748b' }}>🕐 {cls.schedule}</span>}
                              {cls.duration_minutes && <span style={{ fontSize: 10, color: '#3a5070' }}>{cls.duration_minutes} min</span>}
                              {cls.difficulty && <span style={{ fontSize: 10, color: '#3a5070', textTransform: 'capitalize' }}>{cls.difficulty}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: fillColor, lineHeight: 1 }}>{cls.attended}</div>
                            <div style={{ fontSize: 9, color: '#3a5070', marginTop: 2 }}>of {cls.capacity} cap</div>
                          </div>
                        </div>
                        <div style={{ paddingLeft: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ height: 5, flex: 1, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}bb)`, borderRadius: 99, transition: 'width 0.6s ease' }}/>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: fillColor, flexShrink: 0 }}>{cls.fill}% full</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CoachCard>

          {/* Members checked in today */}
          <CoachCard accent="#10b981" title={`Members In Today · ${todayCI.length}`}>
            <div style={{ padding: '12px 16px' }}>
              {todayCI.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px 0', color: '#3a5070' }}>
                  <Clock style={{ width: 18, height: 18, opacity: 0.3, margin: '0 auto 8px' }}/>
                  <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>No check-ins yet today</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[...new Set(todayCI.map(c => c.user_id))].map((uid, i) => {
                    const ci = todayCI.find(c => c.user_id === uid);
                    const mins = Math.floor((now - new Date(ci.check_in_date)) / 60000);
                    const timeAgo = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
                    return (
                      <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 9, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <MiniAvatar name={ci.user_name} src={avatarMap[uid]} size={24} color="#10b981"/>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8' }}>{ci.user_name || 'Member'}</div>
                          <div style={{ fontSize: 9, color: '#10b981' }}>{timeAgo}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CoachCard>

          {/* This week's top performers */}
          {weekStars.length > 0 && (
            <CoachCard accent="#fbbf24" title="This Week's Top Members">
              <div style={{ padding: '10px 16px' }}>
                {weekStars.map((m, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < weekStars.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontSize: i < 3 ? 16 : 11, width: 20, textAlign: 'center', flexShrink: 0 }}>{medals[i] || `${i + 1}`}</span>
                      <MiniAvatar name={m.name} src={avatarMap[m.user_id]} size={30} color="#fbbf24"/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{m.count} check-in{m.count !== 1 ? 's' : ''} this week</div>
                      </div>
                      <div style={{ height: 4, width: 60, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', width: `${(m.count / (weekStars[0]?.count || 1)) * 100}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 99 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CoachCard>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Members needing attention */}
          <CoachCard accent="#f87171" title="Needs Attention">
            <div style={{ padding: '10px 14px' }}>
              {atRisk.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '14px 0' }}>
                  <CheckCircle style={{ width: 18, height: 18, color: '#34d399', margin: '0 auto 6px' }}/>
                  <p style={{ fontSize: 12, color: '#34d399', fontWeight: 700, margin: 0 }}>All members active 🎉</p>
                </div>
              ) : atRisk.slice(0, 6).map((m, i) => {
                const last = memberLastCI[m.user_id];
                const days = last ? Math.floor((now - new Date(last)) / 86400000) : null;
                const urgency = days === null || days > 30 ? '#ef4444' : days > 21 ? '#f97316' : '#fbbf24';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < Math.min(atRisk.length, 6) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={28} color={urgency}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                      <div style={{ fontSize: 10, color: urgency }}>{days !== null ? `${days}d absent` : 'Never visited'}</div>
                    </div>
                    <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', flexShrink: 0 }}>
                      Reach
                    </button>
                  </div>
                );
              })}
            </div>
          </CoachCard>

          {/* Milestones */}
          {milestones.length > 0 && (
            <CoachCard accent="#a78bfa" title="Close to Milestones">
              <div style={{ padding: '10px 14px' }}>
                {milestones.map((m, i) => (
                  <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={28} color="#a78bfa"/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                      <div style={{ fontSize: 10, color: m.toNext === 1 ? '#10b981' : '#64748b' }}>
                        {m.toNext === 1 ? '🎉 1 visit to go!' : `${m.toNext} visits to ${m.next}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#a78bfa' }}>{m.total}</div>
                      <div style={{ fontSize: 8, color: '#3a5070' }}>visits</div>
                    </div>
                  </div>
                ))}
              </div>
            </CoachCard>
          )}

          {/* Upcoming events */}
          {upcomingEvents.length > 0 && (
            <CoachCard accent="#34d399" title="Upcoming Events" action="+ New" onAction={() => openModal('event')}>
              <div style={{ padding: '10px 14px' }}>
                {upcomingEvents.map((ev, i) => {
                  const d = new Date(ev.event_date);
                  const diff = Math.floor((d - now) / 86400000);
                  return (
                    <div key={ev.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < upcomingEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: 8, padding: '4px 7px', textAlign: 'center', minWidth: 34 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d, 'd')}</div>
                        <div style={{ fontSize: 7, fontWeight: 800, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d, 'MMM')}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                        <div style={{ fontSize: 10, color: diff <= 2 ? '#f87171' : '#64748b' }}>{diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `${diff}d away`}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CoachCard>
          )}

          {/* Quick actions */}
          <CoachCard accent="#a78bfa" title="Quick Actions">
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: QrCode,    label: 'Scan Check-in',  color: '#10b981', fn: () => openModal('qrScanner') },
                { icon: FileText,  label: 'Post to Members', color: '#38bdf8', fn: () => openModal('post')      },
                { icon: Calendar,  label: 'Create Event',    color: '#34d399', fn: () => openModal('event')     },
                { icon: Dumbbell,  label: 'Manage Classes',  color: '#a78bfa', fn: () => openModal('classes')   },
              ].map(({ icon: Ic, label, color, fn }, i) => (
                <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic style={{ width: 10, height: 10, color }}/>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#d4e4f4' }}>{label}</span>
                </button>
              ))}
            </div>
          </CoachCard>
        </div>
      </div>
    </div>
  );
}