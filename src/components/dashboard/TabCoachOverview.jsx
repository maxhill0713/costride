import React, { useMemo, useState } from 'react';
import { format, subDays, startOfDay, isWithinInterval, addDays } from 'date-fns';
import {
  Activity, Users, AlertCircle, QrCode, FileText, Dumbbell,
  Calendar, CheckCircle, Flame, Clock, UserCheck,
  Trophy, MessageCircle, ChevronRight,
  Star, Target, UserPlus, BookOpen, Bell,
  ClipboardList, Zap, Heart, Award, TrendingUp,
} from 'lucide-react';
import { CoachCard, MiniAvatar, classColor } from './CoachHelpers';

// ── Tiny sparkline ─────────────────────────────────────────────────────────────
function Spark({ data = [], color = '#a78bfa', height = 28 }) {
  if (!data.length || Math.max(...data) === 0) return (
    <div style={{ width: 60, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}/>
    </div>
  );
  const max = Math.max(...data, 1);
  const w = 60;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const area = `${pts} ${w},${height} 0,${height}`;
  const id   = `sp-${color.replace('#','')}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: w, height, display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Hero KPI card ──────────────────────────────────────────────────────────────
function HeroKpi({ icon: Icon, label, value, sub, subColor, accentColor, spark, footerBar }) {
  return (
    <div style={{ borderRadius: 16, padding: '16px 18px', background: '#0c1a2e', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: `linear-gradient(90deg,transparent,${accentColor}40,transparent)`, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: accentColor, opacity: 0.07, filter: 'blur(22px)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: `${accentColor}18`, border: `1px solid ${accentColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color: accentColor }}/>
        </div>
        {spark && <Spark data={spark} color={accentColor}/>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 800, color: '#3a5070', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 10, color: subColor || '#64748b', fontWeight: 600 }}>{sub}</div>
      {footerBar != null && (
        <div style={{ marginTop: 10, height: 3, borderRadius: 99, background: `${accentColor}14`, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, footerBar)}%`, background: `linear-gradient(90deg,${accentColor},${accentColor}cc)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
        </div>
      )}
    </div>
  );
}

// ── Class fill ring ────────────────────────────────────────────────────────────
function FillRing({ pct, color, size = 42 }) {
  const r  = (size - 6) / 2;
  const c  = size / 2;
  const cf = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={cf} strokeDashoffset={cf * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
    </svg>
  );
}

