/**
 * TabOverview — real dynamic data from GymOwnerDashboard props
 */
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  Users, Plus, ArrowUpRight, Activity,
  AlertTriangle, Flame, TrendingUp, ChevronRight, ChevronDown,
  Calendar,
} from 'lucide-react';

/* ─── TOKENS ─────────────────────────────────────────────── */
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
};
const FONT = "'DM Sans', 'Segoe UI', sans-serif";

/* ─── CLASS COLOR BY TYPE ─────────────────────────────────── */
function classTypeColor(name = '') {
  const n = name.toLowerCase();
  if (n.includes('hiit') || n.includes('boxing') || n.includes('kick')) return '#f59e0b';
  if (n.includes('yoga') || n.includes('pilates') || n.includes('flow')) return '#14b8a6';
  if (n.includes('strength') || n.includes('weight') || n.includes('conditioning')) return '#ff4d6d';
  if (n.includes('spin') || n.includes('cycle') || n.includes('cardio')) return '#6366f1';
  if (n.includes('open') || n.includes('gym') || n.includes('free')) return '#4d7fff';
  return '#8b5cf6';
}

/* ─── MINI COMPONENTS ─────────────────────────────────────── */
function Av({ name, src, size = 28 }) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444'];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[idx], border: `1.5px solid ${C.card}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      flexShrink: 0, overflow: 'hidden',
    }}>
      {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name || '?')[0].toUpperCase()}
    </div>
  );
}

