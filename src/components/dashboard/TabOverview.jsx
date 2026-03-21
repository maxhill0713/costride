import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, subDays, startOfDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  TrendingDown, ArrowUpRight, Zap,
  CheckCircle, Trophy, UserPlus, QrCode, MessageSquarePlus,
  Pencil, Calendar, Activity, Users, AlertTriangle,
  ChevronRight, MoreHorizontal, Minus, Bell, TrendingUp,
  Clock, Flame, BarChart2, Shield,
} from 'lucide-react';
import { RingChart, Avatar } from './DashboardPrimitives';

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  blue:    '#0ea5e9',
  cyan:    '#06b6d4',
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

// ── Chart tooltip ──────────────────────────────────────────────────────────────
function Tip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#070e1c', border: `1px solid ${T.borderM}`, borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p style={{ color: T.text2, fontSize: 10, fontWeight: 600, margin: '0 0 3px', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ color: T.text1, fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value}{unit}</p>
    </div>
  );
}

// ── Mini sparkline ─────────────────────────────────────────────────────────────
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
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${uid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, valueSuffix, sub, subTrend, subContext, sparkData, ring, ringColor, footerBar, icon: Icon, color, cta, onCta }) {
  const c = color || T.blue;
  const trendColor = subTrend === 'up' ? T.green : subTrend === 'down' ? T.red : T.text3;
  const TrendIcon  = subTrend === 'up' ? ArrowUpRight : subTrend === 'down' ? TrendingDown : Minus;
  const showRing   = ring != null && ring > 5 && ring < 98;
  return (
    <div style={{ borderRadius: 12, padding: '16px 18px 14px', background: T.card, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Shimmer */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${c}28,transparent)`, pointerEvents: 'none' }} />
      {/* Corner glow */}
      <div style={{ position: 'absolute', bottom: -16, right: -16, width: 60, height: 60, borderRadius: '50%', background: c, opacity: 0.06, filter: 'blur(20px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{label}</span>
        {Icon && (
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `${c}14`, border: `1px solid ${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, footerBar))}%`, background: c, borderRadius: 99, transition: 'width 0.7s ease' }} />
        </div>
      )}

      {/* Inline CTA — for at-risk card and others */}
      {cta && onCta && (
        <button onClick={onCta}
          style={{ marginTop: footerBar == null ? 10 : 0, width: '100%', padding: '6px 10px', borderRadius: 7, background: `${c}10`, border: `1px solid ${c}28`, color: c, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'inherit', transition: 'background 0.12s' }}
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}` }}>
      <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {badge && <span style={{ fontSize: 9, fontWeight: 700, color: badge.color, background: `${badge.color}14`, border: `1px solid ${badge.color}22`, borderRadius: 5, padding: '1px 6px' }}>{badge.label}</span>}
        <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || T.text1 }}>{value}</span>
      </div>
    </div>
  );
}

// ── Action row ─────────────────────────────────────────────────────────────────
function ActionRow({ icon: Icon, label, action, color, onClick, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}`, cursor: 'pointer' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 13, height: 13, color }} />
      </div>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: hov ? T.text1 : T.text2, lineHeight: 1.4, transition: 'color 0.12s' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, opacity: hov ? 1 : 0.7, transition: 'opacity 0.12s' }}>
        {action}<ChevronRight style={{ width: 11, height: 11 }} />
      </span>
    </div>
  );
}

// ── Smart signal row — the new action items ────────────────────────────────────
function Signal({ color, icon: Icon, title, detail, action, onAction, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ padding: '10px 12px', borderRadius: 9, background: `${color}07`, border: `1px solid ${color}20`, marginBottom: last ? 0 : 7, cursor: onAction ? 'pointer' : 'default' }}
      onClick={onAction}
      onMouseEnter={() => onAction && setHov(true)}
      onMouseLeave={() => onAction && setHov(false)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <Icon style={{ width: 11, height: 11, color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text1, lineHeight: 1.3, marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.4 }}>{detail}</div>
        </div>
        {action && (
          <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}28`, borderRadius: 5, padding: '2px 7px', flexShrink: 0, opacity: hov ? 1 : 0.8, transition: 'opacity 0.12s', whiteSpace: 'nowrap' }}>
            {action}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Inline stat-backed nudge — appears inside individual cards ────────────────
