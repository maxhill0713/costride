import React, { useMemo, useState } from 'react';
import { format, subDays, startOfDay, differenceInDays, isToday } from 'date-fns';
import {
  AlertCircle, MessageCircle, Calendar, Zap, Flame,
  TrendingDown, Clock, CheckCircle, X, PhoneCall,
  ChevronRight, UserX, BarChart2, Plus, QrCode,
  AlertTriangle, Activity, Sun, Sunset,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:      '#080e18',
  surface: '#0c1422',
  card:    '#0f1928',
  border:  'rgba(255,255,255,0.07)',
  b2:      'rgba(255,255,255,0.04)',
  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#2d3f55',
  red:    '#ef4444',
  amber:  '#f59e0b',
  green:  '#10b981',
  blue:   '#3b82f6',
  purple: '#a78bfa',
};

function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background: D.surface,
      border: `1px solid ${D.border}`,
      borderRadius: 14,
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
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

function ActionBtn({ label, icon: Icon, color = D.blue, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: `${color}10`, border: `1px solid ${color}25`, color, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
      {Icon && <Icon style={{ width: 10, height: 10 }} />}
      {label}
    </button>
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
          <h1 style={{ fontSize: 22, fontWeight: 900, color: D.t1, letterSpacing: '-0.03em', margin: 0 }}>
            {greeting}, {firstName}
          </h1>
          <p style={{ fontSize: 13, color: D.t3, marginTop: 4, margin: '4px 0 0' }}>Here's what needs your attention today.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Sessions today', value: todayCI, color: D.blue },
            { label: 'No-shows', value: noShows, color: noShows > 0 ? D.red : D.t3 },
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

// ─── 2. At-Risk Clients ────────────────────────────────────────────────────────
function AtRiskClients({ memberships, checkIns, now, openModal, setTab }) {
  const atRisk = useMemo(() => {
    return memberships.map(m => {
      const sorted = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
      const last = sorted[0];
      const daysAgo = last ? Math.floor((now - new Date(last.check_in_date)) / 86400000) : 999;
      const recent30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 86400000).length;
      let score = 0;
      if (daysAgo > 21) score += 40;
      else if (daysAgo > 14) score += 25;
      else if (daysAgo > 7) score += 10;
      if (recent30 < 2) score += 20;
      if (score < 20) return null;
      const risk = score >= 50 ? 'High' : 'Medium';
      const reason = daysAgo >= 999 ? 'Never visited' : daysAgo > 14 ? `No visit in ${daysAgo} days` : 'Low engagement this month';
      return { ...m, score, risk, reason, daysAgo, recent30 };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 5);
  }, [memberships, checkIns, now]);

  if (atRisk.length === 0) return (
    <Card style={{ padding: '16px 18px' }} accent={D.green}>
      <SectionHeader icon={CheckCircle} label="At-Risk Clients" color={D.green} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, background: `${D.green}0a`, border: `1px solid ${D.green}20` }}>
        <CheckCircle style={{ width: 13, height: 13, color: D.green }} />
        <span style={{ fontSize: 12, color: D.green, fontWeight: 600 }}>All clients engaging well — great work!</span>
      </div>
    </Card>
  );

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.red}>
      <SectionHeader icon={AlertCircle} label="At-Risk Clients" color={D.red} count={atRisk.length} action="View all" onAction={() => setTab('members')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {atRisk.map((m, i) => (
          <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: D.card, border: `1px solid ${m.risk === 'High' ? `${D.red}28` : `${D.amber}22`}`, borderLeft: `3px solid ${m.risk === 'High' ? D.red : D.amber}` }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: D.t2 }}>
              {(m.user_name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: D.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: m.risk === 'High' ? D.red : D.amber, background: m.risk === 'High' ? `${D.red}12` : `${D.amber}12`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{m.risk}</span>
              </div>
              <span style={{ fontSize: 11, color: D.t3 }}>{m.reason}</span>
            </div>
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              <ActionBtn label="Message" icon={MessageCircle} color={D.blue} onClick={() => openModal('post', { memberId: m.user_id })} />
              <ActionBtn label="Book" icon={Calendar} color={D.purple} onClick={() => openModal('bookIntoClass', { memberId: m.user_id, memberName: m.user_name })} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 3. Today's Sessions ────────────────────────────────────────────────────────
function TodaySessions({ classes, checkIns, now, openModal }) {
  const [marked, setMarked] = useState({});

  const todaySessions = useMemo(() => {
    return classes.map(cls => {
      const todayAttended = checkIns.filter(c => {
        const d = new Date(c.check_in_date);
        return isToday(d);
      });
      const capacity = cls.max_capacity || 20;
      const booked = cls.bookings?.length || todayAttended.length;
      return { ...cls, attended: todayAttended.length, booked, capacity };
    });
  }, [classes, checkIns]);

  if (todaySessions.length === 0) return (
    <Card style={{ padding: '16px 18px' }}>
      <SectionHeader icon={Calendar} label="Today's Sessions" color={D.blue} />
      <div style={{ padding: '16px', textAlign: 'center', color: D.t4 }}>
        <Calendar style={{ width: 22, height: 22, opacity: 0.3, margin: '0 auto 8px' }} />
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>No sessions scheduled today</p>
        <button onClick={() => openModal('classes')} style={{ fontSize: 11, fontWeight: 700, color: D.blue, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.20)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Manage Classes
        </button>
      </div>
    </Card>
  );

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.blue}>
      <SectionHeader icon={Calendar} label="Today's Sessions" color={D.blue} count={todaySessions.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {todaySessions.map((cls, i) => {
          const status = marked[cls.id] || (cls.attended >= cls.booked ? 'confirmed' : 'pending');
          const fillPct = Math.min(100, Math.round((cls.booked / cls.capacity) * 100));
          const statusColor = status === 'confirmed' ? D.green : status === 'no-show' ? D.red : D.amber;

          return (
            <div key={cls.id || i} style={{ padding: '12px 14px', borderRadius: 10, background: D.card, border: `1px solid ${D.border}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: D.t1, marginBottom: 2 }}>{cls.name}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {cls.schedule && <span style={{ fontSize: 10, color: D.t3 }}>🕐 {cls.schedule}</span>}
                    {cls.duration_minutes && <span style={{ fontSize: 10, color: D.t4 }}>{cls.duration_minutes}min</span>}
                    <span style={{ fontSize: 9, fontWeight: 700, color: statusColor, background: `${statusColor}12`, borderRadius: 4, padding: '1px 6px' }}>
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
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionBtn label="Check-in" icon={QrCode} color={D.green} onClick={() => openModal('qrScanner', cls)} />
                <ActionBtn label="Message" icon={MessageCircle} color={D.blue} onClick={() => openModal('post')} />
                <ActionBtn label="No-show" icon={UserX} color={D.red} onClick={() => setMarked(p => ({ ...p, [cls.id]: 'no-show' }))} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── 4. Needs Attention ────────────────────────────────────────────────────────
function NeedsAttention({ memberships, checkIns, now, openModal }) {
  const flagged = useMemo(() => {
    return memberships.map(m => {
      const thisWeek = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 7 * 86400000);
      const last30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 86400000).length;
      const last60 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 60 * 86400000).length;

      let reason = null;
      if (thisWeek.length === 0 && last30 >= 3) reason = "Hasn't booked this week";
      else if (last30 < last60 / 3 && last60 > 3) reason = 'Engagement declining sharply';

      if (!reason) return null;
      return { ...m, reason, last30 };
    }).filter(Boolean).slice(0, 5);
  }, [memberships, checkIns, now]);

  if (flagged.length === 0) return null;

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.amber}>
      <SectionHeader icon={AlertTriangle} label="Needs Attention" color={D.amber} count={flagged.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {flagged.map((m, i) => (
          <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: D.card, border: `1px solid ${D.border}` }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: D.t2 }}>
              {(m.user_name || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{m.user_name || 'Client'}</div>
              <div style={{ fontSize: 10, color: D.t3 }}>{m.reason}</div>
            </div>
            <ActionBtn label="Nudge" icon={Zap} color={D.amber} onClick={() => openModal('post', { memberId: m.user_id, nudge: true })} />
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
      const sorted = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
      if (sorted.length < 4) return null;

      let streak = 0;
      let prev = new Date(now);
      for (const ci of sorted) {
        const diff = Math.floor((prev - new Date(ci.check_in_date)) / 86400000);
        if (diff <= 2) { streak++; prev = new Date(ci.check_in_date); } else break;
      }

      // Was active 2+ weeks ago but not recently
      const recent7 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 7 * 86400000).length;
      const prev14 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) >= 7 * 86400000 && (now - new Date(c.check_in_date)) < 21 * 86400000).length;

      if (recent7 === 0 && prev14 >= 3) {
        return { ...m, prevStreak: prev14 };
      }
      return null;
    }).filter(Boolean).slice(0, 4);
  }, [memberships, checkIns, now]);

  if (broken.length === 0) return null;

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.amber}>
      <SectionHeader icon={Flame} label="Broken Streaks" color={D.amber} count={broken.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {broken.map((m, i) => (
          <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: D.card, border: `1px solid ${D.border}` }}>
            <Flame style={{ width: 16, height: 16, color: D.amber, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{m.user_name || 'Client'}</div>
              <div style={{ fontSize: 10, color: D.t3 }}>Was visiting {m.prevStreak}x last week — dropped off</div>
            </div>
            <ActionBtn label="Re-engage" icon={Zap} color={D.amber} onClick={() => openModal('post', { memberId: m.user_id, nudge: true })} />
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
      const prev30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) >= 30 * 86400000 && (now - new Date(c.check_in_date)) < 60 * 86400000).length;
      if (prev30 < 4 || recent30 >= prev30 * 0.6) return null;
      const drop = Math.round(((prev30 - recent30) / prev30) * 100);
      return { ...m, recent30, prev30, drop };
    }).filter(Boolean).sort((a, b) => b.drop - a.drop).slice(0, 4);
  }, [memberships, checkIns, now]);

  if (declining.length === 0) return null;

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.red}>
      <SectionHeader icon={TrendingDown} label="Declining Engagement" color={D.red} count={declining.length} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {declining.map((m, i) => (
          <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: D.card, border: `1px solid ${D.border}` }}>
            <TrendingDown style={{ width: 14, height: 14, color: D.red, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{m.user_name || 'Client'}</div>
              <div style={{ fontSize: 10, color: D.t3 }}>↓{m.drop}% this month vs last ({m.prev30}→{m.recent30} visits)</div>
            </div>
            <ActionBtn label="Message" icon={MessageCircle} color={D.blue} onClick={() => openModal('post', { memberId: m.user_id })} />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 7. Empty Slots / Opportunities ───────────────────────────────────────────
function EmptySlots({ classes, memberships, checkIns, now, openModal }) {
  const suggestions = useMemo(() => {
    const hasClassToday = classes.length > 0;
    if (!hasClassToday) return [];

    // Find members who haven't been in for 5+ days — suggest for open slots
    return memberships.map(m => {
      const sorted = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
      const last = sorted[0];
      const daysAgo = last ? Math.floor((now - new Date(last.check_in_date)) / 86400000) : 999;
      if (daysAgo < 5) return null;
      return { ...m, daysAgo };
    }).filter(Boolean).sort((a, b) => b.daysAgo - a.daysAgo).slice(0, 3);
  }, [classes, memberships, checkIns, now]);

  const openSlots = classes.filter(cls => {
    const cap = cls.max_capacity || 20;
    const booked = cls.bookings?.length || 0;
    return booked < cap;
  });

  if (openSlots.length === 0 && suggestions.length === 0) return null;

  return (
    <Card style={{ padding: '16px 18px' }} accent={D.green}>
      <SectionHeader icon={Plus} label="Open Slots — Fill Them" color={D.green} count={openSlots.length} />
      {openSlots.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {openSlots.slice(0, 2).map((cls, i) => (
            <div key={i} style={{ padding: '9px 12px', borderRadius: 9, background: D.card, border: `1px solid ${D.border}`, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{cls.name}</span>
                {cls.schedule && <span style={{ fontSize: 10, color: D.t3, marginLeft: 8 }}>🕐 {cls.schedule}</span>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: D.green }}>{(cls.max_capacity || 20) - (cls.bookings?.length || 0)} spots open</span>
            </div>
          ))}
        </div>
      )}
      {suggestions.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: D.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Suggested clients to invite</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map((m, i) => (
              <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, background: `${D.green}07`, border: `1px solid ${D.green}18` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>Suggest: </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: D.green }}>{m.user_name}</span>
                  <span style={{ fontSize: 10, color: D.t3, marginLeft: 6 }}>({m.daysAgo === 999 ? 'never visited' : `hasn't trained in ${m.daysAgo} days`})</span>
                </div>
                <ActionBtn label="Invite" icon={MessageCircle} color={D.green} onClick={() => openModal('post', { memberId: m.user_id })} />
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

  const noShows = useMemo(() => {
    // Approximate no-shows: classes today with low attendance vs capacity
    return myClasses.reduce((count, cls) => {
      const booked = cls.bookings?.filter(b => b.status === 'booked').length || 0;
      const attended = checkIns.filter(c => {
        const d = new Date(c.check_in_date);
        return isToday(d);
      }).length;
      return count + Math.max(0, booked - attended);
    }, 0);
  }, [myClasses, checkIns]);

  const attentionCount = useMemo(() => {
    return allMemberships.filter(m => {
      const thisWeek = checkIns.filter(c => c.user_id === m.user_id && (safeNow - new Date(c.check_in_date)) < 7 * 86400000).length;
      const last30 = checkIns.filter(c => c.user_id === m.user_id && (safeNow - new Date(c.check_in_date)) < 30 * 86400000).length;
      return thisWeek === 0 && last30 >= 2;
    }).length;
  }, [allMemberships, checkIns, safeNow]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TodayHeader
        currentUser={currentUser}
        todayCI={todayCI}
        noShows={noShows}
        attentionCount={attentionCount}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left column — urgent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AtRiskClients memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} setTab={setTab} />
          <NeedsAttention memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} />
          <EmptySlots classes={myClasses} memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} />
        </div>

        {/* Right column — today's ops */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TodaySessions classes={myClasses} checkIns={checkIns} now={safeNow} openModal={openModal} />
          <BrokenStreaks memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} />
          <DecliningEngagement memberships={allMemberships} checkIns={checkIns} now={safeNow} openModal={openModal} />
        </div>
      </div>
    </div>
  );
}