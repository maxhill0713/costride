import React, { useMemo, useState, useEffect } from 'react';
import { format, subDays, startOfDay, isWithinInterval, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  Activity, AlertTriangle, QrCode, Dumbbell,
  Calendar, CheckCircle, Flame, Clock,
  Trophy, Bell, UserPlus, TrendingUp, TrendingDown,
  BarChart2, ChevronRight, Minus, ArrowUpRight,
  Zap, MessageSquarePlus, Target, Award, X,
} from 'lucide-react';
import { RingChart, Avatar } from './DashboardPrimitives';
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

const tickStyle = { fill: T.text3, fontSize: 11, fontFamily: 'DM Sans, system-ui' };

// ── Shared primitives — match TabOverview exactly ─────────────────────────────
function Shimmer({ color = T.blue }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
      background: `linear-gradient(90deg,transparent,${color}28,transparent)`, pointerEvents: 'none' }} />
  );
}

function SCard({ children, style = {}, accent }) {
  const c = accent || T.blue;
  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.border}`,
      position: 'relative', overflow: 'hidden', ...style }}>
      <Shimmer color={c} />
      {children}
    </div>
  );
}

// ── Sparkline — identical to TabOverview MiniSpark ────────────────────────────
function MiniSpark({ data = [], color = T.blue, width = 72, height = 28 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = pts.split(' ')[0], last = pts.split(' ').slice(-1)[0];
  const area = `${first.split(',')[0]},${height} ${pts} ${last.split(',')[0]},${height}`;
  const uid = color.replace('#', '');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${uid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── KPI Card — matches TabOverview KpiCard exactly ────────────────────────────
function KpiCard({ label, value, valueSuffix, sub, subTrend, subContext, sparkData,
                   ring, ringColor, footerBar, icon: Icon, color, cta, onCta }) {
  const c = color || T.blue;
  const trendColor = subTrend === 'up' ? T.green : subTrend === 'down' ? T.red : T.text3;
  const TrendIcon  = subTrend === 'up' ? ArrowUpRight : subTrend === 'down' ? TrendingDown : Minus;
  const showRing   = ring != null && ring > 5 && ring < 98;
  return (
    <div style={{ borderRadius: 12, padding: '16px 18px 14px', background: T.card,
      border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden' }}>
      <Shimmer color={c} />
      <div style={{ position: 'absolute', bottom: -16, right: -16, width: 60, height: 60,
        borderRadius: '50%', background: c, opacity: 0.06, filter: 'blur(20px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{label}</span>
        {Icon && (
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `${c}14`,
            border: `1px solid ${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 12, height: 12, color: c }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: T.text1, lineHeight: 1, letterSpacing: '-0.05em' }}>{value}</span>
            {valueSuffix && <span style={{ fontSize: 14, fontWeight: 500, color: T.text3 }}>{valueSuffix}</span>}
          </div>
          {sub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <TrendIcon style={{ width: 11, height: 11, color: trendColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: trendColor, lineHeight: 1.3 }}>{sub}</span>
            </div>
          )}
          {subContext && (
            <div style={{ fontSize: 10, color: T.text3, marginTop: 3, lineHeight: 1.4 }}>{subContext}</div>
          )}
        </div>
        {showRing
          ? <RingChart pct={ring} size={46} stroke={4} color={ringColor || c} />
          : sparkData && sparkData.some(v => v > 0)
            ? <MiniSpark data={sparkData} color={c} />
            : null
        }
      </div>

      {footerBar != null && (
        <div style={{ height: 2, borderRadius: 99, background: T.divider, overflow: 'hidden', marginBottom: cta ? 10 : 0 }}>
          <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, footerBar))}%`,
            background: c, borderRadius: 99, transition: 'width 0.7s ease' }} />
        </div>
      )}

      {cta && onCta && (
        <button onClick={onCta}
          style={{ marginTop: footerBar == null ? 10 : 0, width: '100%', padding: '6px 10px',
            borderRadius: 7, background: `${c}10`, border: `1px solid ${c}28`, color: c,
            fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 5, fontFamily: 'inherit', transition: 'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = `${c}1e`}
          onMouseLeave={e => e.currentTarget.style.background = `${c}10`}>
          {cta} <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      )}
    </div>
  );
}

// ── Stat row ───────────────────────────────────────────────────────────────────
function StatRow({ label, value, valueColor, last, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}` }}>
      <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {badge && (
          <span style={{ fontSize: 9, fontWeight: 700, color: badge.color, background: `${badge.color}14`,
            border: `1px solid ${badge.color}22`, borderRadius: 5, padding: '1px 6px' }}>{badge.label}</span>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || T.text1 }}>{value}</span>
      </div>
    </div>
  );
}