function StatNudge({ color = T.cyan, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 11px', borderRadius: 9, background: `${color}07`, border: `1px solid ${color}18` }}>
      {Icon && <Icon style={{ width: 12, height: 12, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.text1 }}>{stat} </span>
        <span style={{ fontSize: 11, color: T.text3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={onAction} style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}28`, borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          {action}
        </button>
      )}
    </div>
  );
}

// ── Action Items (signals panel) ───────────────────────────────────────────────
function TodayActions({ atRisk, checkIns, allMemberships, posts, challenges, now, openModal, setTab, newNoReturnCount = 0 }) {
  const signals = useMemo(() => {
    const items = [];

    // 🔴 New members who haven't returned (count from backend)
    if (newNoReturnCount > 0) {
      items.push({ priority: 1, color: T.red, icon: UserPlus, title: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''} haven't returned`, detail: 'Joined 1–2 weeks ago, no second visit yet. Week-1 follow-up has the highest retention impact.', action: 'Follow up', fn: () => openModal('message') });
    }

    // 🔴 At-risk members
    if (atRisk > 0) {
      const pct = allMemberships.length > 0 ? Math.round((atRisk / allMemberships.length) * 100) : 0;
      items.push({ priority: 2, color: atRisk >= 5 ? T.red : T.amber, icon: AlertTriangle, title: `${atRisk} member${atRisk > 1 ? 's' : ''} inactive for 14+ days`, detail: `${pct}% of your gym. Direct outreach is the most effective re-engagement method — waiting makes it harder.`, action: 'View & message', fn: () => setTab('members') });
    }

    // 🟡 No active challenge
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      items.push({ priority: 3, color: T.amber, icon: Trophy, title: 'No active challenge', detail: 'Members with an active goal to work toward tend to visit more consistently — give them something to compete for.', action: 'Create one', fn: () => openModal('challenge') });
    }

    // 🟡 No post this week
    const recentPost = (posts || []).find(p => differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 7);
    if (!recentPost) {
      const daysSince = posts?.length > 0 ? differenceInDays(now, new Date(posts[0].created_at || posts[0].created_date || now)) : null;
      items.push({ priority: 4, color: T.amber, icon: MessageSquarePlus, title: daysSince ? `No post in ${daysSince} days` : 'No community posts yet', detail: 'Regular posts lift engagement scores. Try a motivational post or a poll.', action: 'Post now', fn: () => openModal('post') });
    }

    // 🔵 No event this month
    const hasEvent = (challenges || []).some(c => !c.ended_at); // reuse to check events via posts heuristic
    const lastEventDays = posts?.length > 0 ? null : 99;
    if (!recentPost && !hasChallenge) {
      // Already have both nudges — skip duplicate
    }

    // 🔵 No check-ins today (after 10am)
    const todayCount = checkIns.filter(c => {
      const d = new Date(c.check_in_date), t = now;
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    if (todayCount === 0 && now.getHours() >= 10) {
      items.push({ priority: 5, color: T.blue, icon: QrCode, title: 'No check-ins recorded today', detail: 'Check-ins usually start arriving by 9–10am. Scanner issue?', action: 'Check scanner', fn: () => openModal('qrScanner') });
    }

    // 🔵 Weekend coming — promote a class
    const dayOfWeek = now.getDay(); // 0=Sun, 4=Thu, 5=Fri
    if ((dayOfWeek === 4 || dayOfWeek === 5) && !recentPost) {
      items.push({ priority: 6, color: T.blue, icon: Calendar, title: 'Thursday/Friday — prime time to promote weekend classes', detail: 'Promoting weekend classes on Thursday or Friday gives members time to plan ahead.', action: 'Post promo', fn: () => openModal('post') });
    }

    // 🟡 Low engagement — no poll in 2 weeks
    const recentPoll = (posts || []).find(p => (p.type === 'poll' || p.category === 'poll') && differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 14);
    if (!recentPoll && allMemberships.length >= 5) {
      items.push({ priority: 7, color: T.cyan, icon: BarChart2, title: 'No poll in the last 2 weeks', detail: 'Polls invite participation and show members their opinion counts — good for community feel.', action: 'Run a poll', fn: () => openModal('poll') });
    }

    return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [atRisk, checkIns, allMemberships, posts, challenges, now]);

  // Health summary (no heavy computation — use pre-computed atRisk & challenges)
  const positives = useMemo(() => {
    const items = [];
    if (atRisk === 0) items.push('All members active');
    const hasActiveChallenge = (challenges || []).some(c => !c.ended_at);
    if (hasActiveChallenge) items.push('Active challenge running');
    return items.slice(0, 2);
  }, [atRisk, challenges]);

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.blue}22,transparent)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Action Items</div>
        {signals.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: signals[0]?.color === T.red ? T.red : T.amber, background: `${signals[0]?.color === T.red ? T.red : T.amber}14`, border: `1px solid ${signals[0]?.color === T.red ? T.red : T.amber}22`, borderRadius: 99, padding: '2px 8px' }}>{signals.length} pending</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>Sorted by urgency</div>

      {signals.length === 0 ? (
        <div style={{ padding: '12px 14px', borderRadius: 9, background: `${T.green}0a`, border: `1px solid ${T.green}18`, marginBottom: positives.length ? 10 : 0 }}>
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
            <Signal key={i} color={s.color} icon={s.icon} title={s.title} detail={s.detail} action={s.action} onAction={s.fn} last={i === signals.length - 1} />
          ))}
        </div>
      )}

      {/* Positive signals */}
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
    </div>
  );
}