// ── Roster pill (booked vs checked in) ────────────────────────────────────────
function RosterPill({ label, count, color }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}22`, borderRadius: 6, padding: '2px 7px' }}>
      {label}: {count}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TabCoachOverview({
  myClasses, checkIns, allMemberships, avatarMap, openModal, now, selectedGym, posts, events,
}) {
  const [atRiskTab,    setAtRiskTab]    = useState('absent');
  const [rosterClass,  setRosterClass]  = useState(null);   // which class roster is expanded

  // ── Core data ────────────────────────────────────────────────────────────
  const ci7  = useMemo(() => checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,7),  end: now })), [checkIns, now]);
  const ci7p = useMemo(() => checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now,14), end: subDays(now,7) })), [checkIns, now]);

  const todayCI = useMemo(() =>
    checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime()),
    [checkIns, now]
  );
  const todayMemberIds = useMemo(() => [...new Set(todayCI.map(c => c.user_id))], [todayCI]);

  // ── Last check-in per member ─────────────────────────────────────────────
  const memberLastCI = useMemo(() => {
    const m = {};
    checkIns.forEach(c => {
      if (!m[c.user_id] || new Date(c.check_in_date) > new Date(m[c.user_id])) m[c.user_id] = c.check_in_date;
    });
    return m;
  }, [checkIns]);

  // ── At-risk + never visited ──────────────────────────────────────────────
  const atRiskMembers = useMemo(() => allMemberships.filter(m => {
    const l = memberLastCI[m.user_id];
    return l && Math.floor((now - new Date(l)) / 86400000) >= 14;
  }), [allMemberships, memberLastCI, now]);
  const neverVisited  = useMemo(() => allMemberships.filter(m => !memberLastCI[m.user_id]), [allMemberships, memberLastCI]);
  const atRiskAll     = atRiskTab === 'absent' ? atRiskMembers : neverVisited;

  // ── New members (joined in last 14 days) ─────────────────────────────────
  const newMembers = useMemo(() =>
    allMemberships.filter(m => m.start_date && Math.floor((now - new Date(m.start_date)) / 86400000) <= 14)
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
      .slice(0, 6),
    [allMemberships, now]
  );

  // ── Week trend ───────────────────────────────────────────────────────────
  const activeW  = useMemo(() => new Set(ci7.map(c => c.user_id)).size,  [ci7]);
  const activePW = useMemo(() => new Set(ci7p.map(c => c.user_id)).size, [ci7p]);
  const weekTrend = activePW > 0 ? Math.round(((activeW - activePW) / activePW) * 100) : 0;

  // 7-day spark
  const weekSpark = useMemo(() => Array.from({ length: 7 }, (_, i) =>
    checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now, 6-i)).getTime()).length
  ), [checkIns, now]);

  // ── Classes with live attendance + roster ────────────────────────────────
  const classStats = useMemo(() => myClasses.map(cls => {
    const capacity = cls.max_capacity || cls.capacity || 20;
    const attended = todayCI.filter(ci => {
      if (!cls.schedule) return false;
      const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!match) return false;
      let sh = parseInt(match[1]);
      if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
      const h = new Date(ci.check_in_date).getHours();
      return h === sh || h === sh + 1;
    });
    const booked   = cls.bookings || [];         // expected array of { user_id, user_name }
    const waitlist = cls.waitlist || [];          // expected array of { user_id, user_name }
    const classSpark = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i);
      return checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length;
    });
    return {
      ...cls,
      attended: attended.length,
      attendedList: attended,
      capacity,
      booked,
      waitlist,
      fill: Math.min(100, Math.round((attended.length / capacity) * 100)),
      classSpark,
    };
  }), [myClasses, todayCI, checkIns, now]);

  // Average fill rate across all classes today
  const avgFill = classStats.length > 0
    ? Math.round(classStats.reduce((s, c) => s + c.fill, 0) / classStats.length)
    : 0;

  // ── Weekly top performers ────────────────────────────────────────────────
  const weekStars = useMemo(() => {
    const acc = {};
    ci7.forEach(c => { acc[c.user_id] = { name: c.user_name || 'Member', count: (acc[c.user_id]?.count || 0) + 1 }; });
    return Object.entries(acc).sort((a,b) => b[1].count - a[1].count).slice(0,5).map(([uid, d]) => ({ user_id: uid, ...d }));
  }, [ci7]);

  // ── Member milestones ────────────────────────────────────────────────────
  const allVisits = useMemo(() => {
    const m = {};
    checkIns.forEach(c => { m[c.user_id] = (m[c.user_id] || 0) + 1; });
    return m;
  }, [checkIns]);
  const milestones = useMemo(() => allMemberships.map(m => {
    const total = allVisits[m.user_id] || 0;
    const next  = [5, 10, 25, 50, 100, 200, 500].find(n => n > total);
    return { ...m, total, next, toNext: next ? next - total : 0 };
  }).filter(m => m.next && m.toNext <= 3).sort((a,b) => a.toNext - b.toNext).slice(0, 5), [allMemberships, allVisits]);

  // ── Streaks ──────────────────────────────────────────────────────────────
  const topStreaks = useMemo(() => {
    const acc = {};
    allMemberships.forEach(m => {
      let streak = 0;
      const ciDays = new Set(checkIns.filter(c => c.user_id === m.user_id).map(c => startOfDay(new Date(c.check_in_date)).getTime()));
      for (let i = 0; i <= 60; i++) {
        if (ciDays.has(startOfDay(subDays(now, i)).getTime())) streak++;
        else break;
      }
      if (streak > 0) acc[m.user_id] = { name: m.user_name || 'Member', streak, user_id: m.user_id };
    });
    return Object.values(acc).sort((a,b) => b.streak - a.streak).slice(0, 4);
  }, [allMemberships, checkIns, now]);

  // ── Upcoming events (coach's own) ────────────────────────────────────────
  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.event_date) >= now).slice(0, 3), [events, now]);

  // ── Member birthdays in next 7 days ─────────────────────────────────────
  const upcomingBirthdays = useMemo(() =>
    allMemberships.filter(m => {
      if (!m.date_of_birth) return false;
      const dob  = new Date(m.date_of_birth);
      const thisYear = new Date(dob);
      thisYear.setFullYear(now.getFullYear());
      const diff = Math.floor((thisYear - now) / 86400000);
      return diff >= 0 && diff <= 7;
    }).map(m => {
      const dob  = new Date(m.date_of_birth);
      const thisYear = new Date(dob);
      thisYear.setFullYear(now.getFullYear());
      return { ...m, daysUntil: Math.floor((thisYear - now) / 86400000) };
    }).sort((a,b) => a.daysUntil - b.daysUntil).slice(0, 5),
    [allMemberships, now]
  );

  // ── Upcoming PT / personal appointments ─────────────────────────────────
  // appointments expected shape: { id, client_name, client_id, date, type, notes }
  const appointments = useMemo(() => {
    const raw = myClasses.filter(c => c.type === 'personal_training' || c.is_appointment);
    return raw.sort((a,b) => new Date(a.schedule_date||a.schedule) - new Date(b.schedule_date||b.schedule)).slice(0,5);
  }, [myClasses]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const totalM  = allMemberships.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── 1. HERO BANNER ──────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 20, padding: '20px 24px', background: 'linear-gradient(135deg,#0d0720 0%,#0c1a2e 60%,#060f1c 100%)', border: '1px solid rgba(167,139,250,0.18)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(167,139,250,0.07)', filter: 'blur(60px)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -40, left: 100, width: 180, height: 180, borderRadius: '50%', background: 'rgba(56,189,248,0.05)', filter: 'blur(50px)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.4),transparent)', pointerEvents: 'none' }}/>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
              {format(now, 'EEEE, d MMMM yyyy')} · {selectedGym?.name}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.03em', marginBottom: 6 }}>
              {greeting} 👋
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {myClasses.length === 0 ? 'No classes today' : `${myClasses.length} class${myClasses.length !== 1 ? 'es' : ''} today`}
              </span>
              {todayMemberIds.length > 0 && (
                <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', display: 'inline-block' }}/>
                  {todayMemberIds.length} checked in
                </span>
              )}
              {newMembers.length > 0 && (
                <span style={{ fontSize: 12, color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <UserPlus style={{ width: 10, height: 10 }}/> {newMembers.length} new member{newMembers.length !== 1 ? 's' : ''}
                </span>
              )}
              {atRiskMembers.length > 0 && (
                <span style={{ fontSize: 12, color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle style={{ width: 10, height: 10 }}/> {atRiskMembers.length} absent
                </span>
              )}
              {upcomingBirthdays.length > 0 && (
                <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🎂 {upcomingBirthdays.length} birthday{upcomingBirthdays.length !== 1 ? 's' : ''} this week</span>
              )}
            </div>
          </div>

          {/* Quick actions — coach-specific */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', flexShrink: 0 }}>
            {[
              { icon: QrCode,       label: 'Scan QR',      color: '#10b981', fn: () => openModal('qrScanner')  },
              { icon: FileText,     label: 'Post Update',  color: '#38bdf8', fn: () => openModal('post')       },
              { icon: ClipboardList,label: 'Class Notes',  color: '#a78bfa', fn: () => openModal('classNotes') },
              { icon: Calendar,     label: 'Schedule',     color: '#34d399', fn: () => openModal('schedule')   },
              { icon: Dumbbell,     label: 'My Classes',   color: '#f59e0b', fn: () => openModal('classes')    },
            ].map(({ icon: Ic, label, color, fn }, i) => (
              <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: `${color}12`, border: `1px solid ${color}22`, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = `${color}40`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}22`; }}>
                <Ic style={{ width: 12, height: 12 }}/>{label}
              </button>
            ))}
          </div>
        </div>

        {/* Today's class strip */}
        {myClasses.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
            {classStats.map((cls, i) => {
              const c = classColor(cls);
              const fillColor = cls.fill >= 80 ? '#34d399' : cls.fill >= 50 ? '#fbbf24' : '#38bdf8';
              const isExpanded = rosterClass === (cls.id || i);
              return (
                <div key={cls.id||i} onClick={() => setRosterClass(isExpanded ? null : (cls.id || i))}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 11, background: isExpanded ? `${c}14` : `${c}08`, border: `1px solid ${isExpanded ? c : `${c}20`}`, flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
                  <FillRing pct={cls.fill} color={fillColor} size={38}/>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8', whiteSpace: 'nowrap' }}>{cls.name}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      {cls.schedule || '—'} · <span style={{ color: fillColor, fontWeight: 700 }}>{cls.attended}/{cls.capacity}</span>
                      {cls.waitlist?.length > 0 && <span style={{ color: '#f87171', marginLeft: 4 }}>+{cls.waitlist.length} waitlist</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. KPI ROW ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        <HeroKpi icon={Activity}    label="In Today"         value={todayMemberIds.length}  sub={`of ${totalM} members`}                                    accentColor="#10b981" subColor={todayMemberIds.length > 0 ? '#34d399' : '#64748b'} footerBar={totalM > 0 ? (todayMemberIds.length/totalM)*100 : 0}/>
        <HeroKpi icon={Dumbbell}    label="Classes Today"    value={myClasses.length}        sub={`avg fill ${avgFill}%`}                                     accentColor="#a78bfa" footerBar={avgFill}/>
        <HeroKpi icon={TrendingUp}  label="Active This Week" value={activeW}                 sub={weekTrend !== 0 ? `${weekTrend > 0 ? '↑' : '↓'}${Math.abs(weekTrend)}% vs last wk` : 'Same as last week'} accentColor="#38bdf8" subColor={weekTrend > 0 ? '#34d399' : weekTrend < 0 ? '#f87171' : '#64748b'} spark={weekSpark} footerBar={totalM > 0 ? (activeW/totalM)*100 : 0}/>
        <HeroKpi icon={AlertCircle} label="Absent 14+ Days"  value={atRiskMembers.length}    sub={`${neverVisited.length} never visited`}                      accentColor={atRiskMembers.length > 0 ? '#ef4444' : '#10b981'} subColor={atRiskMembers.length > 0 ? '#f87171' : '#34d399'}/>
        <HeroKpi icon={UserPlus}    label="New Members"      value={newMembers.length}        sub="joined last 14 days"                                         accentColor="#38bdf8" subColor={newMembers.length > 0 ? '#38bdf8' : '#64748b'}/>
      </div>

      {/* ── 3. MAIN GRID ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 260px', gap: 16, alignItems: 'start' }}>

        {/* ── COL 1 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Today's check-in feed */}
          <CoachCard accent="#10b981" title={`Members In Today · ${todayMemberIds.length}`} action="Scan QR" onAction={() => openModal('qrScanner')}>
            <div style={{ padding: '12px 16px' }}>
              {todayMemberIds.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px 0' }}>
                  <Clock style={{ width: 20, height: 20, color: '#3a5070', margin: '0 auto 8px' }}/>
                  <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: '0 0 10px' }}>No check-ins yet today</p>
                  <button onClick={() => openModal('qrScanner')} style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Scan First Check-in</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: todayCI.length > 6 ? 10 : 0 }}>
                    {todayMemberIds.slice(0, 12).map((uid) => {
                      const ci   = todayCI.find(c => c.user_id === uid);
                      const mins = Math.floor((now - new Date(ci.check_in_date)) / 60000);
                      const t    = mins < 1 ? 'now' : mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h`;
                      return (
                        <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)' }}>
                          <MiniAvatar name={ci.user_name} src={avatarMap[uid]} size={22} color="#10b981"/>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', whiteSpace: 'nowrap' }}>{ci.user_name || 'Member'}</div>
                            <div style={{ fontSize: 9, color: '#10b981' }}>{t} ago</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {todayMemberIds.length > 12 && (
                    <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: '4px 0' }}>+{todayMemberIds.length - 12} more members</div>
                  )}
                </>
              )}
            </div>
          </CoachCard>

          {/* My classes with roster expansion */}
          <CoachCard accent="#a78bfa" title="My Classes Today" action="Manage" onAction={() => openModal('classes')}>
            <div style={{ padding: '12px 16px' }}>
              {classStats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <Dumbbell style={{ width: 22, height: 22, color: '#3a5070', margin: '0 auto 8px' }}/>
                  <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: '0 0 10px' }}>No classes assigned yet</p>
                  <button onClick={() => openModal('classes')} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Add Your First Class</button>
                </div>
              ) : classStats.map((cls, i) => {
                const c         = classColor(cls);
                const fillColor = cls.fill >= 80 ? '#34d399' : cls.fill >= 50 ? '#fbbf24' : '#38bdf8';
                const isExpanded = rosterClass === (cls.id || i);
                return (
                  <div key={cls.id||i} style={{ marginBottom: i < classStats.length-1 ? 10 : 0 }}>
                    <div style={{ padding: '12px 14px', borderRadius: 13, background: `${c}06`, border: `1px solid ${isExpanded ? c : `${c}1a`}`, position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}
                      onClick={() => setRosterClass(isExpanded ? null : (cls.id || i))}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c, borderRadius: '13px 0 0 13px' }}/>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 10, marginBottom: 8 }}>
                        <FillRing pct={cls.fill} color={fillColor} size={44}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                            {cls.schedule && <span style={{ fontSize: 10, color: '#64748b' }}>🕐 {cls.schedule}</span>}
                            {cls.duration_minutes && <span style={{ fontSize: 10, color: '#3a5070' }}>{cls.duration_minutes}min</span>}
                            {cls.waitlist?.length > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 5, padding: '1px 5px' }}>{cls.waitlist.length} waitlisted</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 900, color: fillColor, lineHeight: 1 }}>{cls.attended}</div>
                          <div style={{ fontSize: 9, color: '#3a5070', marginTop: 1 }}>of {cls.capacity}</div>
                        </div>
                      </div>
                      <div style={{ paddingLeft: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}99)`, borderRadius: 99 }}/>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: fillColor, flexShrink: 0 }}>{cls.fill}%</span>
                        <Spark data={cls.classSpark} color={c} height={22}/>
                      </div>
                    </div>

                    {/* Roster expansion */}
                    {isExpanded && cls.booked.length > 0 && (
                      <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: '0 0 12px 12px', background: `${c}04`, border: `1px solid ${c}14`, borderTop: 'none' }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#3a5070', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Class Roster</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {cls.booked.map((b, j) => {
                            const checkedIn = cls.attendedList.some(ci => ci.user_id === b.user_id);
                            return (
                              <div key={b.user_id||j} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 7, background: checkedIn ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${checkedIn ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                                <MiniAvatar name={b.user_name} src={avatarMap[b.user_id]} size={18} color={checkedIn ? '#34d399' : '#475569'}/>
                                <span style={{ fontSize: 10, fontWeight: 600, color: checkedIn ? '#d4fae8' : '#64748b', whiteSpace: 'nowrap' }}>{b.user_name}</span>
                                {checkedIn && <CheckCircle style={{ width: 9, height: 9, color: '#34d399' }}/>}
                              </div>
                            );
                          })}
                        </div>
                        {cls.waitlist.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: '#f87171', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Waitlist · {cls.waitlist.length}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {cls.waitlist.map((w, j) => (
                                <div key={w.user_id||j} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 7px', borderRadius: 6, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.14)' }}>
                                  <MiniAvatar name={w.user_name} src={avatarMap[w.user_id]} size={16} color="#f87171"/>
                                  <span style={{ fontSize: 9, color: '#f87171', fontWeight: 600 }}>{w.user_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CoachCard>

          {/* Weekly attendance chart */}
          <CoachCard accent="#38bdf8" title="This Week's Attendance">
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72, marginBottom: 8 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const d      = subDays(now, 6 - i);
                  const count  = checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(d).getTime()).length;
                  const isT    = startOfDay(d).getTime() === startOfDay(now).getTime();
                  const maxV   = Math.max(...weekSpark, 1);
                  const h      = count === 0 ? 4 : Math.max(8, (count / maxV) * 64);
                  const color  = isT ? '#a78bfa' : count > 0 ? 'rgba(167,139,250,0.45)' : 'rgba(255,255,255,0.05)';
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      {count > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: isT ? '#a78bfa' : '#64748b' }}>{count}</span>}
                      <div style={{ width: '100%', height: h, borderRadius: '4px 4px 2px 2px', background: color, position: 'relative', transition: 'height 0.4s ease' }}>
                        {isT && count > 0 && <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: '0 0 10px rgba(167,139,250,0.5)' }}/>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const d   = subDays(now, 6-i);
                  const isT = startOfDay(d).getTime() === startOfDay(now).getTime();
                  return <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: isT ? 800 : 600, color: isT ? '#a78bfa' : '#3a5070' }}>{format(d,'EEE')}</div>;
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em' }}>{ci7.length}</div>
                  <div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em' }}>check-ins</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#a78bfa', letterSpacing: '-0.02em' }}>{activeW}</div>
                  <div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em' }}>unique</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: weekTrend > 0 ? '#34d399' : weekTrend < 0 ? '#f87171' : '#64748b', letterSpacing: '-0.02em' }}>
                    {weekTrend > 0 ? `+${weekTrend}` : weekTrend}%
                  </div>
                  <div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em' }}>vs last wk</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.02em' }}>{Math.round(ci7.length / 7 * 10) / 10}</div>
                  <div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em' }}>avg/day</div>
                </div>
              </div>
            </div>
          </CoachCard>
        </div>

        {/* ── COL 2 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* At-risk / absent members with outreach */}
          <CoachCard accent="#f87171" title="Needs Attention">
            <div style={{ padding: '0 16px' }}>
              <div style={{ display: 'flex', gap: 3, padding: '10px 0' }}>
                {[{ id: 'absent', label: `Absent · ${atRiskMembers.length}` }, { id: 'never', label: `Never Visited · ${neverVisited.length}` }].map(t => (
                  <button key={t.id} onClick={() => setAtRiskTab(t.id)} style={{ flex: 1, padding: '5px 8px', borderRadius: 8, border: atRiskTab===t.id ? '1px solid rgba(248,113,113,0.3)' : '1px solid transparent', background: atRiskTab===t.id ? 'rgba(248,113,113,0.1)' : 'transparent', color: atRiskTab===t.id ? '#f87171' : '#3a5070', fontSize: 10, fontWeight: atRiskTab===t.id ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              {atRiskAll.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0 14px' }}>
                  <CheckCircle style={{ width: 18, height: 18, color: '#34d399', margin: '0 auto 6px' }}/>
                  <p style={{ fontSize: 12, color: '#34d399', fontWeight: 700, margin: 0 }}>
                    {atRiskTab === 'absent' ? 'All members active 🎉' : 'Everyone has visited 🎉'}
                  </p>
                </div>
              ) : atRiskAll.slice(0, 6).map((m, i) => {
                const last    = memberLastCI[m.user_id];
                const days    = last ? Math.floor((now - new Date(last)) / 86400000) : null;
                const urgency = days === null || days > 30 ? '#ef4444' : days > 21 ? '#f97316' : '#fbbf24';
                return (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < Math.min(atRiskAll.length,6)-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={28} color={urgency}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                      <div style={{ fontSize: 10, color: urgency }}>{days !== null ? `${days}d absent` : 'Never visited'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => openModal('memberNote', m)} style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>Note</button>
                      <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>Reach</button>
                    </div>
                  </div>
                );
              })}
              {atRiskAll.length > 6 && (
                <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', padding: '8px 0' }}>+{atRiskAll.length - 6} more</div>
              )}
            </div>
          </CoachCard>

          {/* New members to welcome */}
          {newMembers.length > 0 && (
            <CoachCard accent="#38bdf8" title={`👋 New Members · ${newMembers.length}`}>
              <div style={{ padding: '10px 16px' }}>
                {newMembers.map((m, i) => {
                  const daysAgo = Math.floor((now - new Date(m.start_date)) / 86400000);
                  const hasVisited = !!memberLastCI[m.user_id];
                  return (
                    <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < newMembers.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={28} color="#38bdf8"/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>
                          Joined {daysAgo === 0 ? 'today' : `${daysAgo}d ago`} ·{' '}
                          <span style={{ color: hasVisited ? '#34d399' : '#f87171', fontWeight: 600 }}>
                            {hasVisited ? 'visited ✓' : 'not visited yet'}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => openModal('memberNote', m)} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', flexShrink: 0 }}>Intro</button>
                    </div>
                  );
                })}
              </div>
            </CoachCard>
          )}

          {/* Top performers this week */}
          {weekStars.length > 0 && (
            <CoachCard accent="#fbbf24" title="This Week's Top Members">
              <div style={{ padding: '10px 16px' }}>
                {weekStars.map((m, i) => {
                  const medals  = ['🥇','🥈','🥉'];
                  const maxCount = weekStars[0]?.count || 1;
                  return (
                    <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < weekStars.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ fontSize: i < 3 ? 15 : 11, width: 22, textAlign: 'center', flexShrink: 0 }}>{medals[i] || `${i+1}`}</span>
                      <MiniAvatar name={m.name} src={avatarMap[m.user_id]} size={28} color="#fbbf24"/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 5 }}>
                          <div style={{ height: '100%', width: `${(m.count/maxCount)*100}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 99 }}/>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', flexShrink: 0 }}>{m.count}x</span>
                    </div>
                  );
                })}
              </div>
            </CoachCard>
          )}

          {/* Current streaks */}
          {topStreaks.length > 0 && (
            <CoachCard accent="#f59e0b" title="🔥 Current Streaks">
              <div style={{ padding: '10px 16px' }}>
                {topStreaks.map((m, i) => (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < topStreaks.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.name} src={avatarMap[m.user_id]} size={28} color="#f59e0b"/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 5 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (m.streak/30)*100)}%`, background: 'linear-gradient(90deg,#f59e0b,#ef4444)', borderRadius: 99 }}/>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>{m.streak}</div>
                      <div style={{ fontSize: 8, color: '#3a5070' }}>days</div>
                    </div>
                  </div>
                ))}
              </div>
            </CoachCard>
          )}
        </div>

        {/* ── COL 3: SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Milestone celebrations */}
          {milestones.length > 0 && (
            <CoachCard accent="#a78bfa" title="🎯 Close to Milestones">
              <div style={{ padding: '10px 14px' }}>
                {milestones.map((m, i) => (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < milestones.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={26} color="#a78bfa"/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                      <div style={{ fontSize: 9, color: m.toNext === 1 ? '#34d399' : '#64748b' }}>
                        {m.toNext === 1 ? '🎉 1 visit to go!' : `${m.toNext} to reach ${m.next}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: '#a78bfa' }}>{m.total}</div>
                      <div style={{ fontSize: 8, color: '#3a5070' }}>→{m.next}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CoachCard>
          )}

          {/* Birthdays this week */}
          {upcomingBirthdays.length > 0 && (
            <CoachCard accent="#f472b6" title="🎂 Birthdays This Week">
              <div style={{ padding: '10px 14px' }}>
                {upcomingBirthdays.map((m, i) => (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < upcomingBirthdays.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={26} color="#f472b6"/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name}</div>
                      <div style={{ fontSize: 9, color: m.daysUntil === 0 ? '#f472b6' : '#64748b', fontWeight: m.daysUntil === 0 ? 700 : 400 }}>
                        {m.daysUntil === 0 ? '🎉 Today!' : `in ${m.daysUntil} day${m.daysUntil !== 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#f472b6', background: 'rgba(244,114,182,0.07)', border: '1px solid rgba(244,114,182,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', flexShrink: 0 }}>Wish</button>
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
                  const d    = new Date(ev.event_date);
                  const diff = Math.floor((d - now) / 86400000);
                  return (
                    <div key={ev.id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < upcomingEvents.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: 8, padding: '4px 7px', textAlign: 'center', minWidth: 32 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d,'d')}</div>
                        <div style={{ fontSize: 7, fontWeight: 800, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d,'MMM')}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                        <div style={{ fontSize: 9, color: diff <= 2 ? '#f87171' : '#64748b' }}>{diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `${diff}d away`}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CoachCard>
          )}

          {/* Quick class stats summary */}
          <CoachCard accent="#0ea5e9" title="My Class Summary">
            <div style={{ padding: '10px 14px' }}>
              {[
                { label: 'Total check-ins today', value: todayMemberIds.length,  color: '#38bdf8' },
                { label: 'Avg fill rate',          value: `${avgFill}%`,           color: '#a78bfa' },
                { label: 'Check-ins this week',    value: ci7.length,              color: '#34d399' },
                { label: 'Members absent 14d+',    value: atRiskMembers.length,    color: atRiskMembers.length > 0 ? '#f87171' : '#34d399' },
              ].map((s, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < arr.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}20`, borderRadius: 6, padding: '1px 8px' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </CoachCard>

          {/* Recent posts */}
          <CoachCard accent="#34d399" title="My Posts" action="+ New" onAction={() => openModal('post')}>
            <div style={{ padding: '10px 14px' }}>
              {posts.length === 0 ? (
                <p style={{ fontSize: 11, color: '#3a5070', textAlign: 'center', padding: '8px 0', margin: 0 }}>No posts yet</p>
              ) : posts.slice(0,3).map((p,i) => (
                <div key={p.id||i} style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 5, fontSize: 11, fontWeight: 600, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
