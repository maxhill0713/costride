import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, subDays } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ArrowUpRight, Zap,
  CheckCircle, Trophy, UserPlus, QrCode, MessageSquarePlus,
  Pencil, Calendar, Activity, Users, AlertTriangle,
  Clock, ChevronRight, MoreHorizontal,
} from 'lucide-react';
import {
  Card, SectionTitle, Empty, Avatar, RingChart, Sparkline,
} from './DashboardPrimitives';
import { SmartNudges, CommunityHealthScore } from './OverviewWidgets';

// ── Design tokens ─────────────────────────────────────────────────────────────
// Single accent: blue. Semantic only for numbers.
const T = {
  blue:    '#0ea5e9',
  blueL:   '#38bdf8',
  green:   '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
  text1:   '#f0f4f8',
  text2:   '#94a3b8',
  text3:   '#475569',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120',
  cardAlt: '#0d1526',
  divider: 'rgba(255,255,255,0.05)',
};

const tickStyle = {
  fill: T.text3,
  fontSize: 11,
  fontFamily: 'DM Sans, system-ui',
};

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function Tip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0a1020', border: `1px solid ${T.borderM}`, borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: T.text2, fontSize: 10, fontWeight: 600, margin: '0 0 3px', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ color: T.text1, fontWeight: 800, fontSize: 14, margin: 0 }}>
        {payload[0].value}{unit}
      </p>
    </div>
  );
}

// ── KPI Card — clean, no glow blobs, no rainbow ───────────────────────────────
function KpiCard({ label, value, valueSuffix, sub, subTrend, sparkData, ring, ringColor, footerBar, icon: Icon }) {
  const trendColor = subTrend === 'up' ? T.green : subTrend === 'down' ? T.red : T.text3;
  const TrendIcon  = subTrend === 'up' ? ArrowUpRight : subTrend === 'down' ? TrendingDown : null;
  return (
    <div style={{
      borderRadius: 12,
      padding: '18px 20px',
      background: T.card,
      border: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {Icon && (
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `${T.blue}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 13, height: 13, color: T.blue }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: T.text1, lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</span>
            {valueSuffix && <span style={{ fontSize: 14, fontWeight: 500, color: T.text3 }}>{valueSuffix}</span>}
          </div>
          {sub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              {TrendIcon && <TrendIcon style={{ width: 11, height: 11, color: trendColor }} />}
              <span style={{ fontSize: 11, fontWeight: 500, color: trendColor }}>{sub}</span>
            </div>
          )}
        </div>
        {ring != null
          ? <RingChart pct={ring} size={48} stroke={4} color={ringColor || T.blue} />
          : sparkData
            ? <Sparkline data={sparkData} color={T.blue} />
            : null
        }
      </div>
      {footerBar != null && (
        <div style={{ height: 2, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, footerBar)}%`, background: T.blue, borderRadius: 99, transition: 'width 0.7s ease' }} />
        </div>
      )}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: T.divider, margin: '4px 0' }} />;
}

// ── Stat row (label + value, used in sidebars) ────────────────────────────────
function StatRow({ label, value, valueColor, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}` }}>
      <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || T.text1 }}>{value}</span>
    </div>
  );
}

// ── Priority action row ────────────────────────────────────────────────────────
function ActionRow({ icon: Icon, label, action, color, onClick, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}`, cursor: 'pointer' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 13, height: 13, color }} />
      </div>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: hov ? T.text1 : T.text2, lineHeight: 1.4, transition: 'color 0.12s' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
        {action} <ChevronRight style={{ width: 11, height: 11 }} />
      </span>
    </div>
  );
}