// ── Retention breakdown ────────────────────────────────────────────────────────
function RetentionBreakdown({ retentionBreakdown: risks = {}, setTab }) {
  const computed = {
    week1: risks.week1 || 0, week2to4: risks.week2to4 || 0,
    month2to3: risks.month2to3 || 0, beyond: risks.beyond || 0,
  };
  const rows = [
    { label: 'New — went quiet',  sub: 'Joined < 2 wks, no return', val: computed.week1,     color: T.red   },
    { label: 'Early drop-off',    sub: 'Weeks 2–4 inactivity',      val: computed.week2to4,  color: T.amber },
    { label: 'Month 2–3 slip',    sub: 'Common churn window',       val: computed.month2to3, color: T.amber },
    { label: 'Long inactive',     sub: '21+ days absent',           val: computed.beyond,    color: T.text3 },
  ];
  const total = rows.reduce((s, r) => s + r.val, 0);
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>Drop-off Risk</div>
          <div style={{ fontSize: 11, color: T.text3 }}>Where members go quiet</div>
        </div>
        <button onClick={() => setTab && setTab('members')} style={{ fontSize: 11, fontWeight: 600, color: T.blue, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
          View all <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
      {total === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: `${T.green}0a`, border: `1px solid ${T.green}18` }}>
          <CheckCircle style={{ width: 13, height: 13, color: T.green, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: T.text2 }}>No drop-off risks detected</span>
        </div>
      ) : rows.map((r, i) => (
        <div key={i} style={{ marginBottom: i < rows.length - 1 ? 12 : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: r.val > 0 ? T.text1 : T.text3 }}>{r.label}</span>
              <span style={{ fontSize: 10, color: T.text3, marginLeft: 7 }}>{r.sub}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: r.val > 0 ? r.color : T.text3 }}>{r.val}</span>
          </div>
          <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: total > 0 ? `${(r.val / total) * 100}%` : '0%', background: r.color, borderRadius: 99, opacity: r.val > 0 ? 1 : 0.2, transition: 'width 0.7s ease' }} />
          </div>
        </div>
      ))}
      {computed.week1 > 0 && (
        <StatNudge
          color={T.red}
          icon={AlertTriangle}
          stat={`${computed.week1} new member${computed.week1 > 1 ? 's' : ''} went quiet immediately.`}
          detail="The first 7 days are critical — members who don't return in week 1 are far less likely to become regulars."
          action="Follow up"
          onAction={() => setTab && setTab('members')}
        />
      )}
      {computed.week1 === 0 && total > 0 && (
        <StatNudge
          color={T.green}
          icon={CheckCircle}
          stat="No immediate drop-offs."
          detail="Keep it up — the month 2–3 window is the next common drop-off point to watch."
        />
      )}
    </div>
  );
}

