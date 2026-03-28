import React, { useMemo, useState } from 'react';
import { format, isToday, subDays, startOfDay } from 'date-fns';
import {
  AlertCircle, MessageCircle, Calendar, Zap, Flame,
  TrendingDown, TrendingUp, CheckCircle, X, UserX,
  BarChart2, Plus, QrCode, AlertTriangle, Sun, Sunset,
  Dumbbell, RefreshCw, Minus,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:      '#080e18',
  surface: '#0c1422',
  card:    '#0f1928',
  border:  'rgba(255,255,255,0.07)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569', t4: '#2d3f55',
  red:    '#ef4444',
  amber:  '#f59e0b',
  green:  '#10b981',
  blue:   '#3b82f6',
  purple: '#a78bfa',
};

// ─── Retention score calculator ────────────────────────────────────────────────
// Returns { score: 0-100, status: 'safe'|'at_risk'|'high_risk', trend: 'improving'|'stable'|'declining', label, color, emoji }
function calcRetentionScore(userId, checkIns, now) {
  const userCIs = checkIns.filter(c => c.user_id === userId);
  const ms = (d) => now - new Date(d.check_in_date);

  const recent7  = userCIs.filter(c => ms(c) < 7  * 86400000).length;
  const recent30 = userCIs.filter(c => ms(c) < 30 * 86400000).length;
  const prev30   = userCIs.filter(c => ms(c) >= 30 * 86400000 && ms(c) < 60 * 86400000).length;

  const sorted = [...userCIs].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const last = sorted[0];
  const daysAgo = last ? Math.floor((now - new Date(last.check_in_date)) / 86400000) : 999;

  // Score components (higher = better retained)
  let score = 100;
  if (daysAgo >= 999)      score -= 60;
  else if (daysAgo > 21)   score -= 45;
  else if (daysAgo > 14)   score -= 30;
  else if (daysAgo > 7)    score -= 15;
  else if (daysAgo > 3)    score -= 5;

  if (recent30 === 0)      score -= 25;
  else if (recent30 <= 2)  score -= 15;
  else if (recent30 <= 4)  score -= 5;

  score = Math.max(0, Math.min(100, score));

  const trend = prev30 > 0
    ? (recent30 > prev30 * 1.1 ? 'improving' : recent30 < prev30 * 0.7 ? 'declining' : 'stable')
    : (recent30 >= 2 ? 'improving' : 'stable');

  const status = score >= 65 ? 'safe' : score >= 35 ? 'at_risk' : 'high_risk';
  const color  = status === 'safe' ? D.green : status === 'at_risk' ? D.amber : D.red;
  const emoji  = status === 'safe' ? '🟢' : status === 'at_risk' ? '🟡' : '🔴';
  const label  = status === 'safe' ? 'Safe' : status === 'at_risk' ? 'At Risk' : 'High Risk';

  return { score, status, trend, color, emoji, label, daysAgo, recent30, prev30 };
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
function Card({ children, style = {}, accent }) {
  return (
    <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, position: 'relative', overflow: 'hidden', ...style }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${accent}80,${accent}20,transparent)` }} />}
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, label, color = D.t2, count, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 11, height: 11, color }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: D.t1 }}>{label}</span>
        {count != null && count > 0 && (
          <span style={{ fontSize: 10, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}28`, borderRadius: 99, padding: '1px 7px' }}>{count}</span>
        )}
      </div>
      {onAction && (
        <button onClick={onAction} style={{ fontSize: 11, fontWeight: 600, color: D.blue, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {action || 'View all'}
        </button>
      )}
    </div>
  );
}

function Btn({ label, icon: Icon, color = D.blue, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: `${color}10`, border: `1px solid ${color}25`, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
      {Icon && <Icon style={{ width: 10, height: 10 }} />}
      {label}
    </button>
  );
}