function MiniSparkline({ data = [], color = C.cyan }) {
  const vals = data.length ? data : [0];
  return (
    <ResponsiveContainer width="100%" height={28}>
      <AreaChart data={vals.map(v => ({ v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#spark-grad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Donut({ pct, size = 58, stroke = 5, color = C.cyan }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size < 50 ? 9 : 10, fontWeight: 700, color: C.t1,
      }}>{pct}%</div>
    </div>
  );
}

/* ─── KPI CARD ────────────────────────────────────────────── */
function KpiCard({ label, value, sub, subColor, delta, donutPct, donutColor, sparkData, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</div>
      {delta != null && (
        <div style={{ fontSize: 11, color: delta >= 0 ? C.cyan : C.red, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
          <ArrowUpRight style={{ width: 10, height: 10, transform: delta < 0 ? 'rotate(90deg)' : 'none' }} />
          {delta >= 0 ? '+' : ''}{delta}%
        </div>
      )}
      {sub && <div style={{ fontSize: 10.5, color: subColor || C.t3, marginTop: 2, marginBottom: 4 }}>{sub}</div>}
      {donutPct != null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div />
          <Donut pct={donutPct} size={52} stroke={5} color={donutColor || C.cyan} />
        </div>
      )}
      {sparkData && <MiniSparkline data={sparkData} color={C.cyan} />}
      {children}
    </div>
  );
}

/* ─── SCHEDULE ROW ────────────────────────────────────────── */
function ScheduleRow({ cls, compact = false }) {
  const color = classTypeColor(cls.name);
  // count bookings for this class from schedule array items
  const booked = cls.booked ?? 0;
  const capacity = cls.max_capacity || cls.capacity || 0;
  const pct = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;
  const full = capacity > 0 && booked >= capacity;

  // format time from schedule array (e.g. [{day, time}]) or from event_date
  let timeLabel = cls.time || '';
  if (!timeLabel && cls.schedule && cls.schedule.length > 0) {
    timeLabel = cls.schedule[0].time || '';
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: compact ? 8 : 10,
      padding: compact ? '8px 10px' : '9px 11px',
      borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.brd}`,
      borderLeft: `3px solid ${color}`,
    }}>
      {timeLabel && (
        <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, width: 36, flexShrink: 0 }}>{timeLabel}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</div>
        {cls.instructor && <div style={{ fontSize: 10.5, color: C.t2, marginTop: 1 }}>{cls.instructor}</div>}
      </div>
      {capacity > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <div style={{ width: 60 }}>
            <div style={{ height: 3, background: C.brd, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: full ? C.red : color, borderRadius: 2 }} />
            </div>
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: full ? C.red : C.t2, minWidth: 32, textAlign: 'right' }}>{booked}/{capacity}</span>
          {full && <span style={{ fontSize: 9, fontWeight: 700, color: C.red, background: C.redDim, border: `1px solid ${C.red}40`, borderRadius: 4, padding: '1px 5px' }}>FULL</span>}
        </div>
      )}
    </div>
  );
}

/* ─── AT-RISK MEMBER ROW ──────────────────────────────────── */
function AtRiskRow({ member, avatarMap = {} }) {
  const days = member.daysSinceLastCheckIn ?? member.days ?? '?';
  const isHigh = typeof days === 'number' && days >= 21;
  const isLow  = typeof days === 'number' && days < 21;
  const riskLabel = isHigh ? 'High' : isLow ? 'Medium' : 'High';
  const riskColor = isHigh ? C.red : C.amber;
  const riskBg    = isHigh ? C.redDim : C.amberDim;
  const riskBdr   = isHigh ? 'rgba(255,77,109,0.28)' : 'rgba(245,158,11,0.28)';
  const name = member.user_name || member.name || 'Member';
  const avatar = avatarMap[member.user_id] || member.avatar_url || null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Av name={name} src={avatar} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 10.5, color: C.t3 }}>{typeof days === 'number' ? `${days} days away` : 'Inactive'}</div>
      </div>
      <span style={{ fontSize: 9.5, fontWeight: 700, borderRadius: 4, padding: '2px 7px', flexShrink: 0, color: riskColor, background: riskBg, border: `1px solid ${riskBdr}` }}>
        {riskLabel}
      </span>
    </div>
  );
}

/* ─── COMMUNITY HIGHLIGHTS ─────────────────────────────────── */
function CommunityHighlights({ posts, events, challenges }) {
  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const recentPosts = (posts || [])
    .filter(p => !p.is_hidden && !p.is_draft)
    .slice(0, 3);

  const upcomingEvents = (events || [])
    .filter(e => e.event_date && new Date(e.event_date).getTime() >= now)
    .slice(0, 1);

  const activeChallenge = (challenges || [])
    .find(c => c.status === 'active' || (!c.end_date || new Date(c.end_date).getTime() >= now));

  const items = [];

  if (upcomingEvents.length > 0) {
    const ev = upcomingEvents[0];
    const d = new Date(ev.event_date);
    const isToday = d.getTime() >= todayStartMs && d.getTime() < todayStartMs + 86400000;
    items.push({
      tag: isToday ? '🗓 Event Today' : '🗓 Upcoming Event',
      tagColor: C.red,
      title: ev.title,
      sub: ev.attendees > 0 ? `${ev.attendees} attending` : null,
    });
  }

  recentPosts.forEach(p => {
    const isGymPost = !!p.post_type;
    items.push({
      tag: isGymPost ? `📢 ${p.post_type?.replace('_', ' ')}` : '🆕 New Post',
      tagColor: isGymPost ? C.amber : C.cyan,
      title: p.content?.slice(0, 60) + (p.content?.length > 60 ? '…' : ''),
      sub: Object.keys(p.reactions || {}).length > 0 ? `${Object.keys(p.reactions).length} reactions` : null,
    });
  });

  if (activeChallenge) {
    items.push({
      tag: '🏆 Challenge',
      tagColor: C.green,
      title: activeChallenge.title,
      sub: activeChallenge.participants?.length > 0 ? `${activeChallenge.participants.length} joined` : null,
    });
  }

  if (items.length === 0) {
    return (
      <div style={{ fontSize: 12, color: C.t3, textAlign: 'center', padding: '16px 0' }}>
        No recent community activity
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, items.length)}, 1fr)`, gap: 10 }}>
      {items.slice(0, 3).map((c, i) => (
        <div key={i}
          style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.brd}`, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}
        >
          <div style={{ fontSize: 10.5, fontWeight: 600, color: c.tagColor, marginBottom: 4 }}>{c.tag}</div>
          <div style={{ fontSize: 12.5, color: C.t1, fontWeight: 500, lineHeight: 1.3 }}>{c.title}</div>
          {c.sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>• {c.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP OVERVIEW
═══════════════════════════════════════════════════════════════ */
function DesktopOverview({
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers,
  retentionRate, newSignUps, monthChangePct, atRisk, sparkData,
  checkIns, allMemberships, challenges, posts, events, classes,
  atRiskMembers, openModal, setTab, ownerName,
  peakLabel, peakEntry,
}) {
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  // Today's posts count
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  const isToday = (d) => new Date(d).getTime() >= todayStartMs;
  const postsToday = (posts || []).filter(p => isToday(p.created_date || p.created_at || 0)).length;

  // Live in gym: check-ins in last 2 hours
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const liveCount = (checkIns || []).filter(c => {
    const t = new Date(c.check_in_date || c.created_date || 0).getTime();
    return t > twoHoursAgo;
  }).length;
  const livePct = totalMembers > 0 ? Math.round((liveCount / totalMembers) * 100) : 0;

  // Retention: members active in last 30 days vs total
  const computedRetention = retentionRate ?? (
    totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0
  );
  const retentionTier = computedRetention >= 80 ? 'Elite Tier' : computedRetention >= 60 ? 'Good' : 'Needs Attention';

  // Today's schedule: classes that run today
  const todayDay = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
  const todayClasses = (classes || []).filter(cls => {
    if (!cls.schedule || cls.schedule.length === 0) return true; // show all if no schedule days set
    return cls.schedule.some(s => s.day?.toLowerCase() === todayDay.toLowerCase());
  });
  const shownClasses = scheduleExpanded ? todayClasses : todayClasses.slice(0, 6);

  // At-risk members list — prefer explicit list, fallback to allMemberships sorted by inactivity
  const atRiskList = useMemo(() => {
    if (atRiskMembers && atRiskMembers.length > 0) return atRiskMembers.slice(0, 5);
    // compute from allMemberships + checkIns
    const now = Date.now();
    return (allMemberships || [])
      .map(m => {
        const memberCIs = (checkIns || []).filter(c => c.user_id === m.user_id);
        const lastCI = memberCIs.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        const daysSince = lastCI
          ? Math.floor((now - new Date(lastCI.check_in_date).getTime()) / 86400000)
          : 999;
        return { ...m, daysSinceLastCheckIn: daysSince };
      })
      .filter(m => m.daysSinceLastCheckIn >= 14)
      .sort((a, b) => b.daysSinceLastCheckIn - a.daysSinceLastCheckIn)
      .slice(0, 5);
  }, [atRiskMembers, allMemberships, checkIns]);

  const firstName = ownerName || 'there';

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 11, background: '#000', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 19, fontWeight: 700, color: C.t1, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}.
          </h1>
          <div style={{ fontSize: 12, color: C.t2, marginTop: 4, display: 'flex', gap: 5, alignItems: 'center' }}>
            {activeThisWeek} members active this week
            <span style={{ color: C.t3 }}>•</span>
            {computedRetention}% retention
            {monthChangePct != null && (
              <>
                <span style={{ color: C.t3 }}>•</span>
                <span style={{ color: monthChangePct >= 0 ? C.cyan : C.red }}>
                  {monthChangePct >= 0 ? '+' : ''}{monthChangePct}% from last month
                </span>
              </>
            )}
          </div>
        </div>
        <button onClick={() => openModal?.('post')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: C.cyan, border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
          <Plus style={{ width: 13, height: 13 }} /> New Post
        </button>
      </div>

      {/* Alert bar */}
      {(atRisk > 0 || postsToday > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.brd}`, borderRadius: 8, fontSize: 12, color: C.t2 }}>
          <span>
            {peakLabel && `Peak hours: ${peakLabel}`}
            {peakLabel && atRisk > 0 && ' • '}
            {atRisk > 0 && `${atRisk} at-risk member${atRisk !== 1 ? 's' : ''} detected`}
            {postsToday > 0 && ` • ${postsToday} new post${postsToday !== 1 ? 's' : ''} today`}
          </span>
          <span onClick={() => setTab?.('members')} style={{ color: C.cyan, fontWeight: 600, cursor: 'pointer', marginLeft: 10, flexShrink: 0 }}>View</span>
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        <KpiCard
          label="Today's Check-ins"
          value={todayCI ?? 0}
          delta={todayVsYest}
          sparkData={sparkData}
        />
        <KpiCard
          label="Weekly Active Members"
          value={activeThisWeek ?? 0}
          delta={monthChangePct}
          sparkData={sparkData?.slice(-7)}
        />
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 2 }}>Live in Gym</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {liveCount}<span style={{ fontSize: 15, color: C.t3, fontWeight: 400 }}> now</span>
              </div>
              <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
                {peakLabel ? `Peak: ${peakLabel}` : `${livePct}% of total`}
              </div>
            </div>
            <Donut pct={livePct} size={58} stroke={5} color={C.cyan} />
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginBottom: 2 }}>Retention Score</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: C.cyan, letterSpacing: '-0.03em', lineHeight: 1 }}>{computedRetention}%</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{retentionTier}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule + At-Risk */}
      <div style={{ display: 'flex', gap: 11 }}>
        {/* Schedule */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '16px 18px', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Today's Schedule</span>
            <button onClick={() => openModal?.('classes')} style={{ padding: '5px 12px', borderRadius: 6, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, color: C.cyan, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>+ Add Class</button>
          </div>
          {todayClasses.length === 0 ? (
            <div style={{ fontSize: 12, color: C.t3, textAlign: 'center', padding: '24px 0' }}>
              <Calendar style={{ width: 20, height: 20, marginBottom: 6, opacity: 0.4 }} />
              <div>No classes scheduled for today</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {shownClasses.map((cls, i) => <ScheduleRow key={i} cls={cls} />)}
              </div>
              {todayClasses.length > 6 && (
                <button onClick={() => setScheduleExpanded(!scheduleExpanded)} style={{ width: '100%', marginTop: 8, padding: '9px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.brd}`, borderRadius: 8, color: C.t2, fontSize: 12, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  {scheduleExpanded ? 'Show less' : `${todayClasses.length - 6} more classes`}
                  <ChevronDown style={{ width: 13, height: 13, transform: scheduleExpanded ? 'rotate(180deg)' : 'none' }} />
                </button>
              )}
            </>
          )}
        </div>

        {/* At-Risk */}
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '16px', width: 248, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: C.redDim, border: `1px solid rgba(255,77,109,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle style={{ width: 11, height: 11, color: C.red }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>At-Risk Members</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.red, background: C.redDim, border: `1px solid rgba(255,77,109,0.28)`, borderRadius: 5, padding: '2px 7px' }}>{atRiskList.length}</span>
          </div>
          <div style={{ fontSize: 11, color: C.t3, marginBottom: 12 }}>Haven't visited in 14+ days</div>
          {atRiskList.length === 0 ? (
            <div style={{ fontSize: 12, color: C.green, textAlign: 'center', padding: '16px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <TrendingUp style={{ width: 14, height: 14 }} /> All members active!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, justifyContent: 'space-between' }}>
              {atRiskList.map((m, i) => <AtRiskRow key={m.user_id || i} member={m} />)}
            </div>
          )}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.brd}` }}>
            <button onClick={() => setTab?.('members')} style={{ background: 'none', border: 'none', padding: 0, color: C.cyan, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 4 }}>
              See all at-risk members <ChevronRight style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Community Highlights */}
      <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Community Highlights</span>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            {['Post Photo', 'Create Challenge', 'Schedule Event'].map((lbl, i) => (
              <button key={i} onClick={() => openModal?.(['post', 'challenge', 'event'][i])} style={{ padding: '5px 11px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.brd}`, color: C.t2, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT, fontWeight: 500 }}>{lbl}</button>
            ))}
          </div>
        </div>
        <CommunityHighlights posts={posts} events={events} challenges={challenges} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE OVERVIEW
═══════════════════════════════════════════════════════════════ */
function MobileOverview({
  todayCI, todayVsYest, activeThisWeek, totalMembers,
  retentionRate, atRisk, checkIns, allMemberships,
  challenges, posts, events, classes, atRiskMembers,
  openModal, setTab, monthChangePct,
}) {
  const [expanded, setExpanded] = useState(false);

  const todayDay = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
  const todayClasses = (classes || []).filter(cls => {
    if (!cls.schedule || cls.schedule.length === 0) return true;
    return cls.schedule.some(s => s.day?.toLowerCase() === todayDay.toLowerCase());
  });
  const shown = expanded ? todayClasses : todayClasses.slice(0, 4);

  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const liveCount = (checkIns || []).filter(c => new Date(c.check_in_date || c.created_date || 0).getTime() > twoHoursAgo).length;
  const livePct = totalMembers > 0 ? Math.round((liveCount / totalMembers) * 100) : 0;
  const computedRetention = retentionRate ?? (totalMembers > 0 ? Math.round((activeThisWeek / totalMembers) * 100) : 0);

  const atRiskList = useMemo(() => {
    if (atRiskMembers && atRiskMembers.length > 0) return atRiskMembers.slice(0, 3);
    const now = Date.now();
    return (allMemberships || [])
      .map(m => {
        const memberCIs = (checkIns || []).filter(c => c.user_id === m.user_id);
        const lastCI = memberCIs.sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        const daysSince = lastCI ? Math.floor((now - new Date(lastCI.check_in_date).getTime()) / 86400000) : 999;
        return { ...m, daysSinceLastCheckIn: daysSince };
      })
      .filter(m => m.daysSinceLastCheckIn >= 14)
      .sort((a, b) => b.daysSinceLastCheckIn - a.daysSinceLastCheckIn)
      .slice(0, 3);
  }, [atRiskMembers, allMemberships, checkIns]);

  return (
    <div style={{ fontFamily: FONT }}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Check-ins</span>
            <Activity style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{todayCI ?? 0}</div>
          {todayVsYest != null && (
            <div style={{ fontSize: 11, color: todayVsYest >= 0 ? C.cyan : C.red, fontWeight: 600, marginTop: 4 }}>
              <ArrowUpRight style={{ width: 10, height: 10, display: 'inline' }} /> {todayVsYest >= 0 ? '+' : ''}{todayVsYest}% vs yesterday
            </div>
          )}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Weekly Active</span>
            <Users style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{activeThisWeek ?? 0}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 4 }}>of {totalMembers ?? 0} total</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.brd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Live in Gym</span>
            <Flame style={{ width: 14, height: 14, color: '#6366f1' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, letterSpacing: '-0.04em', lineHeight: 1 }}>{liveCount}</div>
              <div style={{ fontSize: 10.5, color: C.t3, marginTop: 5 }}>{livePct}% of members</div>
            </div>
            <Donut pct={livePct} size={52} stroke={5} color="#6366f1" />
          </div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.cyanBrd}`, borderRadius: 14, padding: '13px 13px 11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: C.t2 }}>Retention</span>
            <TrendingUp style={{ width: 14, height: 14, color: C.cyan }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.cyan, letterSpacing: '-0.04em', lineHeight: 1 }}>{computedRetention}%</div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>
            {computedRetention >= 80 ? 'Elite' : computedRetention >= 60 ? 'Good' : 'Needs Work'}
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 10 }}>Today's Schedule</div>
        {todayClasses.length === 0 ? (
          <div style={{ fontSize: 12, color: C.t3, padding: '16px 0' }}>No classes scheduled today</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {shown.map((cls, i) => <ScheduleRow key={i} cls={cls} compact />)}
            </div>
            {todayClasses.length > 4 && (
              <button onClick={() => setExpanded(!expanded)} style={{ width: '100%', marginTop: 8, padding: '11px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.brd}`, borderRadius: 12, color: C.t2, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                {expanded ? 'Show less' : `${todayClasses.length - 4} more classes`}
                <ChevronDown style={{ width: 13, height: 13, transform: expanded ? 'rotate(180deg)' : 'none' }} />
              </button>
            )}
          </>
        )}
      </div>

      {/* At-Risk */}
      {atRiskList.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, marginBottom: 10 }}>At-Risk Members</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {atRiskList.map((m, i) => (
              <div key={m.user_id || i} style={{ padding: '12px 14px', borderRadius: 13, background: C.card, border: `1px solid ${C.brd}` }}>
                <AtRiskRow member={m} />
              </div>
            ))}
          </div>
          <button onClick={() => setTab?.('members')} style={{ marginTop: 8, fontSize: 12, color: C.cyan, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: FONT }}>
            See all at-risk members →
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabOverview(props) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  return isMobile
    ? <MobileOverview {...props} />
    : <DesktopOverview {...props} />;
}