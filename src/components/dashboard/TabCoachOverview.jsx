import React, { useMemo, useState } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import {
  Activity, AlertCircle, QrCode, Dumbbell,
  Calendar, CheckCircle, Flame, Clock,
  Trophy, Bell, UserPlus,
  TrendingUp, BarChart2,
  X, Target, Zap,
} from 'lucide-react';
import { CoachCard, MiniAvatar, classColor } from './CoachHelpers';

// ── Design tokens — identical to owner Overview ───────────────────────────────
const T = {
  blue:    '#0ea5e9',
  green:   '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
  purple:  '#8b5cf6',
  text1:   '#f0f4f8',
  text2:   '#94a3b8',
  text3:   '#475569',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120',
  divider: 'rgba(255,255,255,0.05)',
};

// Shimmer — 1px top accent line on every card
const Shimmer = ({ color = T.blue }) => (
  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}28,transparent)`, pointerEvents: 'none' }} />
);

// Shared card shell
function SCard({ children, style = {}, accent }) {
  const c = accent || T.blue;
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden', ...style }}>
      <Shimmer color={c} />
      {children}
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Spark({ data = [], color = '#a78bfa', height = 28, width = 60 }) {
  if (!data.length || Math.max(...data) === 0) return (
    <div style={{ width, height, display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}/>
    </div>
  );
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const id = `sp${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width, height, display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`${pts} ${width},${height} 0,${height}`} fill={`url(#${id})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, subColor, accent, spark, bar }) {
  return (
    <div style={{ borderRadius: 12, padding: '16px 18px 14px', background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${accent}28,transparent)`, pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: -16, right: -16, width: 64, height: 64, borderRadius: '50%', background: accent, opacity: 0.07, filter: 'blur(20px)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${accent}14`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 12, height: 12, color: accent }}/>
        </div>
        {spark && <Spark data={spark} color={accent}/>}
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color: T.text1, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 10, color: subColor || T.text3, fontWeight: 600 }}>{sub}</div>
      {bar != null && (
        <div style={{ marginTop: 10, height: 2, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, bar)}%`, background: accent, borderRadius: 99, transition: 'width 0.8s ease' }}/>
        </div>
      )}
    </div>
  );
}

// ─── Fill ring ────────────────────────────────────────────────────────────────
function FillRing({ pct, color, size = 40 }) {
  const r = (size - 6) / 2, c = size / 2, cf = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5"/>
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={cf} strokeDashoffset={cf * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }}/>
    </svg>
  );
}

// ─── Member profile popover ───────────────────────────────────────────────────
function MemberPopover({ member, checkInCount, lastSeen, streak, onClose, avatarSrc }) {
  const absenceDays = lastSeen ? Math.floor((Date.now() - new Date(lastSeen)) / 86400000) : null;
  return (
    <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 999, width: 200, borderRadius: 13, background: '#0d1526', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <MiniAvatar name={member.user_name} src={avatarSrc} size={34} color="#10b981"/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.user_name}</div>
          {member.membership_type && <div style={{ fontSize: 10, color: '#64748b' }}>{member.membership_type}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a5070', padding: 0 }}><X style={{ width: 12, height: 12 }}/></button>
      </div>
      {[
        { label: 'Total visits',   value: checkInCount,                                                                                                   color: '#38bdf8' },
        { label: 'Last seen',      value: absenceDays === 0 ? 'Today' : absenceDays === 1 ? 'Yesterday' : absenceDays != null ? `${absenceDays}d ago` : 'Never', color: absenceDays != null && absenceDays > 14 ? '#f87171' : '#34d399' },
        { label: 'Current streak', value: streak > 0 ? `🔥 ${streak} days` : '—',                                                                        color: '#fbbf24' },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
          <span style={{ fontSize: 10, color: '#64748b' }}>{s.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children, accent = T.purple }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 3, height: 14, borderRadius: 99, background: accent, flexShrink: 0 }}/>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.text1, letterSpacing: '-0.01em' }}>{children}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabCoachOverview({
  myClasses, checkIns, allMemberships, avatarMap, openModal, now, selectedGym, posts, events, challenges = [],
  // Pre-computed from backend
  weekSpark: weekSparkProp = [], engagementSegmentsCoach = {},
  ci7Count = 0, ci7pCount = 0, weeklyTrendCoach = 0,
}) {
  const [atRiskTab,   setAtRiskTab]   = useState('absent');
  const [hoverMember, setHoverMember] = useState(null);

  // ── Today's check-ins (still needs to be computed locally from recentCheckIns) ─
  const todayCI        = useMemo(() => checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime()), [checkIns, now]);
  const todayMemberIds = useMemo(() => [...new Set(todayCI.map(c => c.user_id))], [todayCI]);

  // ── Use pre-enriched membersWithActivity data ────────────────────────────────
  // allMemberships is already enriched with: lastCheckIn, ci30Count, visitsTotal, daysSince, streak
  const memberLastCI = useMemo(() => {
    const m = {};
    allMemberships.forEach(mem => { if (mem.lastCheckIn) m[mem.user_id] = mem.lastCheckIn; });
    return m;
  }, [allMemberships]);

  const allVisits = useMemo(() => {
    const m = {};
    allMemberships.forEach(mem => { m[mem.user_id] = mem.visitsTotal || 0; });
    return m;
  }, [allMemberships]);

  // Streaks from pre-enriched data
  const memberStreak = useMemo(() => {
    const m = {};
    allMemberships.forEach(mem => { m[mem.user_id] = mem.streak || 0; });
    return m;
  }, [allMemberships]);

  // ── Trends (use backend pre-computed values) ─────────────────────────────────
  const activeW   = useMemo(() => new Set(checkIns.filter(c => {
    const d = new Date(c.check_in_date);
    return d >= new Date(now - 7 * 86400000);
  }).map(c => c.user_id)).size, [checkIns, now]);
  const weekTrend = weeklyTrendCoach;
  const weekSpark = weekSparkProp.length > 0 ? weekSparkProp
    : Array.from({ length: 7 }, (_, i) =>
        checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now, 6 - i)).getTime()).length
      );

  // ── 30-day tiers (use backend pre-computed) ───────────────────────────────────
  const totalM      = allMemberships.length;
  const superActive = engagementSegmentsCoach.superActive ?? 0;
  const active      = engagementSegmentsCoach.active      ?? 0;
  const casual      = engagementSegmentsCoach.casual      ?? 0;
  const inactive    = engagementSegmentsCoach.inactive    ?? 0;
  const engRate     = engagementSegmentsCoach.engRate     ?? 0;

  // ── Attention segments (use pre-enriched daysSince) ───────────────────────────
  const atRiskMembers   = useMemo(() => allMemberships.filter(m => m.daysSince !== null && m.daysSince >= 14), [allMemberships]);
  const neverVisited    = useMemo(() => allMemberships.filter(m => !m.lastCheckIn), [allMemberships]);
  const expiringMembers = useMemo(() => allMemberships.filter(m => { if (!m.end_date) return false; const d = Math.floor((new Date(m.end_date) - now) / 86400000); return d >= 0 && d <= 14; }), [allMemberships, now]);
  const attentionCount  = atRiskMembers.length + neverVisited.length + expiringMembers.length;
  const atRiskAll       = atRiskTab === 'absent' ? atRiskMembers : atRiskTab === 'expiring' ? expiringMembers : neverVisited;

  // ── Challenges ────────────────────────────────────────────────────────────────
  const activeChallenges = useMemo(() => challenges.filter(c => c.status === 'active'), [challenges]);

  // ── Milestones (use pre-enriched visitsTotal) ─────────────────────────────────
  const allMilestones = useMemo(() => allMemberships.map(m => {
    const total = m.visitsTotal || 0;
    const next  = [10, 25, 50, 100, 200, 500].find(n => n > total);
    return { ...m, total, next, toNext: next ? next - total : 0 };
  }).filter(m => m.next && m.toNext <= 3).sort((a, b) => a.toNext - b.toNext).slice(0, 6), [allMemberships]);

  // ── Top streaks (use pre-enriched streak) ─────────────────────────────────────
  const topStreaks = useMemo(() => allMemberships
    .filter(m => (m.streak || 0) > 0)
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 5)
    .map(m => ({ user_id: m.user_id, name: m.user_name || 'Member', streak: m.streak || 0 })),
    [allMemberships]
  );

  // ── Top performers ────────────────────────────────────────────────────────────
  const weekStars = useMemo(() => {
    const acc = {};
    checkIns.filter(c => new Date(c.check_in_date) >= new Date(now - 7 * 86400000))
      .forEach(c => { acc[c.user_id] = { name: c.user_name || 'Member', count: (acc[c.user_id]?.count || 0) + 1 }; });
    return Object.entries(acc).sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([uid, d]) => ({ user_id: uid, ...d }));
  }, [checkIns, now]);

  // ── Classes with live data ────────────────────────────────────────────────────
  const classStats = useMemo(() => myClasses.map(cls => {
    const capacity = cls.max_capacity || cls.capacity || 20;
    const booked   = cls.bookings?.length || 0;
    const attended = todayCI.filter(ci => {
      if (!cls.schedule) return false;
      const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!match) return false;
      let sh = parseInt(match[1]);
      if (match[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
      const h = new Date(ci.check_in_date).getHours();
      return h === sh || h === sh + 1;
    }).length;
    const fill = Math.min(100, Math.round(((booked || attended) / capacity) * 100));
    return { ...cls, capacity, booked, attended, fill };
  }), [myClasses, todayCI]);

  const avgFill = classStats.length > 0 ? Math.round(classStats.reduce((s, c) => s + c.fill, 0) / classStats.length) : 0;

  // ── Supporting data ───────────────────────────────────────────────────────────
  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.event_date) >= now).slice(0, 3), [events, now]);
  const newMembers     = useMemo(() => allMemberships.filter(m => m.start_date && Math.floor((now - new Date(m.start_date)) / 86400000) <= 14).sort((a, b) => new Date(b.start_date) - new Date(a.start_date)).slice(0, 4), [allMemberships, now]);
  const upcomingBirthdays = useMemo(() => allMemberships.filter(m => {
    if (!m.date_of_birth) return false;
    const thisYear = new Date(new Date(m.date_of_birth).setFullYear(now.getFullYear()));
    const diff = Math.floor((thisYear - now) / 86400000);
    return diff >= 0 && diff <= 7;
  }).map(m => ({ ...m, daysUntil: Math.floor((new Date(new Date(m.date_of_birth).setFullYear(now.getFullYear())) - now) / 86400000) }))
    .sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 4), [allMemberships, now]);

  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 18, alignItems: 'start' }}>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN COLUMN
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── GREETING BANNER ──────────────────────────────────────────── */}
        <div style={{ borderRadius: 12, padding: '20px 24px', background: `linear-gradient(135deg,${T.card} 0%,#0d1630 60%,${T.card} 100%)`, border: `1px solid ${T.purple}22`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(167,139,250,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }}/>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(167,139,250,0.4),transparent)', pointerEvents: 'none' }}/>
          <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>
            {format(now, 'EEEE, d MMMM yyyy')} · {selectedGym?.name}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.03em', marginBottom: 8 }}>{greeting} 👋</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {todayMemberIds.length > 0 && (
              <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', display: 'inline-block' }}/>
                {todayMemberIds.length} checked in today
              </span>
            )}
            {classStats.length > 0 && <span style={{ fontSize: 12, color: '#64748b' }}>{classStats.length} class{classStats.length !== 1 ? 'es' : ''} today</span>}
            {attentionCount > 0 && (
              <span style={{ fontSize: 12, color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle style={{ width: 10, height: 10 }}/>{attentionCount} need attention
              </span>
            )}
            {newMembers.length > 0 && (
              <span style={{ fontSize: 12, color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <UserPlus style={{ width: 10, height: 10 }}/>{newMembers.length} new this fortnight
              </span>
            )}
            {upcomingBirthdays.length > 0 && (
              <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>🎂 {upcomingBirthdays.length} birthday{upcomingBirthdays.length !== 1 ? 's' : ''} this week</span>
            )}
          </div>
        </div>

        {/* ══ 1. MY CLASSES TODAY ═══════════════════════════════════════════ */}
        <section>
          <SectionLabel accent="#a78bfa">My Classes Today</SectionLabel>
          {classStats.length === 0 ? (
            <div style={{ padding: '20px', borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, textAlign: 'center' }}>
              <Dumbbell style={{ width: 20, height: 20, color: '#3a5070', margin: '0 auto 8px' }}/>
              <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: '0 0 10px' }}>No classes assigned today</p>
              <button onClick={() => openModal('classes')} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>Manage Classes</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {classStats.map((cls, i) => {
                const c         = classColor(cls);
                const fillColor = cls.fill >= 80 ? '#34d399' : cls.fill >= 50 ? '#fbbf24' : '#38bdf8';
                const spotsLeft = cls.capacity - (cls.booked || cls.attended);
                return (
                  <div key={cls.id || i} style={{ borderRadius: 12, background: T.card, border: `1px solid ${c}22`, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c }}/>
                    <div style={{ padding: '13px 16px 13px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <FillRing pct={cls.fill} color={fillColor} size={42}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          {cls.schedule && (
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 6, padding: '2px 8px' }}>
                              🕐 {cls.schedule}
                            </span>
                          )}
                          {cls.duration_minutes && <span style={{ fontSize: 10, color: '#64748b' }}>{cls.duration_minutes}min</span>}
                          {cls.difficulty && <span style={{ fontSize: 10, color: c, fontWeight: 700 }}>{cls.difficulty}</span>}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            <span style={{ color: fillColor, fontWeight: 800 }}>{cls.booked || cls.attended}</span>
                            <span style={{ color: '#3a5070' }}>/{cls.capacity} booked</span>
                          </span>
                          <span style={{ fontSize: 11, color: spotsLeft <= 3 ? '#f87171' : '#64748b', fontWeight: spotsLeft <= 3 ? 700 : 400 }}>
                            {spotsLeft <= 0 ? '🔴 Full' : `${spotsLeft} spots left`}
                          </span>
                          {cls.waitlist?.length > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 5, padding: '1px 6px' }}>{cls.waitlist.length} waitlisted</span>
                          )}
                        </div>
                        <div style={{ marginTop: 7, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}99)`, borderRadius: 99 }}/>
                        </div>
                      </div>
                      <button onClick={() => openModal('qrScanner', cls)} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.1))', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399', fontSize: 11, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.1))'}>
                        <QrCode style={{ width: 12, height: 12 }}/> Start Check-In
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ══ 2. MEMBERS IN TODAY ═══════════════════════════════════════════ */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SectionLabel accent="#10b981">Members In Today</SectionLabel>
            <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 99, padding: '2px 10px' }}>{todayMemberIds.length} checked in</span>
          </div>
          {todayMemberIds.length === 0 ? (
            <div style={{ padding: '18px', borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, textAlign: 'center' }}>
              <Clock style={{ width: 18, height: 18, color: T.text3, margin: '0 auto 7px' }}/>
              <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: '0 0 8px' }}>No check-ins yet today</p>
              <button onClick={() => openModal('qrScanner')} style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>Scan First Check-in</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {todayMemberIds.map(uid => {
                const ci     = todayCI.find(c => c.user_id === uid);
                const mins   = ci ? Math.floor((now - new Date(ci.check_in_date)) / 60000) : 0;
                const t      = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
                const member = allMemberships.find(m => m.user_id === uid);
                return (
                  <div key={uid} style={{ position: 'relative' }}
                    onMouseEnter={() => setHoverMember(uid)}
                    onMouseLeave={() => setHoverMember(null)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.14)', cursor: 'default' }}>
                      <MiniAvatar name={ci?.user_name || '?'} src={avatarMap[uid]} size={24} color="#10b981"/>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', whiteSpace: 'nowrap' }}>{ci?.user_name || 'Member'}</div>
                        <div style={{ fontSize: 9, color: '#10b981' }}>{t}</div>
                      </div>
                    </div>
                    {hoverMember === uid && member && (
                      <MemberPopover
                        member={member}
                        checkInCount={allVisits[uid] || 0}
                        lastSeen={memberLastCI[uid]}
                        streak={memberStreak[uid] || 0}
                        avatarSrc={avatarMap[uid]}
                        onClose={() => setHoverMember(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ══ 3. KEY METRICS ROW ════════════════════════════════════════════ */}
        <section>
          <SectionLabel accent="#38bdf8">Key Metrics</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11, marginBottom: 11 }}>
            <KpiCard icon={Activity}    label="Check-ins Today"   value={todayMemberIds.length}  sub={`of ${totalM} members`}                                      accent="#10b981" subColor={todayMemberIds.length > 0 ? '#34d399' : '#64748b'} bar={totalM > 0 ? (todayMemberIds.length / totalM) * 100 : 0}/>
            <KpiCard icon={TrendingUp}  label="Active This Week"  value={activeW}                sub={weekTrend !== 0 ? `${weekTrend > 0 ? '↑' : '↓'}${Math.abs(weekTrend)}% vs last wk` : 'Flat vs last wk'} accent="#38bdf8" subColor={weekTrend > 0 ? '#34d399' : weekTrend < 0 ? '#f87171' : '#64748b'} spark={weekSpark} bar={totalM > 0 ? (activeW / totalM) * 100 : 0}/>
            <KpiCard icon={BarChart2}   label="Engagement Rate"   value={`${engRate}%`}           sub={`${superActive + active} engaged`}                            accent="#a78bfa" bar={engRate}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 11 }}>
            <KpiCard icon={AlertCircle} label="Needs Attention"   value={attentionCount}          sub={`${atRiskMembers.length} absent · ${expiringMembers.length} expiring`} accent={attentionCount > 0 ? '#ef4444' : '#10b981'} subColor={attentionCount > 0 ? '#f87171' : '#34d399'}/>
            <KpiCard icon={Trophy}      label="Active Challenges" value={activeChallenges.length} sub={`${activeChallenges.reduce((s, c) => s + (c.participants?.length || 0), 0)} participants`} accent="#fbbf24"/>
            {(() => {
              const avgSessions = totalM > 0 ? (allMemberships.reduce((s, m) => s + (m.ci30Count || 0), 0) / totalM) : 0;
              const compliancePct = Math.min(100, Math.round((avgSessions / 12) * 100));
              return <KpiCard icon={Zap} label="Avg Compliance" value={`${compliancePct}%`} sub={`${avgSessions.toFixed(1)} sessions/member/mo`} accent={compliancePct >= 70 ? '#10b981' : compliancePct >= 40 ? '#fbbf24' : '#ef4444'} bar={compliancePct}/>;
            })()}
          </div>
        </section>

        {/* ══ 4. ACTIVITY WIDGETS ═══════════════════════════════════════════ */}
        <section>
          <SectionLabel accent="#38bdf8">Activity</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

            {/* Weekly Attendance Graph */}
            <SCard style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Weekly Attendance</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: weekTrend > 0 ? '#34d399' : weekTrend < 0 ? '#f87171' : '#64748b' }}>
                  {weekTrend > 0 ? '↑' : weekTrend < 0 ? '↓' : '—'}{Math.abs(weekTrend)}% vs last wk
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 68, marginBottom: 8 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const d     = subDays(now, 6 - i);
                  const count = weekSpark[i];
                  const isT   = startOfDay(d).getTime() === startOfDay(now).getTime();
                  const maxV  = Math.max(...weekSpark, 1);
                  const h     = count === 0 ? 4 : Math.max(8, (count / maxV) * 60);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      {count > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: isT ? '#a78bfa' : '#64748b' }}>{count}</span>}
                      <div style={{ width: '100%', height: h, borderRadius: '4px 4px 2px 2px', background: isT ? '#a78bfa' : count > 0 ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.05)', position: 'relative' }}>
                        {isT && count > 0 && <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: '0 0 10px rgba(167,139,250,0.5)' }}/>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
                {Array.from({ length: 7 }, (_, i) => {
                  const d   = subDays(now, 6 - i);
                  const isT = startOfDay(d).getTime() === startOfDay(now).getTime();
                  return <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 9, fontWeight: isT ? 800 : 600, color: isT ? '#a78bfa' : '#3a5070' }}>{format(d, 'EEE')}</div>;
                })}
              </div>
              <div style={{ display: 'flex', gap: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {[
                  { label: 'check-ins', value: ci7Count,                       color: '#38bdf8' },
                  { label: 'unique',    value: activeW,                        color: '#a78bfa' },
                  { label: 'avg/day',   value: (ci7Count / 7).toFixed(1),     color: '#fbbf24' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
                    </div>
                    ))}
                    </div>
                    </SCard>

            {/* 30-Day Engagement Breakdown */}
            <SCard style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>30-Day Engagement</div>
              <div style={{ display: 'flex', height: 7, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 14 }}>
                {totalM > 0 && [
                  { val: superActive, color: '#10b981' },
                  { val: active,      color: '#38bdf8' },
                  { val: casual,      color: '#a78bfa' },
                  { val: inactive,    color: '#334155' },
                ].filter(t => t.val > 0).map((t, i, arr) => (
                  <div key={i} style={{ flex: t.val, background: t.color, opacity: 0.85, borderRadius: i===0?'99px 0 0 99px':i===arr.length-1?'0 99px 99px 0':0 }}/>
                ))}
              </div>
              {[
                { label: 'Super Active', sub: '12+ visits', val: superActive, color: '#10b981' },
                { label: 'Active',       sub: '4–11',       val: active,      color: '#38bdf8' },
                { label: 'Casual',       sub: '1–3',        val: casual,      color: '#a78bfa' },
                { label: 'Inactive',     sub: '0 visits',   val: inactive,    color: '#475569' },
              ].map((t, i) => {
                const pct = totalM > 0 ? Math.round((t.val / totalM) * 100) : 0;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < 3 ? 8 : 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#d4e4f4' }}>{t.label} <span style={{ fontSize: 9, color: '#64748b' }}>{t.sub}</span></span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: t.color }}>{t.val}</span>
                      </div>
                      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${t.color},${t.color}88)`, borderRadius: 99, transition: 'width 0.8s ease' }}/>
                      </div>
                    </div>
                    <span style={{ fontSize: 9, color: '#64748b', width: 24, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                  </div>
                );
                })}
                </SCard>
                </div>

                {/* 30-Day Snapshot */}
          <SCard style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>30-Day Snapshot</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
              {[
                { label: 'Total check-ins',    value: allMemberships.reduce((s,m)=>s+(m.ci30Count||0),0),      color: '#38bdf8' },
                { label: 'Unique members',      value: allMemberships.filter(m=>(m.ci30Count||0)>0).length,        color: '#34d399' },
                { label: 'Avg visits / member', value: totalM > 0 ? (allMemberships.reduce((s,m)=>s+(m.ci30Count||0),0) / totalM).toFixed(1) : '—', color: '#a78bfa' },
                { label: 'Needs attention',     value: attentionCount,                                              color: attentionCount > 0 ? '#f87171' : '#34d399' },
              ].map((s, i, arr) => (
                <div key={i} style={{ padding: '6px 14px', borderRight: i < arr.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#3a5070', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </SCard>
        </section>

        {/* ══ 5. MEMBER INSIGHTS — NEEDS ATTENTION ═════════════════════════ */}
        <section>
          <SectionLabel accent="#f87171">Member Insights</SectionLabel>
          <SCard style={{ overflow: 'hidden' }}>
            {/* Three-tab switcher: Absent / Expiring / Never visited */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { id: 'absent',   label: 'Absent 14d+',   count: atRiskMembers.length,   color: '#f87171' },
                { id: 'expiring', label: 'Expiring Soon',  count: expiringMembers.length, color: '#fbbf24' },
                { id: 'never',    label: 'Never Visited',  count: neverVisited.length,    color: '#64748b' },
              ].map(t => (
                <button key={t.id} onClick={() => setAtRiskTab(t.id)} style={{ flex: 1, padding: '11px 10px', background: 'none', border: 'none', borderBottom: atRiskTab===t.id ? `2px solid ${t.color}` : '2px solid transparent', color: atRiskTab===t.id ? t.color : '#3a5070', fontSize: 11, fontWeight: atRiskTab===t.id ? 800 : 600, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  {t.label}
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 99, background: atRiskTab===t.id ? `${t.color}18` : 'rgba(255,255,255,0.05)', color: atRiskTab===t.id ? t.color : '#3a5070', border: `1px solid ${atRiskTab===t.id ? `${t.color}30` : 'transparent'}` }}>{t.count}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: '8px 16px' }}>
              {atRiskAll.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '18px 0' }}>
                  <CheckCircle style={{ width: 18, height: 18, color: '#34d399', margin: '0 auto 7px' }}/>
                  <p style={{ fontSize: 12, color: '#34d399', fontWeight: 700, margin: 0 }}>
                    {atRiskTab === 'absent' ? 'All members active 🎉' : atRiskTab === 'expiring' ? 'No memberships expiring soon' : 'Everyone has visited 🎉'}
                  </p>
                </div>
              ) : atRiskAll.slice(0, 8).map((m, i) => {
                const last     = memberLastCI[m.user_id];
                const days     = last ? Math.floor((now - new Date(last)) / 86400000) : null;
                const daysLeft = m.end_date ? Math.floor((new Date(m.end_date) - now) / 86400000) : null;
                const urgency  = atRiskTab === 'expiring'
                  ? (daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f97316' : '#fbbf24')
                  : (days === null || days > 30 ? '#ef4444' : days > 21 ? '#f97316' : '#fbbf24');
                return (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < Math.min(atRiskAll.length, 8)-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={30} color={urgency}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                      <div style={{ fontSize: 10, color: urgency, fontWeight: 600 }}>
                        {atRiskTab === 'expiring'
                          ? (daysLeft === 0 ? 'Expires today' : daysLeft === 1 ? 'Expires tomorrow' : `${daysLeft}d until expiry`)
                          : atRiskTab === 'never' ? 'Never visited'
                          : `${days}d absent`}
                      </div>
                    </div>
                    {atRiskTab === 'expiring' && m.membership_type && (
                      <span style={{ fontSize: 9, color: '#fbbf24', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 5, padding: '2px 6px', flexShrink: 0 }}>{m.membership_type}</span>
                    )}
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      <button onClick={() => openModal('memberNote', m)} style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer' }}>Note</button>
                      <button onClick={() => openModal('post', { id: m.user_id, full_name: m.user_name })} style={{ fontSize: 9, fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Zap style={{ width: 9, height: 9 }} /> Nudge
                      </button>
                    </div>
                  </div>
                );
              })}
              {atRiskAll.length > 8 && (
                <div style={{ fontSize: 11, color: T.text3, textAlign: 'center', padding: '8px 0' }}>+{atRiskAll.length - 8} more</div>
              )}
            </div>
          </SCard>
        </section>

        {/* ══ 6. COMMUNITY & MOTIVATION ════════════════════════════════════ */}
        <section>
          <SectionLabel accent="#fbbf24">Community & Motivation</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Milestones: 50th & 100th visit callouts */}
            <SCard style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <Target style={{ width: 14, height: 14, color: '#a78bfa' }}/>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Close to Milestones</span>
              </div>
              {allMilestones.length === 0 ? (
                <p style={{ fontSize: 11, color: '#3a5070', margin: 0, textAlign: 'center', padding: '10px 0' }}>No members near a milestone</p>
              ) : allMilestones.map((m, i) => {
                const isBig  = m.next === 50 || m.next === 100;
                const accent = m.next === 100 ? '#fbbf24' : m.next === 50 ? '#34d399' : '#a78bfa';
                return (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < allMilestones.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={28} color={accent}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                      <div style={{ fontSize: 10, color: m.toNext === 1 ? '#34d399' : '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {m.toNext === 1 ? '🎉 1 visit to go!' : `${m.toNext} visits to ${m.next}`}
                        {isBig && <span style={{ fontSize: 9, fontWeight: 800, color: accent, background: `${accent}14`, borderRadius: 4, padding: '1px 5px' }}>{m.next === 100 ? '💯 100th' : '⭐ 50th'}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: accent }}>{m.total}</div>
                      <div style={{ fontSize: 8, color: '#3a5070' }}>→{m.next}</div>
                    </div>
                  </div>
                );
                })}
                </SCard>

                {/* Streaks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <SCard style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                  <Flame style={{ width: 14, height: 14, color: '#f59e0b' }}/>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Active Streaks</span>
                </div>
                {topStreaks.length === 0 ? (
                  <p style={{ fontSize: 11, color: '#3a5070', margin: 0, textAlign: 'center', padding: '6px 0' }}>No active streaks</p>
                ) : topStreaks.slice(0, 4).map((m, i) => (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < Math.min(topStreaks.length, 4)-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.name} src={avatarMap[m.user_id]} size={26} color="#f59e0b"/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (m.streak / 30) * 100)}%`, background: 'linear-gradient(90deg,#f59e0b,#ef4444)', borderRadius: 99 }}/>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#fbbf24' }}>{m.streak}</div>
                      <div style={{ fontSize: 8, color: '#3a5070' }}>days</div>
                    </div>
                  </div>
                ))}
                </SCard>

                {/* Birthdays */}
              {upcomingBirthdays.length > 0 && (
                <SCard accent="#f472b6" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f0f4f8', marginBottom: 8 }}>🎂 Birthdays This Week</div>
                  {upcomingBirthdays.map((m, i) => (
                    <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < upcomingBirthdays.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={24} color="#f472b6"/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name}</div>
                        <div style={{ fontSize: 9, color: m.daysUntil === 0 ? '#f472b6' : '#64748b' }}>{m.daysUntil === 0 ? '🎉 Today!' : `in ${m.daysUntil}d`}</div>
                      </div>
                      <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#f472b6', background: 'rgba(244,114,182,0.07)', border: '1px solid rgba(244,114,182,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer' }}>Wish</button>
                    </div>
                  ))}
                  </SCard>
                  )}
                  </div>
                  </div>
                  </section>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RIGHT PANEL — QUICK ACTIONS + SUPPORT CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 0 }}>

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <SCard style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Quick Actions</span>
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { icon: QrCode,   label: 'Scan Check-In',   sub: 'Start a class',         color: T.green,  fn: () => openModal('qrScanner') },
              { icon: UserPlus, label: 'Mark Attendance',  sub: 'Log class attendance',  color: '#38bdf8', fn: () => openModal('qrScanner') },
              { icon: Calendar, label: 'Create Event',     sub: 'Schedule something',   color: T.green,  fn: () => openModal('event')     },
              { icon: Bell,     label: 'Send Reminder',    sub: 'Post to members',       color: T.blue,   fn: () => openModal('post')      },
              { icon: Dumbbell, label: 'Manage Classes',   sub: 'Edit your timetable',  color: T.purple, fn: () => openModal('classes')   },
            ].map(({ icon: Icon, label, sub, color, fn }, i) => (
              <button key={i} onClick={fn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 9, background: T.divider, border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.divider; e.currentTarget.style.borderColor = T.border; }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}14`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 12, height: 12, color }}/>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>{label}</div>
                  <div style={{ fontSize: 10, color: T.text3 }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>
        </SCard>

        {/* ── Upcoming Events ───────────────────────────────────────────── */}
        {upcomingEvents.length > 0 && (
          <SCard accent={T.green} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Upcoming Events</span>
              <button onClick={() => openModal('event')} style={{ fontSize: 10, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>+ New</button>
            </div>
            <div style={{ padding: '8px 14px' }}>
              {upcomingEvents.map((ev, i) => {
                const d    = new Date(ev.event_date);
                const diff = Math.floor((d - now) / 86400000);
                return (
                  <div key={ev.id||i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < upcomingEvents.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
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
          </SCard>
        )}

        {/* ── Top Members This Week ─────────────────────────────────────── */}
        {weekStars.length > 0 && (
          <SCard style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Top Members This Week</span>
            </div>
            <div style={{ padding: '8px 14px' }}>
              {weekStars.map((m, i) => {
                const medals   = ['🥇','🥈','🥉'];
                const maxCount = weekStars[0]?.count || 1;
                return (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < weekStars.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: i < 3 ? 14 : 10, width: 18, textAlign: 'center', flexShrink: 0 }}>{medals[i] || `${i+1}`}</span>
                    <MiniAvatar name={m.name} src={avatarMap[m.user_id]} size={26} color="#fbbf24"/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${(m.count / maxCount) * 100}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 99 }}/>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24', flexShrink: 0 }}>{m.count}x</span>
                  </div>
                );
              })}
            </div>
          </SCard>
        )}

        {/* ── New Members ───────────────────────────────────────────────── */}
        {newMembers.length > 0 && (
          <SCard accent={T.blue} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus style={{ width: 12, height: 12, color: T.blue }}/>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>New Members</span>
              <span style={{ fontSize: 10, color: T.blue, marginLeft: 'auto', fontWeight: 700 }}>{newMembers.length}</span>
            </div>
            <div style={{ padding: '8px 12px' }}>
              {newMembers.map((m, i) => {
                const daysAgo    = Math.floor((now - new Date(m.start_date)) / 86400000);
                const hasVisited = !!memberLastCI[m.user_id];
                return (
                  <div key={m.user_id||i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < newMembers.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <MiniAvatar name={m.user_name} src={avatarMap[m.user_id]} size={26} color="#38bdf8"/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name}</div>
                      <div style={{ fontSize: 9, color: '#64748b' }}>
                        {daysAgo === 0 ? 'Joined today' : `${daysAgo}d ago`} ·{' '}
                        <span style={{ color: hasVisited ? '#34d399' : '#f87171', fontWeight: 600 }}>{hasVisited ? 'visited ✓' : 'not in yet'}</span>
                      </div>
                    </div>
                    <button onClick={() => openModal('memberNote', m)} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', flexShrink: 0 }}>Intro</button>
                  </div>
                );
              })}
            </div>
          </SCard>
        )}

        {/* ── My Recent Posts ───────────────────────────────────────────── */}
        <SCard style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>My Recent Posts</span>
            <button onClick={() => openModal('post')} style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>+ New</button>
          </div>
          <div style={{ padding: '8px 12px' }}>
            {posts.length === 0 ? (
              <p style={{ fontSize: 11, color: '#3a5070', margin: 0, textAlign: 'center', padding: '8px 0' }}>No posts yet</p>
            ) : posts.slice(0, 3).map((p, i) => (
              <div key={p.id||i} style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: i < 2 ? 5 : 0, fontSize: 11, fontWeight: 600, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.content?.split('\n')[0] || p.title || 'Post'}
              </div>
            ))}
          </div>
        </SCard>
      </div>
    </div>
  );
}