// ── Week-1 return rate ─────────────────────────────────────────────────────────
function WeekOneReturn({ week1ReturnRate = {}, openModal }) {
  const { returned = 0, didnt = 0, names = [] } = week1ReturnRate;
  const total = returned + didnt;
  const pct   = total > 0 ? Math.round((returned / total) * 100) : 0;
  const color = total === 0 ? T.text3 : pct >= 60 ? T.green : pct >= 40 ? T.amber : T.red;
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>Week-1 Return Rate</div>
          <div style={{ fontSize: 11, color: T.text3 }}>New members, joined 1–3 weeks ago</div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {total === 0 ? '—' : `${pct}%`}
        </div>
      </div>
      {total === 0 ? (
        <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>No members in the 1–3 week window yet.</p>
      ) : (
        <>
          <div style={{ height: 4, borderRadius: 99, background: T.divider, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.7s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.green}0a`, border: `1px solid ${T.green}1a`, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.green, letterSpacing: '-0.03em' }}>{returned}</div>
              <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Came back</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.red}0a`, border: `1px solid ${didnt > 0 ? T.red + '1a' : T.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: didnt > 0 ? T.red : T.text3, letterSpacing: '-0.03em' }}>{didnt}</div>
              <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Didn't return</div>
            </div>
          </div>
          {didnt > 0 && names.length > 0 && (
            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: `${T.red}07`, border: `1px solid ${T.red}18` }}>
              <div style={{ fontSize: 11, color: T.text2, marginBottom: 6, lineHeight: 1.5 }}>
                {names.join(', ')}{didnt > 3 ? ` +${didnt - 3} more` : ''} — no return visit yet
              </div>
              <button onClick={() => openModal('message')} style={{ fontSize: 11, fontWeight: 700, color: T.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                Send follow-up <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>
          )}
          <StatNudge
            color={pct >= 60 ? T.green : T.red}
            icon={pct >= 60 ? CheckCircle : AlertTriangle}
            stat={pct >= 60 ? 'Strong week-1 retention.' : 'Week-1 follow-ups work.'}
            detail={pct >= 60
              ? 'Members who return in week 1 are significantly more likely to become long-term regulars.'
              : `A personal message in the first week is the single highest-impact action for week-1 retention.`}
            action={didnt > 0 ? 'Message now' : undefined}
            onAction={didnt > 0 ? () => openModal('message') : undefined}
          />
        </>
      )}
    </div>
  );
}

// ── Engagement breakdown ───────────────────────────────────────────────────────
function EngagementBreakdown({ monthCiPer, totalMembers, atRisk, setTab }) {
  const rows = [
    { label: 'Super active', sub: '12+ visits/mo', val: (monthCiPer || []).filter(v => v >= 12).length,          color: T.green  },
    { label: 'Active',       sub: '4–11 visits',   val: (monthCiPer || []).filter(v => v >= 4 && v < 12).length, color: T.blue   },
    { label: 'Occasional',   sub: '1–3 visits',    val: (monthCiPer || []).filter(v => v >= 1 && v < 4).length,  color: T.amber  },
    { label: 'At risk',      sub: '14+ days away', val: atRisk,                                                   color: T.red    },
  ];
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Engagement Split</div>
        <button onClick={() => setTab('members')} style={{ fontSize: 11, fontWeight: 600, color: T.blue, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
          Members <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
      <div style={{ display: 'flex', height: 5, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 16 }}>
        {rows.filter(r => r.val > 0).length > 0
          ? rows.filter(r => r.val > 0).map((r, i, arr) => (
              <div key={i} style={{ flex: r.val, background: r.color, opacity: 0.85, borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length - 1 ? '0 99px 99px 0' : 0 }} />
            ))
          : <div style={{ flex: 1, background: T.divider, borderRadius: 99 }} />
        }
      </div>
      {rows.map((r, i) => {
        const pct = totalMembers > 0 ? Math.round((r.val / totalMembers) * 100) : 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < rows.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: r.color, flexShrink: 0, opacity: r.val > 0 ? 1 : 0.3 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: r.val > 0 ? T.text1 : T.text3, flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 11, color: T.text3, marginRight: 10 }}>{r.sub}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: r.val > 0 ? r.color : T.text3, minWidth: 22, textAlign: 'right' }}>{r.val}</span>
            <span style={{ fontSize: 11, color: T.text3, minWidth: 28, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      })}
      {atRisk > 0 && (
        <StatNudge
          color={T.red}
          icon={AlertTriangle}
          stat={`${atRisk} member${atRisk > 1 ? 's' : ''} at risk.`}
          detail="Early outreach is most effective — the longer a lapsed member waits, the harder it is to re-engage."
          action="View members"
          onAction={() => setTab('members')}
        />
      )}
      {atRisk === 0 && totalMembers >= 5 && (
        <StatNudge
          color={T.green}
          icon={CheckCircle}
          stat="All members active."
          detail="Active gyms maintain this by running a challenge every 6–8 weeks."
        />
      )}
    </div>
  );
}

// ── Recent Activity ────────────────────────────────────────────────────────────
function ActivityFeed({ recentActivity, now, avatarMap }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 16 }}>Recent Activity</div>
      {!recentActivity || recentActivity.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Activity style={{ width: 20, height: 20, color: T.text3, margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
          <p style={{ fontSize: 12, color: T.text3, margin: '0 0 4px', fontWeight: 600 }}>No activity yet today</p>
          <p style={{ fontSize: 11, color: T.text3, margin: 0, opacity: 0.7 }}>Typical peak is 5–7pm</p>
        </div>
      ) : recentActivity.slice(0, 6).map((a, i) => {
        const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
        const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` : `${Math.floor(minsAgo / 1440)}d ago`;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < Math.min(recentActivity.length, 6) - 1 ? `1px solid ${T.divider}` : 'none' }}>
            <Avatar name={a.name} size={28} src={avatarMap?.[a.user_id] || null} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: T.text1, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>{a.name}</span>
                <span style={{ color: T.text2 }}> {a.action}</span>
              </div>
            </div>
            <span style={{ fontSize: 11, color: T.text3, flexShrink: 0 }}>{timeStr}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Member Growth ──────────────────────────────────────────────────────────────
function MemberGrowthCard({ newSignUps, cancelledEst, retentionRate, monthGrowthData }) {
  const hasEnoughData = (monthGrowthData || []).filter(d => d.value > 0).length >= 2;
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 4 }}>Member Growth</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: newSignUps > 0 ? T.green : T.text3, letterSpacing: '-0.04em' }}>
              {newSignUps > 0 ? `+${newSignUps}` : newSignUps}
            </span>
            <span style={{ fontSize: 12, color: T.text3 }}>this month</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ padding: '4px 10px', borderRadius: 6, background: `${T.green}0f`, border: `1px solid ${T.green}22`, fontSize: 11, fontWeight: 600, color: T.green }}>{retentionRate}% retained</div>
          <div style={{ padding: '4px 10px', borderRadius: 6, background: cancelledEst > 0 ? `${T.red}0a` : T.divider, border: `1px solid ${cancelledEst > 0 ? T.red + '20' : T.border}`, fontSize: 11, fontWeight: 600, color: cancelledEst > 0 ? T.red : T.text3 }}>{cancelledEst} cancelled</div>
        </div>
      </div>
      {hasEnoughData ? (
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={monthGrowthData} barSize={20} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="growGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.green} stopOpacity={0.85} />
                <stop offset="100%" stopColor={T.green} stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
            <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip content={<Tip unit=" members" />} cursor={{ fill: `${T.green}08` }} />
            <Bar dataKey="value" fill="url(#growGrad)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: T.divider, gap: 6 }}>
          <div style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>Chart populates as data grows</div>
          <div style={{ fontSize: 11, color: T.text3, opacity: 0.7 }}>Check back next month for trends</div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.divider}` }}>
        {[
          { label: 'New',       value: newSignUps,     color: newSignUps > 0 ? T.green : T.text3 },
          { label: 'Cancelled', value: cancelledEst,   color: cancelledEst > 0 ? T.red : T.text3 },
          { label: 'Net',       value: `${newSignUps - cancelledEst >= 0 ? '+' : ''}${newSignUps - cancelledEst}`, color: newSignUps >= cancelledEst ? T.green : T.red },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? `1px solid ${T.divider}` : 'none' }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {retentionRate < 70 ? (
        <StatNudge
          color={T.red}
          icon={TrendingDown}
          stat={`${retentionRate}% retention — below the 70% healthy threshold.`}
          detail="70% is a healthy retention baseline. The highest-impact habit: personally welcoming every new member in their first week."
        />
      ) : cancelledEst > newSignUps ? (
        <StatNudge
          color={T.red}
          icon={AlertTriangle}
          stat="More cancellations than sign-ups this month."
          detail="Run a referral incentive or re-engagement challenge to reverse the trend."
        />
      ) : newSignUps > 0 ? (
        <StatNudge
          color={T.green}
          icon={TrendingUp}
          stat={`+${newSignUps} new member${newSignUps > 1 ? 's' : ''} this month.`}
          detail="Early habit formation matters — new members who visit frequently in their first few weeks are far more likely to stick."
        />
      ) : null}
    </div>
  );
}

// ── Check-in Activity chart ────────────────────────────────────────────────────
function CheckInChart({ chartDays, chartRange, setChartRange, now, activeThisWeek }) {
  const todayLabel = format(now, chartRange <= 7 ? 'EEE' : 'MMM d');
  const chartMax   = Math.max(...(chartDays || []).map(d => d.value), 1);

  // Compute comparison context
  const weeklyAvg = useMemo(() => {
    if (!chartDays?.length) return 0;
    const vals = chartDays.map(d => d.value);
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [chartDays]);

  const todayVal = (chartDays || []).find(d => d.day === todayLabel)?.value ?? 0;
  const sameDayLastWeek = useMemo(() => {
    if (!chartDays || chartRange !== 7) return null;
    const today = now.getDay();
    // Find the same day last week in the 30-day range — we just use the same index minus 7 days which may not be in this week's data
    return null; // placeholder — parent should pass this in if needed
  }, [chartDays, chartRange, now]);

  const RANGES = [{ val: 7, label: '7D' }, { val: 30, label: '30D' }];

  return (
    <div style={{ padding: '20px 20px 16px', borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Check-in Activity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: T.text3 }}>
              Daily avg <span style={{ fontWeight: 700, color: T.text2 }}>{weeklyAvg}</span>
            </div>
            {todayVal > 0 && (
              <>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: T.text3 }} />
                <div style={{ fontSize: 11, color: T.text3 }}>
                  Today <span style={{ fontWeight: 700, color: T.blue }}>{todayVal}</span>
                </div>
              </>
            )}
            {todayVal === 0 && now.getHours() < 10 && (
              <div style={{ fontSize: 10, color: T.text3, fontStyle: 'italic' }}>Peak usually 5–7pm</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {RANGES.map(r => (
            <button key={r.val} onClick={() => setChartRange(r.val)}
              style={{ fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.12s', background: chartRange === r.val ? `${T.blue}18` : 'transparent', color: chartRange === r.val ? T.blue : T.text3, border: `1px solid ${chartRange === r.val ? T.blue + '35' : T.border}`, fontFamily: 'inherit' }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={chartDays || []} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barSize={chartRange <= 7 ? 22 : 9}>
          <defs>
            <linearGradient id="barToday" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.blue} stopOpacity={1} />
              <stop offset="100%" stopColor={T.blue} stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
          <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} interval={chartRange <= 7 ? 0 : 4} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} allowDecimals={false} domain={[0, Math.max(chartMax + 1, 5)]} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const isToday = label === todayLabel;
              const val = payload[0].value;
              const avg = parseFloat(weeklyAvg);
              const vsAvg = avg > 0 ? Math.round(((val - avg) / avg) * 100) : 0;
              return (
                <div style={{ background: '#070e1c', border: `1px solid ${isToday ? T.blue + '50' : T.borderM}`, borderRadius: 9, padding: '9px 13px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 130 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isToday ? T.blue : T.text3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{isToday ? 'Today' : label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: T.text1, letterSpacing: '-0.03em', marginBottom: 4 }}>{val} <span style={{ fontSize: 11, fontWeight: 500, color: T.text3 }}>check-ins</span></div>
                  {avg > 0 && val > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {vsAvg >= 0 ? <TrendingUp style={{ width: 10, height: 10, color: T.green }} /> : <TrendingDown style={{ width: 10, height: 10, color: T.red }} />}
                      <span style={{ fontSize: 10, fontWeight: 700, color: vsAvg >= 0 ? T.green : T.red }}>{vsAvg >= 0 ? '+' : ''}{vsAvg}% vs avg</span>
                    </div>
                  )}
                  {val === 0 && now.getHours() < 18 && isToday && (
                    <div style={{ fontSize: 10, color: T.text3 }}>Peak hours: 5–7pm</div>
                  )}
                </div>
              );
            }}
            cursor={{ fill: `${T.blue}07` }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {(chartDays || []).map((entry, i) => (
              <Cell key={i} fill={entry.day === todayLabel ? 'url(#barToday)' : `${T.blue}38`} />
            ))}
          </Bar>
          {/* Reference line for average */}
          {parseFloat(weeklyAvg) > 0 && (
            <ReferenceLine y={parseFloat(weeklyAvg)} stroke={`${T.blue}40`} strokeDasharray="4 4"
              label={{ value: `avg ${weeklyAvg}`, position: 'insideTopRight', fill: T.text3, fontSize: 9, fontFamily: 'DM Sans, system-ui' }} />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Context footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: T.blue }} />
          <span style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>Today</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: `${T.blue}38` }} />
          <span style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>Past days</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 1, borderTop: `2px dashed ${T.blue}55` }} />
          <span style={{ fontSize: 10, color: T.text3, fontWeight: 500 }}>Daily avg</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabOverview({
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate,
  newSignUps, monthChangePct, ciPrev30, atRisk, sparkData, monthGrowthData,
  cancelledEst, monthCiPer,
  checkIns, allMemberships, challenges, posts, polls, classes, coaches,
  recentActivity, chartDays, chartRange, setChartRange, avatarMap,
  priorities, selectedGym, now,
  openModal, setTab,
  // Pre-computed from backend
  retentionBreakdown = {}, week1ReturnRate = {}, newNoReturnCount = 0,
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const inGymNow = checkIns.filter(c => {
    const diff = (now - new Date(c.check_in_date)) / 60000;
    return diff >= 0 && diff <= 120;
  }).length;

  // Contextual check-in sub text
  const ciSub = useMemo(() => {
    if (yesterdayCI === 0) return todayCI > 0 ? 'No data for yesterday' : 'No check-ins yet today';
    if (todayVsYest > 0)  return `↑ ${todayVsYest}% vs yesterday`;
    if (todayVsYest < 0)  return `↓ ${Math.abs(todayVsYest)}% vs yesterday`;
    return 'Same as yesterday';
  }, [todayCI, yesterdayCI, todayVsYest]);

  // Weekly avg for "vs last week" context on daily card
  const weeklyAvgCI = useMemo(() => {
    if (!chartDays?.length) return null;
    const avg = chartDays.reduce((a, b) => a + b.value, 0) / chartDays.length;
    return avg.toFixed(1);
  }, [chartDays]);

  const ciTrend  = yesterdayCI > 0 && todayVsYest > 0 ? 'up' : yesterdayCI > 0 && todayVsYest < 0 ? 'down' : null;
  const showRing = retentionRate > 5 && retentionRate < 98;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, alignItems: 'start' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>

          {/* Today's Check-ins */}
          <KpiCard
            label="Today's Check-ins"
            value={todayCI}
            sub={ciSub}
            subTrend={ciTrend}
            subContext={weeklyAvgCI ? `Weekly avg: ${weeklyAvgCI}/day` : undefined}
            sparkData={sparkData}
            icon={Activity}
            color={T.blue}
            footerBar={Math.min(100, (todayCI / Math.max(parseFloat(weeklyAvgCI || 1), 1)) * 100)}
          />

          {/* Active Members */}
          <KpiCard
            label="Active Members"
            value={activeThisWeek}
            valueSuffix={`/ ${totalMembers}`}
            sub={`${retentionRate}% retention`}
            subTrend={retentionRate >= 70 ? 'up' : retentionRate < 50 ? 'down' : null}
            subContext={retentionRate < 60 ? 'Below 70% healthy threshold' : retentionRate >= 80 ? 'Excellent — top 20%' : undefined}
            ring={showRing ? retentionRate : null}
            ringColor={retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red}
            sparkData={!showRing ? sparkData : null}
            icon={UserPlus}
            color={retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red}
          />

          {/* In Gym Now */}
          <KpiCard
            label="In Gym Now"
            value={inGymNow}
            sub={inGymNow === 0 ? (now.getHours() < 10 ? 'Early — peak at 5–7pm' : now.getHours() < 17 ? 'Quiet period — midday dip' : 'No recent check-ins') : `${inGymNow === 1 ? 'Member' : 'Members'} in last 2h`}
            subTrend={inGymNow > 0 ? 'up' : null}
            sparkData={sparkData}
            icon={Users}
            color={T.blue}
            footerBar={totalMembers > 0 ? (inGymNow / totalMembers) * 100 : 0}
          />

          {/* At-risk — now with inline CTA */}
          <KpiCard
            label="At-Risk Members"
            value={atRisk}
            sub={atRisk > 0
              ? `${Math.round((atRisk / Math.max(totalMembers, 1)) * 100)}% of gym inactive`
              : 'All members active'}
            subTrend={atRisk > 0 ? 'down' : 'up'}
            subContext={atRisk > 0 ? '14+ days without a visit' : undefined}
            sparkData={sparkData}
            icon={Zap}
            color={atRisk > 0 ? T.red : T.green}
            cta={atRisk > 0 ? 'View & message' : undefined}
            onCta={atRisk > 0 ? () => setTab('members') : undefined}
          />
        </div>

        {/* Check-in Activity chart */}
        <CheckInChart
          chartDays={chartDays}
          chartRange={chartRange}
          setChartRange={setChartRange}
          now={now}
          activeThisWeek={activeThisWeek}
        />

        {/* Member Growth */}
        <MemberGrowthCard
          newSignUps={newSignUps}
          cancelledEst={cancelledEst}
          retentionRate={retentionRate}
          monthGrowthData={monthGrowthData}
        />

        {/* Drop-off Risk + Week-1 Return */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <RetentionBreakdown retentionBreakdown={retentionBreakdown} setTab={setTab} />
          <WeekOneReturn week1ReturnRate={week1ReturnRate} openModal={openModal} />
        </div>

        {/* Engagement + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <EngagementBreakdown monthCiPer={monthCiPer} totalMembers={totalMembers} atRisk={atRisk} setTab={setTab} />
          <ActivityFeed recentActivity={recentActivity} now={now} avatarMap={avatarMap} />
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Smart signals — the upgraded action panel */}
        <TodayActions
          atRisk={atRisk}
          checkIns={checkIns}
          allMemberships={allMemberships}
          posts={posts}
          challenges={challenges}
          now={now}
          openModal={openModal}
          setTab={setTab}
          newNoReturnCount={newNoReturnCount}
        />

        {/* Quick Actions */}
        <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.blue}20,transparent)`, pointerEvents: 'none' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {[
              { icon: UserPlus,          label: 'Add Member',    color: T.green,  fn: () => openModal('members')   },
              { icon: QrCode,            label: 'Scan Check-in', color: T.blue,   fn: () => openModal('qrScanner') },
              { icon: Trophy,            label: 'New Challenge', color: T.amber,  fn: () => openModal('challenge') },
              { icon: MessageSquarePlus, label: 'Send Message',  color: T.purple, fn: () => openModal('post')      },
              { icon: Pencil,            label: 'Post Update',   color: T.blue,   fn: () => openModal('post')      },
              { icon: Calendar,          label: 'New Event',     color: T.green,  fn: () => openModal('event')     },
            ].map(({ icon: Icon, label, color, fn }, i) => {
              const [hov, setHov] = useState(false);
              return (
                <button key={i} onClick={fn} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 9, background: hov ? `${color}10` : T.divider, border: `1px solid ${hov ? color + '30' : T.border}`, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.blue}20,transparent)`, pointerEvents: 'none' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>Monthly Snapshot</div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>{format(now, 'MMMM yyyy')}</div>
          <StatRow label="Total members"    value={totalMembers} />
          <StatRow label="Active this week" value={activeThisWeek}   valueColor={T.blue} />
          <StatRow label="New sign-ups"     value={newSignUps}        valueColor={newSignUps > 0 ? T.green : T.text1}
            badge={newSignUps > 0 ? { label: `+${newSignUps}`, color: T.green } : undefined} />
          <StatRow label="Cancelled est."   value={cancelledEst}      valueColor={cancelledEst > 0 ? T.red : T.text3} />
          <StatRow label="At risk"          value={atRisk}            valueColor={atRisk > 0 ? T.red : T.green} />
          <StatRow label="Retention rate"   value={`${retentionRate}%`} valueColor={retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red}
            badge={retentionRate >= 70 ? { label: '✓ Healthy', color: T.green } : retentionRate < 50 ? { label: '⚠ Low', color: T.red } : undefined} />
          <StatRow label="Month change"     value={monthChangePct > 0 ? `+${monthChangePct}%` : `${monthChangePct}%`}
            valueColor={monthChangePct >= 0 ? T.green : T.red} last />
        </div>

        {/* Pinned priorities */}
        {priorities && priorities.length > 0 && (
          <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Pinned Priorities</div>
              <MoreHorizontal style={{ width: 15, height: 15, color: T.text3, cursor: 'pointer' }} />
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>Owner-defined tasks</div>
            {priorities.map((p, i) => (
              <ActionRow key={i} icon={p.icon} label={p.label} action={p.action} color={p.color} onClick={p.fn} last={i === priorities.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}