// ── Retention Risk Breakdown ──────────────────────────────────────────────────
function RetentionBreakdown({ allMemberships, checkIns, now, setTab }) {
  const risks = useMemo(() => {
    const buckets = { week1: 0, week2to4: 0, month2to3: 0, beyond: 0 };
    allMemberships.forEach(m => {
      const lastCI = checkIns
        .filter(c => c.user_id === m.user_id)
        .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      if (!lastCI) return;
      const daysSince  = differenceInDays(now, new Date(lastCI.check_in_date));
      const joinedDays = differenceInDays(now, new Date(m.created_at || now));
      if      (daysSince >= 7  && joinedDays <= 14) buckets.week1++;
      else if (daysSince >= 7  && joinedDays <= 30) buckets.week2to4++;
      else if (daysSince >= 14 && joinedDays <= 90) buckets.month2to3++;
      else if (daysSince >= 21)                     buckets.beyond++;
    });
    return buckets;
  }, [allMemberships, checkIns, now]);

  const rows = [
    { label: 'New — went quiet',    sub: 'Joined < 2 wks, no return',  val: risks.week1,     color: T.red   },
    { label: 'Early drop-off',      sub: 'Weeks 2–4 inactivity',       val: risks.week2to4,  color: T.amber },
    { label: 'Month 2–3 slip',      sub: 'Common churn window',        val: risks.month2to3, color: T.amber },
    { label: 'Long inactive',       sub: '21+ days absent',            val: risks.beyond,    color: T.text3 },
  ];
  const total = rows.reduce((s, r) => s + r.val, 0);

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>Drop-off Risk</div>
          <div style={{ fontSize: 11, color: T.text3 }}>Where members go quiet</div>
        </div>
        <button onClick={() => setTab('members')} style={{ fontSize: 11, fontWeight: 600, color: T.blue, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
          View all <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: r.val > 0 ? T.text1 : T.text3 }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: r.val > 0 ? r.color : T.text3 }}>{r.val}</span>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: total > 0 ? `${(r.val / total) * 100}%` : '0%', background: r.color, borderRadius: 99, opacity: r.val > 0 ? 1 : 0.3, transition: 'width 0.7s ease' }} />
              </div>
              <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>{r.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Week-1 Return Rate ─────────────────────────────────────────────────────────
function WeekOneReturn({ allMemberships, checkIns, now, openModal }) {
  const { returned, didnt, names } = useMemo(() => {
    const newMembers = allMemberships.filter(m => {
      const d = differenceInDays(now, new Date(m.created_at || now));
      return d >= 7 && d <= 21;
    });
    let returned = 0, didnt = 0;
    const names = [];
    newMembers.forEach(m => {
      const v = checkIns.filter(c => c.user_id === m.user_id);
      if (v.length >= 2) returned++;
      else { didnt++; if (names.length < 3) names.push(m.name || m.full_name || 'Member'); }
    });
    return { returned, didnt, names };
  }, [allMemberships, checkIns, now]);

  const total = returned + didnt;
  const pct   = total > 0 ? Math.round((returned / total) * 100) : 0;
  const color = pct >= 60 ? T.green : pct >= 40 ? T.amber : T.red;

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>Week-1 Return Rate</div>
          <div style={{ fontSize: 11, color: T.text3 }}>New members, joined 1–3 weeks ago</div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-0.04em' }}>{pct}%</div>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: T.divider, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.7s ease' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.green}0a`, border: `1px solid ${T.green}20`, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{returned}</div>
          <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Came back</div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: `${T.red}0a`, border: `1px solid ${T.red}20`, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>{didnt}</div>
          <div style={{ fontSize: 10, color: T.text3, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Didn't return</div>
        </div>
      </div>
      {didnt > 0 && names.length > 0 && (
        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: `${T.red}08`, border: `1px solid ${T.red}18` }}>
          <div style={{ fontSize: 11, color: T.text2, marginBottom: 6, lineHeight: 1.4 }}>
            {names.join(', ')}{didnt > 3 ? ` +${didnt - 3} more` : ''} — no return visit yet
          </div>
          <button onClick={() => openModal('message')} style={{ fontSize: 11, fontWeight: 600, color: T.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
            Send follow-up <ChevronRight style={{ width: 11, height: 11 }} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Today's priorities ─────────────────────────────────────────────────────────
function TodayActions({ atRisk, checkIns, allMemberships, posts, challenges, now, openModal, setTab }) {
  const actions = useMemo(() => {
    const items = [];
    const newNoReturn = allMemberships.filter(m => {
      const d = differenceInDays(now, new Date(m.created_at || now));
      return d >= 7 && d <= 14 && checkIns.filter(c => c.user_id === m.user_id).length < 2;
    });
    if (newNoReturn.length > 0)
      items.push({ priority: 1, color: T.red,   icon: UserPlus,          label: `${newNoReturn.length} new member${newNoReturn.length > 1 ? 's' : ''} haven't returned after joining`, action: 'Follow up', fn: () => openModal('message') });
    if (atRisk > 0)
      items.push({ priority: 2, color: T.amber,  icon: AlertTriangle,     label: `${atRisk} member${atRisk > 1 ? 's' : ''} haven't visited in 14+ days`, action: 'View', fn: () => setTab('members') });
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge)
      items.push({ priority: 3, color: T.amber,  icon: Trophy,            label: 'No active challenge — engagement drops without one', action: 'Create', fn: () => openModal('challenge') });
    const recentPost = (posts || []).find(p => differenceInDays(now, new Date(p.created_at)) <= 7);
    if (!recentPost)
      items.push({ priority: 4, color: T.blue,   icon: MessageSquarePlus, label: 'No community post this week', action: 'Post now', fn: () => openModal('post') });
    const todayCI = checkIns.filter(c => {
      const d = new Date(c.check_in_date), t = now;
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    if (todayCI === 0 && now.getHours() >= 10)
      items.push({ priority: 5, color: T.blue,   icon: Activity,          label: 'No check-ins recorded today — scanner issue?', action: 'Check', fn: () => openModal('qrScanner') });
    return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [atRisk, checkIns, allMemberships, posts, challenges, now]);

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Action Items</div>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, background: T.divider, borderRadius: 99, padding: '2px 8px' }}>{actions.length}</span>
      </div>
      <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>Sorted by urgency</div>
      {actions.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: `${T.green}0a`, border: `1px solid ${T.green}18` }}>
          <CheckCircle style={{ width: 13, height: 13, color: T.green, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: T.text2 }}>All clear — no immediate actions needed</span>
        </div>
      ) : (
        <div>
          {actions.map((a, i) => (
            <ActionRow key={i} icon={a.icon} label={a.label} action={a.action} color={a.color} onClick={a.fn} last={i === actions.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Engagement breakdown ───────────────────────────────────────────────────────
function EngagementBreakdown({ monthCiPer, totalMembers, atRisk, setTab }) {
  const rows = [
    { label: 'Super active', sub: '12+ visits/mo', val: monthCiPer.filter(v => v >= 12).length,          color: T.green },
    { label: 'Active',       sub: '4–11 visits',   val: monthCiPer.filter(v => v >= 4 && v < 12).length, color: T.blue  },
    { label: 'Occasional',   sub: '1–3 visits',    val: monthCiPer.filter(v => v >= 1 && v < 4).length,  color: T.amber },
    { label: 'At risk',      sub: '14+ days away', val: atRisk,                                           color: T.red   },
  ];
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Engagement Split</div>
        <button onClick={() => setTab('members')} style={{ fontSize: 11, fontWeight: 600, color: T.blue, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
          Members <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 16 }}>
        {rows.filter(r => r.val > 0).map((r, i, arr) => (
          <div key={i} style={{ flex: r.val, background: r.color, opacity: 0.85, borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length - 1 ? '0 99px 99px 0' : 0 }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {rows.map((r, i) => {
          const pct = totalMembers > 0 ? Math.round((r.val / totalMembers) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < rows.length - 1 ? `1px solid ${T.divider}` : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text1, flex: 1 }}>{r.label}</span>
              <span style={{ fontSize: 11, color: T.text2 }}>{r.sub}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: r.val > 0 ? r.color : T.text3, minWidth: 28, textAlign: 'right' }}>{r.val}</span>
              <span style={{ fontSize: 11, color: T.text3, minWidth: 28, textAlign: 'right' }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent activity feed ───────────────────────────────────────────────────────
function ActivityFeed({ recentActivity, now, avatarMap }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 16 }}>Recent Activity</div>
      {recentActivity.length === 0 ? (
        <Empty icon={Activity} label="No activity yet" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {recentActivity.slice(0, 6).map((a, i) => {
            const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
            const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` : `${Math.floor(minsAgo / 1440)}d ago`;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < Math.min(recentActivity.length, 6) - 1 ? `1px solid ${T.divider}` : 'none' }}>
                <Avatar name={a.name} size={28} src={avatarMap[a.user_id] || null} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.text1, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600 }}>{a.name}</span>
                    <span style={{ color: T.text2 }}> {a.action}</span>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: T.text3, flexShrink: 0 }}>{timeStr}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TabOverview({
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate,
  newSignUps, monthChangePct, ciPrev30, atRisk, sparkData, monthGrowthData,
  cancelledEst, peakLabel, peakEndLabel, peakEntry, satVsAvg, monthCiPer,
  checkIns, allMemberships, challenges, posts, polls, classes, coaches,
  streaks, recentActivity, chartDays, chartRange, setChartRange, avatarMap,
  priorities, selectedGym, now,
  openModal, setTab,
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

  const ciSub      = yesterdayCI === 0 ? (todayCI > 0 ? 'No prior data' : 'No check-ins yet') : todayVsYest > 0 ? `+${todayVsYest}% vs yesterday` : todayVsYest < 0 ? `${todayVsYest}% vs yesterday` : 'Same as yesterday';
  const ciTrend    = yesterdayCI > 0 && todayVsYest > 0 ? 'up' : yesterdayCI > 0 && todayVsYest < 0 ? 'down' : null;
  const growthSub  = monthChangePct > 0 ? `+${monthChangePct}% vs last month` : monthChangePct < 0 ? `${monthChangePct}% vs last month` : 'Same as last month';
  const chartMax   = Math.max(...chartDays.map(d => d.value), 1);
  const todayLabel = format(now, chartRange <= 7 ? 'EEE' : 'MMM d');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, alignItems: 'start' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard
            label="Today's Check-ins" value={todayCI}
            sub={ciSub} subTrend={ciTrend}
            sparkData={sparkData} icon={Activity}
            footerBar={Math.min(100, (todayCI / Math.max(activeThisWeek / 7, 1)) * 100)}
          />
          <KpiCard
            label="Active Members" value={activeThisWeek} valueSuffix={`/ ${totalMembers}`}
            sub={`${retentionRate}% engagement`} subTrend={retentionRate >= 70 ? 'up' : retentionRate < 50 ? 'down' : null}
            ring={retentionRate} ringColor={T.blue} icon={UserPlus}
          />
          <KpiCard
            label="In Gym Now" value={inGymNow}
            sub={inGymNow === 0 ? 'No recent check-ins' : 'Last 2 hours'}
            subTrend={inGymNow > 0 ? 'up' : null}
            sparkData={sparkData} icon={Users}
            footerBar={totalMembers > 0 ? (inGymNow / totalMembers) * 100 : 0}
          />
          <KpiCard
            label="At-Risk Members" value={atRisk}
            sub={atRisk > 0 ? '14+ days inactive' : 'All members active'}
            subTrend={atRisk > 0 ? 'down' : 'up'}
            sparkData={sparkData} icon={Zap}
          />
        </div>

        {/* Check-ins chart */}
        <div style={{ padding: '20px 20px 16px', borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Check-in Activity</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Daily attendance</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[7, 30, 90].map(r => (
                <button key={r} onClick={() => setChartRange(r)} style={{ fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.12s', background: chartRange === r ? `${T.blue}18` : 'transparent', color: chartRange === r ? T.blue : T.text3, border: `1px solid ${chartRange === r ? T.blue + '35' : T.border}` }}>
                  {r === 7 ? '7D' : r === 30 ? '30D' : '90D'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartDays} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barSize={chartRange <= 7 ? 22 : chartRange <= 30 ? 9 : 4}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
              <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} interval={chartRange <= 7 ? 0 : chartRange <= 30 ? 4 : 13} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<Tip unit=" check-ins" />} cursor={{ fill: `${T.blue}08` }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {chartDays.map((entry, i) => (
                  <Cell key={i} fill={entry.day === todayLabel ? T.blue : entry.value >= chartMax * 0.7 ? `${T.blue}99` : `${T.blue}35`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Member Growth chart */}
        <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 4 }}>Member Growth</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: T.green, letterSpacing: '-0.04em' }}>+{newSignUps}</span>
                <span style={{ fontSize: 12, color: T.text3 }}>this month</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ padding: '4px 10px', borderRadius: 6, background: `${T.green}0f`, border: `1px solid ${T.green}22`, fontSize: 11, fontWeight: 600, color: T.green }}>{retentionRate}% retained</div>
              <div style={{ padding: '4px 10px', borderRadius: 6, background: `${T.red}0a`, border: `1px solid ${T.red}20`, fontSize: 11, fontWeight: 600, color: T.red }}>{cancelledEst} cancelled</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={monthGrowthData} barSize={20} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="growGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.green} stopOpacity={0.85} />
                  <stop offset="100%" stopColor={T.green} stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
              <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<Tip unit=" members" />} cursor={{ fill: `${T.green}08` }} />
              <Bar dataKey="value" fill="url(#growGrad)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.divider}` }}>
            {[
              { label: 'New', value: newSignUps, color: T.green },
              { label: 'Cancelled', value: cancelledEst, color: T.red },
              { label: 'Net', value: `+${newSignUps - cancelledEst}`, color: newSignUps >= cancelledEst ? T.green : T.red },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? `1px solid ${T.divider}` : 'none' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: T.text3, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Retention Risk + Week-1 Return side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <RetentionBreakdown allMemberships={allMemberships} checkIns={checkIns} now={now} setTab={setTab} />
          <WeekOneReturn allMemberships={allMemberships} checkIns={checkIns} now={now} openModal={openModal} />
        </div>

        {/* Engagement split + Recent activity */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <EngagementBreakdown monthCiPer={monthCiPer} totalMembers={totalMembers} atRisk={atRisk} setTab={setTab} />
          <ActivityFeed recentActivity={recentActivity} now={now} avatarMap={avatarMap} />
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Action items */}
        <TodayActions
          atRisk={atRisk} checkIns={checkIns} allMemberships={allMemberships}
          posts={posts} challenges={challenges} now={now}
          openModal={openModal} setTab={setTab}
        />

        {/* Quick actions */}
        <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {[
              { icon: UserPlus,          label: 'Add Member',    fn: () => openModal('members')   },
              { icon: QrCode,            label: 'Scan Check-in', fn: () => openModal('qrScanner') },
              { icon: Trophy,            label: 'New Challenge', fn: () => openModal('challenge') },
              { icon: MessageSquarePlus, label: 'Send Message',  fn: () => openModal('post')      },
              { icon: Pencil,            label: 'Post Update',   fn: () => openModal('post')      },
              { icon: Calendar,          label: 'New Event',     fn: () => openModal('event')     },
            ].map(({ icon: Icon, label, fn }, i) => {
              const [hov, setHov] = useState(false);
              return (
                <button key={i} onClick={fn} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 9, background: hov ? `${T.blue}10` : T.divider, border: `1px solid ${hov ? T.blue + '30' : T.border}`, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${T.blue}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 12, height: 12, color: T.blue }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: hov ? T.text1 : T.text2, transition: 'color 0.12s' }}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Snapshot stats */}
        <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 4 }}>Monthly Snapshot</div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>{format(now, 'MMMM yyyy')}</div>
          <StatRow label="Total members"   value={totalMembers} />
          <StatRow label="Active this week" value={activeThisWeek} valueColor={T.blue} />
          <StatRow label="New sign-ups"    value={newSignUps}    valueColor={T.green} />
          <StatRow label="Cancelled est."  value={cancelledEst}  valueColor={cancelledEst > 0 ? T.red : T.text1} />
          <StatRow label="At risk"         value={atRisk}        valueColor={atRisk > 0 ? T.red : T.green} />
          <StatRow label="Retention rate"  value={`${retentionRate}%`} valueColor={retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red} />
          <StatRow label="Month change"    value={monthChangePct > 0 ? `+${monthChangePct}%` : `${monthChangePct}%`} valueColor={monthChangePct >= 0 ? T.green : T.red} last />
        </div>

        {/* Pinned priorities (owner-defined) */}
        {priorities.length > 0 && (
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

        {/* Smart Nudges — kept as-is, useful */}
        <SmartNudges
          atRisk={atRisk} challenges={challenges} polls={polls}
          monthChangePct={monthChangePct} openModal={openModal} setTab={setTab}
          checkIns={checkIns} allMemberships={allMemberships} now={now}
        />
      </div>
    </div>
  );
}