// Quick actions row — 4 core actions
function QuickActions({ member, openModal }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      <Btn label="Message"   icon={MessageCircle} color={D.blue}   onClick={() => openModal('post',           { memberId: member.user_id })} />
      <Btn label="Book"      icon={Calendar}      color={D.purple} onClick={() => openModal('bookIntoClass',  { memberId: member.user_id, memberName: member.user_name })} />
      <Btn label="Reschedule"icon={RefreshCw}     color={D.amber}  onClick={() => openModal('bookIntoClass',  { memberId: member.user_id, memberName: member.user_name, reschedule: true })} />
      <Btn label="Workout"   icon={Dumbbell}      color={D.green}  onClick={() => openModal('assignWorkout',  { memberId: member.user_id, memberName: member.user_name })} />
    </div>
  );
}

// Retention score badge
function RetentionBadge({ rs, compact = false }) {
  const TrendIcon = rs.trend === 'improving' ? TrendingUp : rs.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = rs.trend === 'improving' ? D.green : rs.trend === 'declining' ? D.red : D.t3;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: compact ? 11 : 13, fontWeight: 900, color: rs.color, lineHeight: 1 }}>{rs.emoji} {rs.score}</div>
        {!compact && <div style={{ fontSize: 8, color: D.t4, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 1 }}>{rs.label}</div>}
      </div>
      <TrendIcon style={{ width: 10, height: 10, color: trendColor }} />
    </div>
  );
}

// ─── 1. Header ─────────────────────────────────────────────────────────────────
function TodayHeader({ currentUser, todayCI, noShows, attentionCount }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.display_name?.split(' ')[0] || currentUser?.full_name?.split(' ')[0] || 'Coach';
  const GreetIcon = hour < 17 ? Sun : Sunset;

  return (
    <Card style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <GreetIcon style={{ width: 16, height: 16, color: D.amber }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: D.t3 }}>{format(new Date(), 'EEEE, d MMMM yyyy')}</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: D.t1, letterSpacing: '-0.03em', margin: 0 }}>{greeting}, {firstName}</h1>
          <p style={{ fontSize: 13, color: D.t3, margin: '4px 0 0' }}>Here's what needs your attention today.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Sessions today', value: todayCI,       color: D.blue },
            { label: 'No-shows',       value: noShows,       color: noShows > 0 ? D.red : D.t3 },
            { label: 'Need attention', value: attentionCount, color: attentionCount > 0 ? D.amber : D.t3 },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px 16px', borderRadius: 10, background: D.card, border: `1px solid ${D.border}`, textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: D.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── 2. At-Risk Clients (with Retention Score) ────────────────────────────────