// ── Signal row — matches TabOverview Signal ───────────────────────────────────
function Signal({ color, icon: Icon, title, detail, action, onAction, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ padding: '10px 12px', borderRadius: 9, background: `${color}07`,
      border: `1px solid ${color}20`, marginBottom: last ? 0 : 7, cursor: onAction ? 'pointer' : 'default' }}
      onClick={onAction}
      onMouseEnter={() => onAction && setHov(true)}
      onMouseLeave={() => onAction && setHov(false)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <Icon style={{ width: 11, height: 11, color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, lineHeight: 1.3, marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.4 }}>{detail}</div>
        </div>
        {action && (
          <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`,
            border: `1px solid ${color}28`, borderRadius: 5, padding: '2px 7px',
            flexShrink: 0, opacity: hov ? 1 : 0.8, transition: 'opacity 0.12s', whiteSpace: 'nowrap' }}>
            {action}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Fill ring ─────────────────────────────────────────────────────────────────
function FillRing({ pct, color, size = 40 }) {
  const r = (size - 6) / 2, cx = size / 2, cf = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={cf} strokeDashoffset={cf * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

// ── Member popover ────────────────────────────────────────────────────────────
function MemberPopover({ member, checkInCount, lastSeen, streak, onClose, avatarSrc }) {
  const absenceDays = lastSeen ? Math.floor((Date.now() - new Date(lastSeen)) / 86400000) : null;
  return (
    <div style={{ position: 'absolute', top: 38, left: 0, zIndex: 999, width: 200,
      borderRadius: 12, background: '#0d1526', border: `1px solid ${T.borderM}`,
      boxShadow: '0 16px 48px rgba(0,0,0,0.6)', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <Avatar name={member.user_name} src={avatarSrc} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.user_name}</div>
          {member.membership_type && <div style={{ fontSize: 10, color: T.text3 }}>{member.membership_type}</div>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, padding: 0 }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>
      {[
        { label: 'Total visits',   value: checkInCount, color: T.blue },
        { label: 'Last seen',      value: absenceDays === 0 ? 'Today' : absenceDays === 1 ? 'Yesterday' : absenceDays != null ? `${absenceDays}d ago` : 'Never', color: absenceDays != null && absenceDays > 14 ? T.red : T.green },
        { label: 'Current streak', value: streak > 0 ? `🔥 ${streak} days` : '—', color: T.amber },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '5px 0', borderBottom: i < 2 ? `1px solid ${T.divider}` : 'none' }}>
          <span style={{ fontSize: 10, color: T.text3 }}>{s.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Today's Actions — mirrors TabOverview TodayActions ─────────────────────────
function CoachActions({ atRiskMembers, neverVisited, expiringMembers, classStats, activeChallenges, openModal }) {
  const signals = useMemo(() => {
    const items = [];

    if (atRiskMembers.length > 0)
      items.push({ priority: 1, color: T.red, icon: AlertTriangle, title: `${atRiskMembers.length} member${atRiskMembers.length > 1 ? 's' : ''} absent 14+ days`, detail: 'A personal follow-up now recovers ~40% of at-risk members.', action: 'Reach out', fn: () => openModal('post') });

    if (neverVisited.length > 0)
      items.push({ priority: 2, color: T.amber, icon: UserPlus, title: `${neverVisited.length} member${neverVisited.length > 1 ? 's' : ''} never visited`, detail: 'Enrolled but never checked in — first visit is the hardest.', action: 'Invite them', fn: () => openModal('post') });

    if (expiringMembers.length > 0)
      items.push({ priority: 3, color: T.amber, icon: Clock, title: `${expiringMembers.length} membership${expiringMembers.length > 1 ? 's' : ''} expiring within 14 days`, detail: 'Follow up to improve renewal rates before they lapse.', action: 'Follow up', fn: () => openModal('post') });

    const fullClasses = classStats.filter(c => c.fill >= 95);
    if (fullClasses.length > 0)
      items.push({ priority: 4, color: T.blue, icon: Dumbbell, title: `${fullClasses.length} class${fullClasses.length > 1 ? 'es' : ''} near capacity`, detail: `${fullClasses.map(c => c.name).join(', ')} — consider adding a waitlist.`, action: 'View classes', fn: () => openModal('classes') });

    if (activeChallenges.length === 0)
      items.push({ priority: 5, color: T.purple, icon: Trophy, title: 'No active challenge', detail: 'Challenges increase check-in frequency by 2× during their run.', action: 'Create one', fn: () => openModal('challenge') });

    return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [atRiskMembers, neverVisited, expiringMembers, classStats, activeChallenges]);

  const positives = useMemo(() => {
    const items = [];
    if (atRiskMembers.length === 0) items.push('All members active');
    if (classStats.some(c => c.fill >= 80)) items.push('Strong class attendance today');
    if (activeChallenges.length > 0) items.push(`${activeChallenges.length} active challenge${activeChallenges.length > 1 ? 's' : ''} running`);
    return items.slice(0, 2);
  }, [atRiskMembers, classStats, activeChallenges]);

  return (
    <SCard style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Action Items</div>
        {signals.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: signals[0].color === T.red ? T.red : T.amber,
            background: `${signals[0].color === T.red ? T.red : T.amber}14`,
            border: `1px solid ${signals[0].color === T.red ? T.red : T.amber}22`,
            borderRadius: 99, padding: '2px 8px' }}>{signals.length} pending</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>Sorted by urgency</div>

      {signals.length === 0 ? (
        <div style={{ padding: '12px 14px', borderRadius: 9, background: `${T.green}0a`, border: `1px solid ${T.green}18` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle style={{ width: 13, height: 13, color: T.green, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text1 }}>All clear today</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>No immediate actions needed</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {signals.map((s, i) => (
            <Signal key={i} color={s.color} icon={s.icon} title={s.title}
              detail={s.detail} action={s.action} onAction={s.fn} last={i === signals.length - 1} />
          ))}
        </div>
      )}

      {positives.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.divider}` }}>
          {positives.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < positives.length - 1 ? 5 : 0 }}>
              <CheckCircle style={{ width: 11, height: 11, color: T.green, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </SCard>
  );
}

