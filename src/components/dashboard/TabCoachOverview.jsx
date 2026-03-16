import React from 'react';
import { format, subDays, startOfDay, isWithinInterval } from 'date-fns';
import {
  Activity, Users, BarChart2, AlertCircle, QrCode, FileText, Dumbbell,
  Calendar, Trophy, BarChart3, CheckCircle, MessageCircle, Star,
} from 'lucide-react';
import { CoachKpiCard, CoachCard, MiniAvatar, classColor } from './CoachHelpers';

export default function TabCoachOverview({ myClasses, checkIns, allMemberships, avatarMap, openModal, now, selectedGym, posts, events, challenges }) {
  const ci7     = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,7),  end: now }));
  const ci30    = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,30), end: now }));
  const ciPrev7 = checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,14), end: subDays(now,7) }));

  const todayCI  = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime());
  const totalM   = allMemberships.length;
  const activeW  = new Set(ci7.map(c => c.user_id)).size;
  const activePW = new Set(ciPrev7.map(c => c.user_id)).size;
  const weekTrend = activePW > 0 ? Math.round(((activeW - activePW) / activePW) * 100) : 0;

  const memberLastCI = {};
  checkIns.forEach(c => { if (!memberLastCI[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCI[c.user_id])) memberLastCI[c.user_id] = c.check_in_date; });
  const atRisk = allMemberships.filter(m => { const l = memberLastCI[m.user_id]; return !l || Math.floor((now - new Date(l)) / 86400000) >= 14; });
  const attendanceRate = totalM > 0 ? Math.round((new Set(ci30.map(c => c.user_id)).size / totalM) * 100) : 0;

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= now).slice(0, 4);
  const activeChallenges = challenges.filter(c => c.status === 'active');

  const spark7 = Array.from({ length: 7 }, (_, i) =>
    checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now, 6-i)).getTime()).length
  );

  const memberVisits = {};
  checkIns.forEach(c => { memberVisits[c.user_id] = (memberVisits[c.user_id] || 0) + 1; });
  const milestones = allMemberships.map(m => {
    const total = memberVisits[m.user_id] || 0;
    const next  = [5, 10, 25, 50, 100, 200].find(n => n > total);
    return { ...m, total, next, toNext: next ? next - total : 0 };
  }).filter(m => m.next && m.toNext <= 3).sort((a,b) => a.toNext - b.toNext).slice(0, 5);

  const recentFeed = [...checkIns].slice(0, 10).map(c => ({ name: c.user_name || 'Member', user_id: c.user_id, time: c.check_in_date }));

  const weekStars = Object.entries(
    ci7.reduce((acc, c) => { acc[c.user_id] = { name: c.user_name || 'Member', count: (acc[c.user_id]?.count || 0) + 1 }; return acc; }, {})
  ).sort((a,b) => b[1].count - a[1].count).slice(0, 5).map(([uid, d]) => ({ user_id: uid, ...d }));

  const classStats = myClasses.map(cls => {
    const capacity = cls.max_capacity || cls.capacity || 20;
    const attended = ci7.filter(ci => {
      if (!cls.schedule) return false;
      const h = new Date(ci.check_in_date).getHours();
      const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!match) return false;
      let sh = parseInt(match[1]);
      if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
      return h === sh || h === sh + 1;
    }).length;
    return { ...cls, attended, capacity, fill: Math.min(100, Math.round((attended / capacity) * 100)) };
  });

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Hero greeting */}
      <div style={{ borderRadius: 18, padding: '20px 24px', background: 'linear-gradient(135deg,#1a0a3e 0%,#0c1a2e 60%,#061020 100%)', border: '1px solid rgba(167,139,250,0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 180, height: 180, borderRadius: '50%', background: 'rgba(167,139,250,0.08)', filter: 'blur(40px)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.4),transparent)', pointerEvents: 'none' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{selectedGym?.name}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 6 }}>{greeting}, Coach 👋</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
              {todayCI.length === 0 ? 'No check-ins yet today' : `${todayCI.length} member${todayCI.length !== 1 ? 's' : ''} checked in today`}
              {myClasses.length > 0 && ` · ${myClasses.length} class${myClasses.length !== 1 ? 'es' : ''} in your schedule`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { icon: QrCode,   label: 'Scan Check-in', color: '#10b981', fn: () => openModal('qrScanner') },
              { icon: FileText, label: 'New Post',       color: '#38bdf8', fn: () => openModal('post')      },
              { icon: Dumbbell, label: 'My Classes',     color: '#a78bfa', fn: () => openModal('classes')   },
            ].map(({ icon: Ic, label, color, fn }, i) => (
              <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10, background: `${color}14`, border: `1px solid ${color}28`, color, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <Ic style={{ width: 13, height: 13 }}/>{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <CoachKpiCard icon={Activity}    label="Today's Check-ins" value={todayCI.length}   sub={totalM > 0 ? `of ${totalM} members` : 'no members yet'} accentColor="#10b981" subColor={todayCI.length > 0 ? '#34d399' : '#64748b'} footerBar={totalM > 0 ? (todayCI.length / totalM) * 100 : 0}/>
            <CoachKpiCard icon={Users}       label="Active This Week"  value={activeW}          sub="members checked in" accentColor="#0ea5e9" trend={weekTrend} footerBar={totalM > 0 ? (activeW / totalM) * 100 : 0}/>
            <CoachKpiCard icon={BarChart2}   label="Attendance Rate"   value={`${attendanceRate}%`} sub="30-day average" accentColor="#a78bfa" footerBar={attendanceRate}/>
            <CoachKpiCard icon={AlertCircle} label="At Risk"           value={atRisk.length}    sub="14+ days absent"   accentColor={atRisk.length > 0 ? '#ef4444' : '#10b981'} subColor={atRisk.length > 0 ? '#f87171' : '#34d399'}/>
          </div>

          {/* My Classes */}
          <CoachCard accent="#a78bfa" title="My Classes" action="Manage" onAction={() => openModal('classes')}>
            <div style={{ padding: '14px 16px' }}>
              {classStats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Dumbbell style={{ width: 22, height: 22, color: '#3a5070', margin: '0 auto 8px' }}/>
                  <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: 0 }}>No classes in your schedule yet</p>
                  <button onClick={() => openModal('classes')} style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Add Your First Class</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {classStats.map((cls, i) => {
                    const c = classColor(cls);
                    const fillColor = cls.fill >= 80 ? '#34d399' : cls.fill >= 50 ? '#fbbf24' : '#38bdf8';
                    return (
                      <div key={cls.id || i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: `1px solid ${c}22`, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: c, borderRadius: '12px 0 0 12px' }}/>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8, marginBottom: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>{cls.name || cls.title}</div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                              {cls.schedule && <span style={{ fontSize: 10, color: '#64748b' }}>🕐 {cls.schedule}</span>}
                              {cls.duration_minutes && <span style={{ fontSize: 10, color: '#3a5070' }}>{cls.duration_minutes}min</span>}
                              {cls.difficulty && <span style={{ fontSize: 10, color: '#3a5070', textTransform: 'capitalize' }}>{cls.difficulty}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: fillColor }}>{cls.attended}</div>
                            <div style={{ fontSize: 9, color: '#3a5070' }}>/{cls.capacity} this week</div>
                          </div>
                        </div>
                        <div style={{ paddingLeft: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ height: 4, flex: 1, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}aa)`, borderRadius: 99, transition: 'width 0.6s ease' }}/>
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

          {/* Weekly attendance chart */}
          <CoachCard accent="#38bdf8" title="Weekly Attendance">
            <div style={{ padding: '0 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72, marginTop: 14 }}>
                {spark7.map((val, i) => {
                  const d = subDays(now, 6 - i);
                  const isToday = startOfDay(d).getTime() === startOfDay(now).getTime();
                  const maxVal = Math.max(...spark7, 1);
                  const h = val === 0 ? 4 : Math.max(8, (val / maxVal) * 64);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: '100%', borderRadius: '4px 4px 2px 2px', height: h, background: isToday ? '#a78bfa' : val > 0 ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.05)', transition: 'height 0.4s ease', position: 'relative' }}>
                        {val > 0 && <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: isToday ? '#a78bfa' : '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>{val}</div>}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 600, color: isToday ? '#a78bfa' : '#3a5070' }}>{format(d, 'EEE')}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Week total: <strong style={{ color: '#f0f4f8' }}>{ci7.length}</strong></span>
                <span style={{ fontSize: 11, color: '#64748b' }}>Unique: <strong style={{ color: '#f0f4f8' }}>{new Set(ci7.map(c => c.user_id)).size}</strong></span>
                <span style={{ fontSize: 11, color: '#64748b' }}>Month: <strong style={{ color: '#f0f4f8' }}>{ci30.length}</strong></span>
              </div>
            </div>
          </CoachCard>

          {/* At-risk + Upcoming events */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <CoachCard accent="#ef4444" title="At-Risk Members">
              <div style={{ padding: '12px 16px' }}>
                {atRisk.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '14px 0' }}>
                    <CheckCircle style={{ width: 20, height: 20, color: '#34d399', margin: '0 auto 6px' }}/>
                    <p style={{ fontSize: 12, color: '#34d399', fontWeight: 700, margin: 0 }}>All members active 🎉</p>
                  </div>
                ) : atRisk.slice(0, 6).map((m, i) => {
                  const last = memberLastCI[m.user_id];
                  const days = last ? Math.floor((now - new Date(last)) / 86400000) : null;
                  const urgency = days === null || days > 30 ? '#ef4444' : days > 21 ? '#f97316' : '#fbbf24';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < Math.min(atRisk.length,6)-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={28} color={urgency}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                        <div style={{ fontSize: 10, color: urgency }}>{days !== null ? `${days}d absent` : 'Never visited'}</div>
                      </div>
                      <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', flexShrink: 0 }}>Reach</button>
                    </div>
                  );
                })}
              </div>
            </CoachCard>

            <CoachCard accent="#34d399" title="Upcoming Events" action="+ New" onAction={() => openModal('event')}>
              <div style={{ padding: '12px 16px' }}>
                {upcomingEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '14px 0' }}>
                    <Calendar style={{ width: 20, height: 20, color: '#3a5070', margin: '0 auto 6px' }}/>
                    <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: 0 }}>No events scheduled</p>
                  </div>
                ) : upcomingEvents.map((ev, i) => {
                  const d = new Date(ev.event_date);
                  const diff = Math.floor((d - now) / 86400000);
                  return (
                    <div key={ev.id||i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < upcomingEvents.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: 8, padding: '4px 7px', textAlign: 'center', minWidth: 34 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d,'d')}</div>
                        <div style={{ fontSize: 7, fontWeight: 800, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d,'MMM')}</div>
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
          </div>

          {/* Active challenges */}
          {activeChallenges.length > 0 && (
            <CoachCard accent="#fbbf24" title="Active Challenges" action="+ New" onAction={() => openModal('challenge')}>
              <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                {activeChallenges.slice(0, 4).map((ch, i) => {
                  const start = new Date(ch.start_date), end = new Date(ch.end_date);
                  const total = Math.max(1, Math.floor((end - start) / 86400000));
                  const elapsed = Math.max(0, Math.floor((now - start) / 86400000));
                  const pct = Math.min(100, Math.round((elapsed / total) * 100));
                  const remaining = Math.max(0, total - elapsed);
                  return (
                    <div key={ch.id||i} style={{ padding: '12px', borderRadius: 11, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.14)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Trophy style={{ width: 13, height: 13, color: '#fbbf24', flexShrink: 0 }}/>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ch.title}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 6 }}>
                        <span>👥 {(ch.participants||[]).length} joined</span>
                        <span>{remaining}d left</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: 99 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CoachCard>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Live check-in feed */}
          <CoachCard accent="#10b981" title="Live Feed">
            <div style={{ padding: '10px 14px' }}>
              {recentFeed.length === 0 ? (
                <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '12px 0', margin: 0 }}>No activity yet today</p>
              ) : recentFeed.map((a, i) => {
                const mins = Math.floor((now - new Date(a.time)) / 60000);
                const t = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins/60)}h ago` : `${Math.floor(mins/1440)}d ago`;
                const isRecent = mins < 30;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: i < recentFeed.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={a.name} src={avatarMap[a.user_id]} size={28} color={isRecent ? '#10b981' : '#38bdf8'}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                      <div style={{ fontSize: 9, color: isRecent ? '#10b981' : '#3a5070' }}>{t}</div>
                    </div>
                    {isRecent && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', flexShrink: 0 }}/>}
                  </div>
                );
              })}
            </div>
          </CoachCard>

          {/* This week's stars */}
          {weekStars.length > 0 && (
            <CoachCard accent="#fbbf24" title="⭐ This Week's Stars">
              <div style={{ padding: '10px 14px' }}>
                {weekStars.map((m, i) => (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < weekStars.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: i === 0 ? 'rgba(251,191,36,0.2)' : i === 1 ? 'rgba(192,192,192,0.15)' : 'rgba(205,127,50,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : '#cd7f32', flexShrink: 0 }}>{i + 1}</div>
                    <MiniAvatar name={m.name} src={avatarMap[m.user_id]} size={26} color="#fbbf24"/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', borderRadius: 6, padding: '2px 7px', flexShrink: 0 }}>{m.count}x</span>
                  </div>
                ))}
              </div>
            </CoachCard>
          )}

          {/* Milestones */}
          {milestones.length > 0 && (
            <CoachCard accent="#a78bfa" title="🏆 Close to Milestones">
              <div style={{ padding: '10px 14px' }}>
                {milestones.map((m, i) => (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < milestones.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
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

          {/* Quick actions */}
          <CoachCard accent="#a78bfa" title="Quick Actions">
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: QrCode,    label: 'Scan Check-in',  color: '#10b981', fn: () => openModal('qrScanner') },
                { icon: FileText,  label: 'Post Update',     color: '#38bdf8', fn: () => openModal('post')      },
                { icon: Calendar,  label: 'Add Event',       color: '#34d399', fn: () => openModal('event')     },
                { icon: Trophy,    label: 'New Challenge',   color: '#fbbf24', fn: () => openModal('challenge') },
                { icon: Dumbbell,  label: 'Manage Classes',  color: '#a78bfa', fn: () => openModal('classes')   },
                { icon: BarChart3, label: 'Create Poll',     color: '#f87171', fn: () => openModal('poll')      },
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

          {/* My posts */}
          <CoachCard accent="#34d399" title="My Posts" action="+ New" onAction={() => openModal('post')}>
            <div style={{ padding: '10px 14px' }}>
              {posts.length === 0 ? (
                <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '10px 0', margin: 0 }}>No posts yet — engage your members!</p>
              ) : posts.slice(0,4).map((p, i) => (
                <div key={p.id||i} style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 5, fontSize: 11, fontWeight: 600, color: '#94a3b8', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.content?.split('\n')[0] || p.title || 'Post'}
                </div>
              ))}
            </div>
          </CoachCard>
        </div>
      </div>
    </div>
  );
}