function AtRiskClients({ memberships, checkIns, now, openModal, setTab }) {
  const atRisk = useMemo(() => {
    return memberships.map(m => {
      const rs = calcRetentionScore(m.user_id, checkIns, now);
      if (rs.status === 'safe') return null;
      const reason = rs.daysAgo >= 999
        ? 'Has never visited — needs immediate outreach'
        : rs.daysAgo > 21
          ? `No visit in ${rs.daysAgo} days — high churn risk`
          : rs.daysAgo > 14
            ? `Inactive for ${rs.daysAgo} days — losing momentum`
            : 'Low visit frequency this month';
      return { ...m, rs, reason };
    }).filter(Boolean).sort((a, b) => a.rs.score - b.rs.score).slice(0, 6);
  }, [memberships, checkIns, now]);

  if (atRisk.length === 0) return (
    <Card style={{ padding: '16px 18px' }} accent={D.green}>
      <SectionHeader icon={CheckCircle} label="Retention" color={D.green} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: `${D.green}0a`, border: `1px solid ${D.green}20` }}>
        <CheckCircle style={{ width: 13, height: 13, color: D.green }} />
        <span style={{ fontSize: 12, color: D.green, fontWeight: 600 }}>All clients engaging well — great work!</span>
      </div>
    </Card>
  );

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.red}>
      <SectionHeader icon={AlertCircle} label="Retention Alerts" color={D.red} count={atRisk.length} action="View all" onAction={() => setTab('members')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {atRisk.map((m, i) => (
          <div key={m.user_id || i} style={{ padding: '11px 13px', borderRadius: 10, background: D.card, border: `1px solid ${m.rs.color}28`, borderLeft: `3px solid ${m.rs.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: D.t2 }}>
                {(m.user_name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: D.t1 }}>{m.user_name || 'Client'}</div>
                <div style={{ fontSize: 10, color: D.t3, marginTop: 1 }}>{m.reason}</div>
              </div>
              <RetentionBadge rs={m.rs} />
            </div>
            <QuickActions member={m} openModal={openModal} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 3. Today's Sessions ────────────────────────────────────────────────────────
function TodaySessions({ classes, checkIns, now, openModal }) {
  const [marked, setMarked] = useState({});

  const todaySessions = useMemo(() => classes.map(cls => {
    const attended = checkIns.filter(c => isToday(new Date(c.check_in_date))).length;
    const capacity = cls.max_capacity || 20;
    const booked   = cls.bookings?.length || attended;
    return { ...cls, attended, booked, capacity };
  }), [classes, checkIns]);

  if (todaySessions.length === 0) return (
    <Card style={{ padding: '16px 18px' }}>
      <SectionHeader icon={Calendar} label="Today's Sessions" color={D.blue} />
      <div style={{ padding: '16px', textAlign: 'center', color: D.t4 }}>
        <Calendar style={{ width: 22, height: 22, opacity: 0.3, margin: '0 auto 8px' }} />
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>No sessions scheduled today</p>
        <Btn label="Manage Classes" icon={Plus} color={D.blue} onClick={() => openModal('classes')} />
      </div>
    </Card>
  );

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.blue}>
      <SectionHeader icon={Calendar} label="Today's Sessions" color={D.blue} count={todaySessions.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {todaySessions.map((cls, i) => {
          const status    = marked[cls.id] || (cls.attended >= cls.booked ? 'confirmed' : 'pending');
          const fillPct   = Math.min(100, Math.round((cls.booked / cls.capacity) * 100));
          const statusClr = status === 'confirmed' ? D.green : status === 'no-show' ? D.red : D.amber;

          return (
            <div key={cls.id || i} style={{ padding: '12px 14px', borderRadius: 10, background: D.card, border: `1px solid ${D.border}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: D.t1, marginBottom: 2 }}>{cls.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {cls.schedule && <span style={{ fontSize: 10, color: D.t3 }}>🕐 {cls.schedule}</span>}
                    {cls.duration_minutes && <span style={{ fontSize: 10, color: D.t4 }}>{cls.duration_minutes}min</span>}
                    <span style={{ fontSize: 9, fontWeight: 700, color: statusClr, background: `${statusClr}12`, borderRadius: 4, padding: '1px 6px' }}>
                      {status === 'confirmed' ? '✓ Confirmed' : status === 'no-show' ? '✗ No-show' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: fillPct >= 80 ? D.green : D.t2 }}>{cls.booked}/{cls.capacity}</div>
                  <div style={{ fontSize: 9, color: D.t4 }}>booked</div>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct >= 80 ? D.green : D.blue, borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Btn label="Check-in" icon={QrCode}       color={D.green} onClick={() => openModal('qrScanner', cls)} />
                <Btn label="Message"  icon={MessageCircle} color={D.blue}  onClick={() => openModal('post')} />
                <Btn label="No-show"  icon={UserX}         color={D.red}   onClick={() => setMarked(p => ({ ...p, [cls.id]: 'no-show' }))} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── 4. Needs Attention (with retention scores) ────────────────────────────────
function NeedsAttention({ memberships, checkIns, now, openModal }) {
  const flagged = useMemo(() => {
    return memberships.map(m => {
      const thisWeek = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 7 * 86400000).length;
      const last30   = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 86400000).length;
      const last60   = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 60 * 86400000).length;

      let reason = null;
      let action = null;
      if (thisWeek === 0 && last30 >= 3)      { reason = "Hasn't booked this week despite being regular"; action = 'Book a session to keep their momentum going'; }
      else if (last30 < last60 / 3 && last60 > 3) { reason = 'Engagement dropped sharply compared to last month'; action = 'Send a check-in message or assign a new workout'; }

      if (!reason) return null;
      const rs = calcRetentionScore(m.user_id, checkIns, now);
      return { ...m, rs, reason, action };
    }).filter(Boolean).slice(0, 5);
  }, [memberships, checkIns, now]);

  if (flagged.length === 0) return null;

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.amber}>
      <SectionHeader icon={AlertTriangle} label="Needs Attention" color={D.amber} count={flagged.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {flagged.map((m, i) => (
          <div key={m.user_id || i} style={{ padding: '11px 13px', borderRadius: 9, background: D.card, border: `1px solid ${D.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: D.t2 }}>
                {(m.user_name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{m.user_name || 'Client'}</div>
                <div style={{ fontSize: 10, color: D.t3 }}>{m.reason}</div>
                <div style={{ fontSize: 10, color: D.amber, marginTop: 2 }}>→ {m.action}</div>
              </div>
              <RetentionBadge rs={m.rs} compact />
            </div>
            <QuickActions member={m} openModal={openModal} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 5. Broken Streaks ─────────────────────────────────────────────────────────
function BrokenStreaks({ memberships, checkIns, now, openModal }) {
  const broken = useMemo(() => {
    return memberships.map(m => {
      const recent7 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 7 * 86400000).length;
      const prev14  = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) >= 7 * 86400000 && (now - new Date(c.check_in_date)) < 21 * 86400000).length;
      if (recent7 === 0 && prev14 >= 3) {
        const rs = calcRetentionScore(m.user_id, checkIns, now);
        return { ...m, rs, prevStreak: prev14 };
      }
      return null;
    }).filter(Boolean).slice(0, 4);
  }, [memberships, checkIns, now]);

  if (broken.length === 0) return null;

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.amber}>
      <SectionHeader icon={Flame} label="Broken Streaks" color={D.amber} count={broken.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {broken.map((m, i) => (
          <div key={m.user_id || i} style={{ padding: '11px 13px', borderRadius: 9, background: D.card, border: `1px solid ${D.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Flame style={{ width: 16, height: 16, color: D.amber, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{m.user_name || 'Client'}</div>
                <div style={{ fontSize: 10, color: D.t3 }}>Was visiting {m.prevStreak}× last week — dropped off</div>
                <div style={{ fontSize: 10, color: D.amber, marginTop: 2 }}>→ Re-engage before they lose the habit</div>
              </div>
              <RetentionBadge rs={m.rs} compact />
            </div>
            <QuickActions member={m} openModal={openModal} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 6. Declining Engagement ───────────────────────────────────────────────────
function DecliningEngagement({ memberships, checkIns, now, openModal }) {
  const declining = useMemo(() => {
    return memberships.map(m => {
      const recent30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 86400000).length;
      const prev30   = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) >= 30 * 86400000 && (now - new Date(c.check_in_date)) < 60 * 86400000).length;
      if (prev30 < 4 || recent30 >= prev30 * 0.6) return null;
      const drop = Math.round(((prev30 - recent30) / prev30) * 100);
      const rs = calcRetentionScore(m.user_id, checkIns, now);
      return { ...m, rs, recent30, prev30, drop };
    }).filter(Boolean).sort((a, b) => b.drop - a.drop).slice(0, 4);
  }, [memberships, checkIns, now]);

  if (declining.length === 0) return null;

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.red}>
      <SectionHeader icon={TrendingDown} label="Declining Engagement" color={D.red} count={declining.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {declining.map((m, i) => (
          <div key={m.user_id || i} style={{ padding: '11px 13px', borderRadius: 9, background: D.card, border: `1px solid ${D.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <TrendingDown style={{ width: 14, height: 14, color: D.red, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{m.user_name || 'Client'}</div>
                <div style={{ fontSize: 10, color: D.t3 }}>↓{m.drop}% this month ({m.prev30}→{m.recent30} visits)</div>
                <div style={{ fontSize: 10, color: D.red, marginTop: 2 }}>→ Book a session or assign a fresh workout</div>
              </div>
              <RetentionBadge rs={m.rs} compact />
            </div>
            <QuickActions member={m} openModal={openModal} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 7. Open Slot Suggestions ─────────────────────────────────────────────────
function EmptySlots({ classes, memberships, checkIns, now, openModal }) {
  const openSlots = classes.filter(cls => (cls.bookings?.length || 0) < (cls.max_capacity || 20));

  const suggestions = useMemo(() => {
    if (classes.length === 0) return [];
    return memberships.map(m => {
      const sorted = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
      const daysAgo = sorted[0] ? Math.floor((now - new Date(sorted[0].check_in_date)) / 86400000) : 999;
      if (daysAgo < 5) return null;
      return { ...m, daysAgo };
    }).filter(Boolean).sort((a, b) => b.daysAgo - a.daysAgo).slice(0, 3);
  }, [classes, memberships, checkIns, now]);

  if (openSlots.length === 0 && suggestions.length === 0) return null;

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.green}>
      <SectionHeader icon={Plus} label="Open Slots — Fill Them" color={D.green} count={openSlots.length} />
      {openSlots.slice(0, 2).map((cls, i) => (
        <div key={i} style={{ padding: '9px 12px', borderRadius: 9, background: D.card, border: `1px solid ${D.border}`, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{cls.name}</span>
            {cls.schedule && <span style={{ fontSize: 10, color: D.t3, marginLeft: 8 }}>🕐 {cls.schedule}</span>}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: D.green }}>{(cls.max_capacity || 20) - (cls.bookings?.length || 0)} spots open</span>
        </div>
      ))}
      {suggestions.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: D.t4, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 6px' }}>Suggested clients to invite</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map((m, i) => (
              <div key={m.user_id || i} style={{ padding: '9px 12px', borderRadius: 9, background: `${D.green}07`, border: `1px solid ${D.green}18`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: D.green }}>{m.user_name}</span>
                  <span style={{ fontSize: 10, color: D.t3, marginLeft: 6 }}>({m.daysAgo === 999 ? 'never visited' : `${m.daysAgo}d since last visit`})</span>
                  <div style={{ fontSize: 10, color: D.t3, marginTop: 1 }}>→ Invite to fill the open slot</div>
                </div>
                <Btn label="Book" icon={Calendar} color={D.green} onClick={() => openModal('bookIntoClass', { memberId: m.user_id, memberName: m.user_name })} />
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function TabCoachToday({ allMemberships = [], checkIns = [], myClasses = [], currentUser, openModal, setTab, now }) {
  const safeNow = now instanceof Date ? now : new Date();

  const todayCI = checkIns.filter(c => isToday(new Date(c.check_in_date))).length;

  const noShows = useMemo(() => myClasses.reduce((count, cls) => {
    const booked   = cls.bookings?.filter(b => b.status === 'booked').length || 0;
    const attended = checkIns.filter(c => isToday(new Date(c.check_in_date))).length;
    return count + Math.max(0, booked - attended);
  }, 0), [myClasses, checkIns]);

  const attentionCount = useMemo(() => allMemberships.filter(m => {
    const thisWeek = checkIns.filter(c => c.user_id === m.user_id && (safeNow - new Date(c.check_in_date)) < 7 * 86400000).length;
    const last30   = checkIns.filter(c => c.user_id === m.user_id && (safeNow - new Date(c.check_in_date)) < 30 * 86400000).length;
    return thisWeek === 0 && last30 >= 2;
  }).length, [allMemberships, checkIns, safeNow]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TodayHeader currentUser={currentUser} todayCI={todayCI} noShows={noShows} attentionCount={attentionCount} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AtRiskClients memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} setTab={setTab} />
          <NeedsAttention memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} />
          <EmptySlots classes={myClasses} memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TodaySessions classes={myClasses} checkIns={checkIns} now={safeNow} openModal={openModal} />
          <BrokenStreaks memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} />
          <DecliningEngagement memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} />
        </div>
      </div>
    </div>
  );
}