// ── Engagement Breakdown — mirrors TabOverview EngagementBreakdown ────────────
function EngagementBreakdown({ superActive, active, casual, inactive, totalM, openModal }) {
  const rows = [
    { label: 'Super active', sub: '12+ visits/mo', val: superActive, color: T.green  },
    { label: 'Active',       sub: '4–11 visits',   val: active,      color: T.blue   },
    { label: 'Occasional',   sub: '1–3 visits',    val: casual,      color: T.amber  },
    { label: 'Inactive',     sub: '0 visits',      val: inactive,    color: T.red    },
  ];
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Engagement Split</div>
        <button onClick={() => openModal('members')} style={{ fontSize: 11, fontWeight: 600, color: T.blue, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
          Members <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
      <div style={{ display: 'flex', height: 5, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 16 }}>
        {rows.filter(r => r.val > 0).length > 0
          ? rows.filter(r => r.val > 0).map((r, i, arr) => (
              <div key={i} style={{ flex: r.val, background: r.color, opacity: 0.85,
                borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length - 1 ? '0 99px 99px 0' : 0 }} />
            ))
          : <div style={{ flex: 1, background: T.divider, borderRadius: 99 }} />
        }
      </div>
      {rows.map((r, i) => {
        const pct = totalM > 0 ? Math.round((r.val / totalM) * 100) : 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderBottom: i < rows.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: r.color, flexShrink: 0, opacity: r.val > 0 ? 1 : 0.3 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: r.val > 0 ? T.text1 : T.text3, flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 11, color: T.text3, marginRight: 10 }}>{r.sub}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: r.val > 0 ? r.color : T.text3, minWidth: 22, textAlign: 'right' }}>{r.val}</span>
            <span style={{ fontSize: 11, color: T.text3, minWidth: 28, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Weekly check-in chart — mirrors TabOverview CheckInChart ──────────────────
function WeeklyChart({ weekSpark, now, totalM }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    day:   format(subDays(now, 6 - i), 'EEE'),
    value: weekSpark[i] || 0,
    isToday: startOfDay(subDays(now, 6 - i)).getTime() === startOfDay(now).getTime(),
  })), [weekSpark, now]);

  const todayLabel = format(now, 'EEE');
  const chartMax   = Math.max(...days.map(d => d.value), 1);
  const weeklyAvg  = (days.reduce((a, d) => a + d.value, 0) / 7).toFixed(1);
  const todayVal   = days.find(d => d.isToday)?.value ?? 0;

  return (
    <div style={{ padding: '20px 20px 16px', borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Check-in Activity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: T.text3 }}>Daily avg <span style={{ fontWeight: 700, color: T.text2 }}>{weeklyAvg}</span></div>
            {todayVal > 0 && (
              <>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: T.text3 }} />
                <div style={{ fontSize: 11, color: T.text3 }}>Today <span style={{ fontWeight: 700, color: T.blue }}>{todayVal}</span></div>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 7, background: `${T.purple}10`, border: `1px solid ${T.purple}22` }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.purple }}>7 days</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={days} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barSize={22}>
          <defs>
            <linearGradient id="coachBarToday" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.purple} stopOpacity={1} />
              <stop offset="100%" stopColor={T.purple} stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
          <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} allowDecimals={false} domain={[0, Math.max(chartMax + 1, 5)]} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const isToday = label === todayLabel;
              const val = payload[0].value;
              const avg = parseFloat(weeklyAvg);
              const vsAvg = avg > 0 ? Math.round(((val - avg) / avg) * 100) : 0;
              return (
                <div style={{ background: '#070e1c', border: `1px solid ${isToday ? T.purple + '50' : T.borderM}`,
                  borderRadius: 9, padding: '9px 13px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 130 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? T.purple : T.text3,
                    letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 5 }}>{isToday ? 'Today' : label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.text1, letterSpacing: '-0.03em', marginBottom: 4 }}>
                    {val} <span style={{ fontSize: 11, fontWeight: 500, color: T.text3 }}>check-ins</span>
                  </div>
                  {avg > 0 && val > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {vsAvg >= 0 ? <TrendingUp style={{ width: 10, height: 10, color: T.green }} /> : <TrendingDown style={{ width: 10, height: 10, color: T.red }} />}
                      <span style={{ fontSize: 10, fontWeight: 700, color: vsAvg >= 0 ? T.green : T.red }}>{vsAvg >= 0 ? '+' : ''}{vsAvg}% vs avg</span>
                    </div>
                  )}
                </div>
              );
            }}
            cursor={{ fill: `${T.purple}07` }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {days.map((entry, i) => (
              <Cell key={i} fill={entry.isToday ? 'url(#coachBarToday)' : `${T.purple}38`} />
            ))}
          </Bar>
          {parseFloat(weeklyAvg) > 0 && (
            <ReferenceLine y={parseFloat(weeklyAvg)} stroke={`${T.purple}40`} strokeDasharray="4 4"
              label={{ value: `avg ${weeklyAvg}`, position: 'insideTopRight', fill: T.text3, fontSize: 9 }} />
          )}
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: T.purple }} />
          <span style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>Today</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: `${T.purple}38` }} />
          <span style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>Past days</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 1, borderTop: `2px dashed ${T.purple}55` }} />
          <span style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>Daily avg</span>
        </div>
      </div>
    </div>
  );
}

// ── Recent activity feed — mirrors TabOverview ActivityFeed ───────────────────
function RecentActivity({ todayCI, now, avatarMap, allMemberships }) {
  const items = useMemo(() => todayCI
    .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))
    .slice(0, 6)
    .map(c => {
      const minsAgo = Math.floor((now - new Date(c.check_in_date)) / 60000);
      const timeStr = minsAgo < 1 ? 'just now' : minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`;
      return { ...c, timeStr };
    }), [todayCI, now]);

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 16 }}>Recent Activity</div>
      {items.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Activity style={{ width: 20, height: 20, color: T.text3, margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
          <p style={{ fontSize: 12, color: T.text3, margin: '0 0 4px', fontWeight: 600 }}>No activity yet today</p>
          <p style={{ fontSize: 11, color: T.text3, margin: 0, opacity: 0.7 }}>Typical peak is 5–7pm</p>
        </div>
      ) : items.map((a, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
          borderBottom: i < items.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
          <Avatar name={a.user_name || '?'} size={28} src={avatarMap?.[a.user_id] || null} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: T.text1, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 600 }}>{a.user_name || 'Member'}</span>
              <span style={{ color: T.text2 }}> checked in</span>
            </div>
          </div>
          <span style={{ fontSize: 11, color: T.text3, flexShrink: 0 }}>{a.timeStr}</span>
        </div>
      ))}
    </div>
  );
}

// ── My Classes card ────────────────────────────────────────────────────────────
function ClassesCard({ classStats, openModal }) {
  if (classStats.length === 0) {
    return (
      <SCard style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>My Classes Today</div>
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <Dumbbell style={{ width: 20, height: 20, color: T.text3, margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
          <p style={{ fontSize: 12, color: T.text3, margin: '0 0 12px', fontWeight: 600 }}>No classes assigned today</p>
          <button onClick={() => openModal('classes')}
            style={{ fontSize: 11, fontWeight: 700, color: T.blue, background: `${T.blue}10`,
              border: `1px solid ${T.blue}28`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Manage Classes
          </button>
        </div>
      </SCard>
    );
  }

  return (
    <SCard style={{ overflow: 'hidden' }} accent={T.purple}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>My Classes Today</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.purple, background: `${T.purple}12`, border: `1px solid ${T.purple}25`, borderRadius: 6, padding: '2px 8px' }}>
          {classStats.length} class{classStats.length !== 1 ? 'es' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {classStats.map((cls, i) => {
          const c         = classColor(cls);
          const fillColor = cls.fill >= 80 ? T.green : cls.fill >= 50 ? T.amber : T.blue;
          const spotsLeft = cls.capacity - (cls.booked || cls.attended);
          return (
            <div key={cls.id || i} style={{ padding: '14px 20px', borderBottom: i < classStats.length - 1 ? `1px solid ${T.divider}` : 'none',
              display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
              {/* Coloured left bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c }} />
              <FillRing pct={cls.fill} color={fillColor} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                  {cls.schedule && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.purple, background: `${T.purple}10`,
                      border: `1px solid ${T.purple}20`, borderRadius: 5, padding: '1px 7px' }}>
                      {cls.schedule}
                    </span>
                  )}
                  {cls.duration_minutes && <span style={{ fontSize: 10, color: T.text3 }}>{cls.duration_minutes}min</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{cls.name}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: T.text3 }}>
                    <span style={{ color: fillColor, fontWeight: 700 }}>{cls.booked || cls.attended}</span>
                    <span>/{cls.capacity}</span>
                  </span>
                  <span style={{ fontSize: 11, color: spotsLeft <= 3 ? T.red : T.text3, fontWeight: spotsLeft <= 3 ? 700 : 400 }}>
                    {spotsLeft <= 0 ? '🔴 Full' : `${spotsLeft} spots left`}
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fillColor},${fillColor}99)`,
                    borderRadius: 99, transition: 'width 0.8s ease' }} />
                </div>
              </div>
              <button onClick={() => openModal('qrScanner', cls)}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                  borderRadius: 9, background: `${T.green}12`, border: `1px solid ${T.green}30`,
                  color: T.green, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                  transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${T.green}22`}
                onMouseLeave={e => e.currentTarget.style.background = `${T.green}12`}>
                <QrCode style={{ width: 12, height: 12 }} /> Start
              </button>
            </div>
          );
        })}
      </div>
    </SCard>
  );
}

// ── Member attention card — mirrors RetentionBreakdown ────────────────────────
function AttentionCard({ atRiskMembers, neverVisited, expiringMembers, avatarMap, openModal, now, memberLastCI }) {
  const [tab, setTab] = useState('absent');
  const tabs = [
    { id: 'absent',   label: 'Absent 14d+',  count: atRiskMembers.length,   color: T.red,   items: atRiskMembers   },
    { id: 'expiring', label: 'Expiring',      count: expiringMembers.length, color: T.amber, items: expiringMembers },
    { id: 'never',    label: 'Never visited', count: neverVisited.length,    color: T.text3, items: neverVisited    },
  ];
  const active = tabs.find(t => t.id === tab);

  return (
    <div style={{ borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>Member Attention</div>
        <div style={{ fontSize: 11, color: T.text3 }}>Members that may need a follow-up</div>
      </div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '10px 8px', background: 'none', border: 'none',
              borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
              color: tab === t.id ? t.color : T.text3, fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 5, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            {t.label}
            <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 99,
              background: tab === t.id ? `${t.color}14` : T.divider, color: tab === t.id ? t.color : T.text3,
              border: `1px solid ${tab === t.id ? t.color + '25' : T.border}` }}>{t.count}</span>
          </button>
        ))}
      </div>
      {/* Rows */}
      <div style={{ padding: '8px 16px' }}>
        {active.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '18px 0' }}>
            <CheckCircle style={{ width: 18, height: 18, color: T.green, margin: '0 auto 7px', display: 'block' }} />
            <p style={{ fontSize: 12, color: T.green, fontWeight: 700, margin: 0 }}>
              {tab === 'absent' ? 'All members active' : tab === 'expiring' ? 'No memberships expiring soon' : 'Everyone has visited'}
            </p>
          </div>
        ) : active.items.slice(0, 6).map((m, i, arr) => {
          const last  = memberLastCI[m.user_id];
          const days  = last ? Math.floor((now - new Date(last)) / 86400000) : null;
          const expD  = m.end_date ? Math.floor((new Date(m.end_date) - now) / 86400000) : null;
          const urgency = tab === 'expiring'
            ? (expD <= 3 ? T.red : expD <= 7 ? T.amber : T.amber)
            : (days === null || days > 30 ? T.red : days > 21 ? T.amber : T.amber);
          return (
            <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
              borderBottom: i < arr.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
              <Avatar name={m.user_name} src={avatarMap[m.user_id]} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                <div style={{ fontSize: 10, color: urgency, fontWeight: 600 }}>
                  {tab === 'expiring'
                    ? (expD === 0 ? 'Expires today' : expD === 1 ? 'Expires tomorrow' : `${expD}d until expiry`)
                    : tab === 'never' ? 'Never visited'
                    : `${days}d absent`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <button onClick={() => openModal('post')}
                  style={{ fontSize: 9, fontWeight: 700, color: T.blue, background: `${T.blue}0a`,
                    border: `1px solid ${T.blue}20`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Reach out
                </button>
              </div>
            </div>
          );
        })}
        {active.items.length > 6 && (
          <div style={{ fontSize: 11, color: T.text3, textAlign: 'center', padding: '8px 0' }}>
            +{active.items.length - 6} more
          </div>
        )}
      </div>
    </div>
  );
}

// ── Members in today ─────────────────────────────────────────────────────────
function MembersInToday({ todayMemberIds, todayCI, allMemberships, avatarMap, memberLastCI, memberStreak, allVisits, openModal, now }) {
  const [hoverMember, setHoverMember] = useState(null);

  if (todayMemberIds.length === 0) {
    return (
      <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Members In Today</div>
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Clock style={{ width: 18, height: 18, color: T.text3, margin: '0 auto 7px', display: 'block', opacity: 0.5 }} />
          <p style={{ fontSize: 12, color: T.text3, fontWeight: 600, margin: '0 0 12px' }}>No check-ins yet today</p>
          <button onClick={() => openModal('qrScanner')}
            style={{ fontSize: 11, fontWeight: 700, color: T.green, background: `${T.green}10`,
              border: `1px solid ${T.green}28`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Scan First Check-in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Members In Today</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: `${T.green}10`,
          border: `1px solid ${T.green}22`, borderRadius: 99, padding: '2px 9px' }}>
          {todayMemberIds.length} checked in
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {todayMemberIds.map(uid => {
          const ci     = todayCI.find(c => c.user_id === uid);
          const mins   = ci ? Math.floor((now - new Date(ci.check_in_date)) / 60000) : 0;
          const t      = mins < 1 ? 'just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;
          const member = allMemberships.find(m => m.user_id === uid);
          return (
            <div key={uid} style={{ position: 'relative' }}
              onMouseEnter={() => setHoverMember(uid)}
              onMouseLeave={() => setHoverMember(null)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 9,
                background: `${T.green}06`, border: `1px solid ${T.green}15`, cursor: 'default' }}>
                <Avatar name={ci?.user_name || '?'} src={avatarMap[uid]} size={24} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text1, whiteSpace: 'nowrap' }}>{ci?.user_name || 'Member'}</div>
                  <div style={{ fontSize: 9, color: T.green }}>{t}</div>
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
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabCoachOverview({
  myClasses, checkIns, allMemberships, avatarMap, openModal, now, selectedGym, posts, events, challenges = [],
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // ── Date buckets ──────────────────────────────────────────────────────────
  const ci7  = useMemo(() => checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 7),  end: now })), [checkIns, now]);
  const ci7p = useMemo(() => checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 14), end: subDays(now, 7) })), [checkIns, now]);
  const ci30 = useMemo(() => checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: subDays(now, 30), end: now })), [checkIns, now]);
  const todayCI        = useMemo(() => checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(now).getTime()), [checkIns, now]);
  const todayMemberIds = useMemo(() => [...new Set(todayCI.map(c => c.user_id))], [todayCI]);

  // ── Per-member aggregates ─────────────────────────────────────────────────
  const memberLastCI = useMemo(() => {
    const m = {};
    checkIns.forEach(c => { if (!m[c.user_id] || new Date(c.check_in_date) > new Date(m[c.user_id])) m[c.user_id] = c.check_in_date; });
    return m;
  }, [checkIns]);

  const allVisits = useMemo(() => {
    const m = {};
    checkIns.forEach(c => { m[c.user_id] = (m[c.user_id] || 0) + 1; });
    return m;
  }, [checkIns]);

  const memberStreak = useMemo(() => {
    const acc = {};
    allMemberships.forEach(m => {
      let streak = 0;
      const days = new Set(checkIns.filter(c => c.user_id === m.user_id).map(c => startOfDay(new Date(c.check_in_date)).getTime()));
      for (let i = 0; i <= 60; i++) { if (days.has(startOfDay(subDays(now, i)).getTime())) streak++; else break; }
      acc[m.user_id] = streak;
    });
    return acc;
  }, [allMemberships, checkIns, now]);

  // ── Trends ────────────────────────────────────────────────────────────────
  const activeW   = useMemo(() => new Set(ci7.map(c => c.user_id)).size,  [ci7]);
  const activePW  = useMemo(() => new Set(ci7p.map(c => c.user_id)).size, [ci7p]);
  const weekTrend = activePW > 0 ? Math.round(((activeW - activePW) / activePW) * 100) : 0;
  const weekSpark = useMemo(() => Array.from({ length: 7 }, (_, i) =>
    checkIns.filter(c => startOfDay(new Date(c.check_in_date)).getTime() === startOfDay(subDays(now, 6 - i)).getTime()).length
  ), [checkIns, now]);

  // ── 30-day tiers ──────────────────────────────────────────────────────────
  const memberVisits30 = useMemo(() => { const m = {}; ci30.forEach(c => { m[c.user_id] = (m[c.user_id] || 0) + 1; }); return m; }, [ci30]);
  const totalM      = allMemberships.length;
  const superActive = allMemberships.filter(m => (memberVisits30[m.user_id] || 0) >= 12).length;
  const active      = allMemberships.filter(m => { const v = memberVisits30[m.user_id] || 0; return v >= 4 && v < 12; }).length;
  const casual      = allMemberships.filter(m => { const v = memberVisits30[m.user_id] || 0; return v >= 1 && v < 4; }).length;
  const inactive    = Math.max(0, totalM - superActive - active - casual);
  const engRate     = totalM > 0 ? Math.round(((superActive + active) / totalM) * 100) : 0;

  // ── Attention segments ────────────────────────────────────────────────────
  const atRiskMembers   = useMemo(() => allMemberships.filter(m => { const l = memberLastCI[m.user_id]; return l && Math.floor((now - new Date(l)) / 86400000) >= 14; }), [allMemberships, memberLastCI, now]);
  const neverVisited    = useMemo(() => allMemberships.filter(m => !memberLastCI[m.user_id]), [allMemberships, memberLastCI]);
  const expiringMembers = useMemo(() => allMemberships.filter(m => { if (!m.end_date) return false; const d = Math.floor((new Date(m.end_date) - now) / 86400000); return d >= 0 && d <= 14; }), [allMemberships, now]);
  const attentionCount  = atRiskMembers.length + neverVisited.length + expiringMembers.length;

  // ── Challenges ────────────────────────────────────────────────────────────
  const activeChallenges = useMemo(() => challenges.filter(c => c.status === 'active'), [challenges]);

  // ── Milestones ────────────────────────────────────────────────────────────
  const allMilestones = useMemo(() => allMemberships.map(m => {
    const total = allVisits[m.user_id] || 0;
    const next  = [10, 25, 50, 100, 200, 500].find(n => n > total);
    return { ...m, total, next, toNext: next ? next - total : 0 };
  }).filter(m => m.next && m.toNext <= 3).sort((a, b) => a.toNext - b.toNext).slice(0, 5), [allMemberships, allVisits]);

  // ── Top streaks ───────────────────────────────────────────────────────────
  const topStreaks = useMemo(() => Object.entries(memberStreak)
    .filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([uid, streak]) => { const m = allMemberships.find(m => m.user_id === uid); return { user_id: uid, name: m?.user_name || 'Member', streak }; }),
    [memberStreak, allMemberships]);

  // ── Classes ───────────────────────────────────────────────────────────────
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

  // ── Support data ──────────────────────────────────────────────────────────
  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.event_date) >= now).slice(0, 3), [events, now]);
  const newMembers     = useMemo(() => allMemberships.filter(m => m.start_date && Math.floor((now - new Date(m.start_date)) / 86400000) <= 14).sort((a, b) => new Date(b.start_date) - new Date(a.start_date)).slice(0, 4), [allMemberships, now]);

  const weekStars = useMemo(() => {
    const acc = {};
    ci7.forEach(c => { acc[c.user_id] = { name: c.user_name || 'Member', count: (acc[c.user_id]?.count || 0) + 1 }; });
    return Object.entries(acc).sort((a, b) => b[1].count - a[1].count).slice(0, 5).map(([uid, d]) => ({ user_id: uid, ...d }));
  }, [ci7]);

  const hour = now.getHours();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, alignItems: 'start' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard
            label="Checked In Today"
            value={todayMemberIds.length}
            valueSuffix={`/ ${totalM}`}
            sub={todayMemberIds.length > 0 ? `${todayMemberIds.length} member${todayMemberIds.length > 1 ? 's' : ''} here` : hour < 10 ? 'Early — peak at 5–7pm' : 'No check-ins yet'}
            subTrend={todayMemberIds.length > 0 ? 'up' : null}
            sparkData={weekSpark}
            icon={Activity}
            color={T.green}
            footerBar={totalM > 0 ? (todayMemberIds.length / totalM) * 100 : 0}
          />
          <KpiCard
            label="Active This Week"
            value={activeW}
            valueSuffix={`/ ${totalM}`}
            sub={weekTrend !== 0 ? `${weekTrend > 0 ? '↑' : '↓'} ${Math.abs(weekTrend)}% vs last week` : 'Same as last week'}
            subTrend={weekTrend > 0 ? 'up' : weekTrend < 0 ? 'down' : null}
            subContext={`${engRate}% engagement rate`}
            sparkData={weekSpark}
            icon={TrendingUp}
            color={T.blue}
            footerBar={totalM > 0 ? (activeW / totalM) * 100 : 0}
          />
          <KpiCard
            label="Needs Attention"
            value={attentionCount}
            sub={atRiskMembers.length > 0
              ? `${atRiskMembers.length} absent 14+ days`
              : expiringMembers.length > 0 ? `${expiringMembers.length} expiring soon`
              : 'All members active'}
            subTrend={attentionCount > 0 ? 'down' : 'up'}
            subContext={attentionCount > 0 ? 'Tap to view details below' : undefined}
            icon={AlertTriangle}
            color={attentionCount > 0 ? T.red : T.green}
            cta={attentionCount > 0 ? 'View members' : undefined}
          />
          <KpiCard
            label="Classes Today"
            value={classStats.length}
            sub={classStats.length > 0 ? `Avg fill: ${avgFill}%` : 'No classes scheduled'}
            subTrend={avgFill >= 70 ? 'up' : null}
            ring={avgFill > 5 && avgFill < 98 ? avgFill : null}
            ringColor={avgFill >= 70 ? T.green : avgFill >= 40 ? T.amber : T.red}
            icon={Dumbbell}
            color={T.purple}
          />
        </div>

        {/* Classes */}
        <ClassesCard classStats={classStats} openModal={openModal} />

        {/* Members in today */}
        <MembersInToday
          todayMemberIds={todayMemberIds} todayCI={todayCI} allMemberships={allMemberships}
          avatarMap={avatarMap} memberLastCI={memberLastCI} memberStreak={memberStreak}
          allVisits={allVisits} openModal={openModal} now={now}
        />

        {/* Check-in chart */}
        <WeeklyChart weekSpark={weekSpark} now={now} totalM={totalM} />

        {/* Member attention */}
        <AttentionCard
          atRiskMembers={atRiskMembers} neverVisited={neverVisited} expiringMembers={expiringMembers}
          avatarMap={avatarMap} openModal={openModal} now={now} memberLastCI={memberLastCI}
        />

        {/* Engagement + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <EngagementBreakdown
            superActive={superActive} active={active} casual={casual} inactive={inactive}
            totalM={totalM} openModal={openModal}
          />
          <RecentActivity todayCI={todayCI} now={now} avatarMap={avatarMap} allMemberships={allMemberships} />
        </div>

        {/* Milestones + Streaks */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          {/* Milestones */}
          {allMilestones.length > 0 && (
            <SCard accent={T.amber} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Award style={{ width: 13, height: 13, color: T.amber }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Upcoming Milestones</span>
              </div>
              {allMilestones.map((m, i) => (
                <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                  borderBottom: i < allMilestones.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                  <Avatar name={m.user_name} src={avatarMap[m.user_id]} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Member'}</div>
                    <div style={{ fontSize: 10, color: m.toNext === 1 ? T.green : T.text3, marginTop: 1 }}>
                      {m.toNext === 1 ? '🎉 1 visit to milestone!' : `${m.toNext} visits to ${m.next}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.amber }}>{m.total}</div>
                    <div style={{ fontSize: 9, color: T.text3 }}>→{m.next}</div>
                  </div>
                </div>
              ))}
            </SCard>
          )}

          {/* Streaks */}
          {topStreaks.length > 0 && (
            <SCard accent={T.amber} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Flame style={{ width: 13, height: 13, color: T.amber }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Active Streaks</span>
              </div>
              {topStreaks.map((m, i) => (
                <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                  borderBottom: i < topStreaks.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                  <Avatar name={m.name} src={avatarMap[m.user_id]} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden', marginTop: 5 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (m.streak / 30) * 100)}%`,
                        background: `linear-gradient(90deg,${T.amber},${T.red})`, borderRadius: 99 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.amber, letterSpacing: '-0.02em' }}>{m.streak}</div>
                    <div style={{ fontSize: 9, color: T.text3 }}>days</div>
                  </div>
                </div>
              ))}
            </SCard>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Action Items */}
        <CoachActions
          atRiskMembers={atRiskMembers} neverVisited={neverVisited} expiringMembers={expiringMembers}
          classStats={classStats} activeChallenges={activeChallenges} openModal={openModal}
        />

        {/* Quick Actions */}
        <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
          <Shimmer />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {[
              { icon: QrCode,          label: 'Scan Check-in', color: T.green,  fn: () => openModal('qrScanner') },
              { icon: MessageSquarePlus, label: 'Post Update', color: T.blue,   fn: () => openModal('post')      },
              { icon: Trophy,          label: 'New Challenge', color: T.amber,  fn: () => openModal('challenge') },
              { icon: Calendar,        label: 'New Event',     color: T.green,  fn: () => openModal('event')     },
              { icon: Dumbbell,        label: 'My Classes',    color: T.purple, fn: () => openModal('classes')   },
              { icon: Bell,            label: 'Send Message',  color: T.purple, fn: () => openModal('post')      },
            ].map(({ icon: Icon, label, color, fn }, i) => {
              const [hov, setHov] = useState(false);
              return (
                <button key={i} onClick={fn} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 9,
                    background: hov ? `${color}10` : T.divider, border: `1px solid ${hov ? color + '30' : T.border}`,
                    cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}14`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 12, height: 12, color }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: hov ? T.text1 : T.text2, transition: 'color 0.12s' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Monthly Snapshot */}
        <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
          <Shimmer />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>30-Day Snapshot</div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>{format(now, 'MMMM yyyy')}</div>
          <StatRow label="Total check-ins"    value={ci30.length}   valueColor={T.blue} />
          <StatRow label="Active this week"   value={activeW}       valueColor={T.blue} />
          <StatRow label="Engagement rate"    value={`${engRate}%`} valueColor={engRate >= 60 ? T.green : T.amber}
            badge={engRate >= 70 ? { label: '✓ Strong', color: T.green } : undefined} />
          <StatRow label="At-risk members"    value={atRiskMembers.length} valueColor={atRiskMembers.length > 0 ? T.red : T.green} />
          <StatRow label="Avg visits/member"  value={totalM > 0 ? (ci30.length / totalM).toFixed(1) : '—'} valueColor={T.purple} />
          <StatRow label="My classes today"   value={classStats.length}    valueColor={T.purple}
            badge={avgFill >= 70 ? { label: `${avgFill}% full`, color: T.green } : avgFill > 0 ? { label: `${avgFill}% full`, color: T.amber } : undefined} last />
        </div>

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
            <Shimmer color={T.green} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Upcoming Events</div>
              <button onClick={() => openModal('event')}
                style={{ fontSize: 11, fontWeight: 700, color: T.green, background: `${T.green}10`,
                  border: `1px solid ${T.green}28`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                + New
              </button>
            </div>
            {upcomingEvents.map((ev, i) => {
              const d    = new Date(ev.event_date);
              const diff = Math.floor((d - now) / 86400000);
              return (
                <div key={ev.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0',
                  borderBottom: i < upcomingEvents.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                  <div style={{ flexShrink: 0, background: `${T.green}0a`, border: `1px solid ${T.green}18`,
                    borderRadius: 8, padding: '4px 8px', textAlign: 'center', minWidth: 34 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.green, lineHeight: 1 }}>{format(d, 'd')}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: T.text3, textTransform: 'uppercase' }}>{format(d, 'MMM')}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: diff <= 2 ? T.red : T.text3 }}>
                      {diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `${diff}d away`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Members */}
        {newMembers.length > 0 && (
          <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
            <Shimmer color={T.blue} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <UserPlus style={{ width: 13, height: 13, color: T.blue }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>New Members</div>
              <span style={{ fontSize: 10, fontWeight: 700, color: T.blue, marginLeft: 'auto',
                background: `${T.blue}10`, border: `1px solid ${T.blue}22`, borderRadius: 6, padding: '1px 7px' }}>
                {newMembers.length}
              </span>
            </div>
            {newMembers.map((m, i) => {
              const daysAgo    = Math.floor((now - new Date(m.start_date)) / 86400000);
              const hasVisited = !!memberLastCI[m.user_id];
              return (
                <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0',
                  borderBottom: i < newMembers.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                  <Avatar name={m.user_name} src={avatarMap[m.user_id]} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name}</div>
                    <div style={{ fontSize: 10, color: T.text3 }}>
                      {daysAgo === 0 ? 'Joined today' : `${daysAgo}d ago`} ·{' '}
                      <span style={{ color: hasVisited ? T.green : T.red, fontWeight: 600 }}>{hasVisited ? 'visited ✓' : 'not in yet'}</span>
                    </div>
                  </div>
                  <button onClick={() => openModal('post')}
                    style={{ fontSize: 9, fontWeight: 700, color: T.blue, background: `${T.blue}0a`,
                      border: `1px solid ${T.blue}20`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                    Intro
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Top members this week */}
        {weekStars.length > 0 && (
          <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
            <Shimmer color={T.amber} />
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Top Members This Week</div>
            {weekStars.map((m, i) => {
              const medals   = ['🥇', '🥈', '🥉'];
              const maxCount = weekStars[0]?.count || 1;
              return (
                <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0',
                  borderBottom: i < weekStars.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
                  <span style={{ fontSize: i < 3 ? 14 : 10, width: 18, textAlign: 'center', flexShrink: 0 }}>{medals[i] || `${i + 1}`}</span>
                  <Avatar name={m.name} src={avatarMap[m.user_id]} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                    <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ height: '100%', width: `${(m.count / maxCount) * 100}%`,
                        background: `linear-gradient(90deg,${T.amber},${T.amber}80)`, borderRadius: 99 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: T.amber, flexShrink: 0 }}>{m.count}x</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
