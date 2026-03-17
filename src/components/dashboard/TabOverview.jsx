import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingDown, ArrowUpRight, Zap,
  CheckCircle, Trophy, UserPlus, QrCode, MessageSquarePlus,
  Pencil, Calendar, Activity, Users, AlertTriangle,
  ChevronRight, MoreHorizontal, Minus,
} from 'lucide-react';
import { RingChart, Avatar } from './DashboardPrimitives';
import { SmartNudges } from './OverviewWidgets';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  blue:    '#0ea5e9',
  green:   '#10b981',
  red:     '#ef4444',
  amber:   '#f59e0b',
  text1:   '#f0f4f8',
  text2:   '#94a3b8',
  text3:   '#475569',
  border:  'rgba(255,255,255,0.07)',
  borderM: 'rgba(255,255,255,0.11)',
  card:    '#0b1120',
  divider: 'rgba(255,255,255,0.05)',
};

const tickStyle = { fill: T.text3, fontSize: 11, fontFamily: 'DM Sans, system-ui' };

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function Tip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#070e1c', border: `1px solid ${T.borderM}`, borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p style={{ color: T.text2, fontSize: 10, fontWeight: 600, margin: '0 0 3px', letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ color: T.text1, fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value}{unit}</p>
    </div>
  );
}

// ── Mini sparkline — hand-rolled SVG so it's always crisp and readable ─────────
// FIX: replaces the library Sparkline which renders as a faint indistinguishable squiggle
function MiniSpark({ data = [], color = T.blue, width = 72, height = 28 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  // Area fill
  const first = pts.split(' ')[0];
  const last  = pts.split(' ').slice(-1)[0];
  const area  = `${first.split(',')[0]},${height} ${pts} ${last.split(',')[0]},${height}`;
  const uid = color.replace('#','');
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

// ── KPI Card ──────────────────────────────────────────────────────────────────
// FIX 1: Ring chart hidden when pct=100 (shows as empty broken circle)
// FIX 2: Sparkline replaced with crisper hand-rolled version
// FIX 3: Tighter padding so number is more visually dominant
function KpiCard({ label, value, valueSuffix, sub, subTrend, sparkData, ring, ringColor, footerBar, icon: Icon }) {
  const trendColor = subTrend === 'up' ? T.green : subTrend === 'down' ? T.red : T.text3;
  const TrendIcon  = subTrend === 'up' ? ArrowUpRight : subTrend === 'down' ? TrendingDown : Minus;
  // Only show ring when it has a meaningful partial value — 0% or 100% both look broken
  const showRing = ring != null && ring > 5 && ring < 98;

  return (
    <div style={{ borderRadius: 12, padding: '16px 18px 14px', background: T.card, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${T.blue}28,transparent)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: '0.09em', textTransform: 'uppercase' }}>{label}</span>
        {Icon && (
          <div style={{ width: 26, height: 26, borderRadius: 7, background: `${T.blue}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 13, height: 13, color: T.blue }} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7 }}>
              <TrendIcon style={{ width: 11, height: 11, color: trendColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: trendColor, lineHeight: 1.3 }}>{sub}</span>
            </div>
          )}
        </div>
        {showRing
          ? <RingChart pct={ring} size={48} stroke={4} color={ringColor || T.blue} />
          : sparkData && sparkData.some(v => v > 0)
            ? <MiniSpark data={sparkData} color={T.blue} />
            : null
        }
      </div>
      {footerBar != null && (
        <div style={{ height: 2, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, footerBar))}%`, background: T.blue, borderRadius: 99, transition: 'width 0.7s ease' }} />
        </div>
      )}
    </div>
  );
}

// ── Stat row (sidebar) ─────────────────────────────────────────────────────────
function StatRow({ label, value, valueColor, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${T.divider}` }}>
      <span style={{ fontSize: 12, color: T.text2, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || T.text1 }}>{value}</span>
    </div>
  );
}

// ── Action row ────────────────────────────────────────────────────────────────
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

// ── Action Items ───────────────────────────────────────────────────────────────
// FIX: "All clear" state is cleaner — no longer looks sparse when empty
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
    const todayCount = checkIns.filter(c => {
      const d = new Date(c.check_in_date), t = now;
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    if (todayCount === 0 && now.getHours() >= 10)
      items.push({ priority: 5, color: T.blue, icon: Activity, label: 'No check-ins recorded today — scanner issue?', action: 'Check', fn: () => openModal('qrScanner') });
    return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [atRisk, checkIns, allMemberships, posts, challenges, now]);

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Action Items</div>
        {actions.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: T.text3, background: T.divider, borderRadius: 99, padding: '2px 8px' }}>{actions.length}</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>Sorted by urgency</div>
      {actions.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 8, background: `${T.green}0a`, border: `1px solid ${T.green}18` }}>
          <CheckCircle style={{ width: 13, height: 13, color: T.green, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text1, marginBottom: 2 }}>All clear</div>
            <div style={{ fontSize: 11, color: T.text3 }}>No immediate actions needed today</div>
          </div>
        </div>
      ) : actions.map((a, i) => (
        <ActionRow key={i} icon={a.icon} label={a.label} action={a.action} color={a.color} onClick={a.fn} last={i === actions.length - 1} />
      ))}
    </div>
  );
}

// ── Retention Risk ─────────────────────────────────────────────────────────────
function RetentionBreakdown({ allMemberships, checkIns, now, setTab }) {
  const risks = useMemo(() => {
    const b = { week1: 0, week2to4: 0, month2to3: 0, beyond: 0 };
    allMemberships.forEach(m => {
      const lastCI = checkIns.filter(c => c.user_id === m.user_id).sort((a, x) => new Date(x.check_in_date) - new Date(a.check_in_date))[0];
      if (!lastCI) return;
      const ds = differenceInDays(now, new Date(lastCI.check_in_date));
      const jd = differenceInDays(now, new Date(m.created_at || now));
      if      (ds >= 7  && jd <= 14) b.week1++;
      else if (ds >= 7  && jd <= 30) b.week2to4++;
      else if (ds >= 14 && jd <= 90) b.month2to3++;
      else if (ds >= 21)             b.beyond++;
    });
    return b;
  }, [allMemberships, checkIns, now]);

  const rows = [
    { label: 'New — went quiet', sub: 'Joined < 2 wks, no return', val: risks.week1,     color: T.red   },
    { label: 'Early drop-off',   sub: 'Weeks 2–4 inactivity',      val: risks.week2to4,  color: T.amber },
    { label: 'Month 2–3 slip',   sub: 'Common churn window',       val: risks.month2to3, color: T.amber },
    { label: 'Long inactive',    sub: '21+ days absent',           val: risks.beyond,    color: T.text3 },
  ];
  const total = rows.reduce((s, r) => s + r.val, 0);

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>Drop-off Risk</div>
          <div style={{ fontSize: 11, color: T.text3 }}>Where members go quiet</div>
        </div>
        <button onClick={() => setTab('members')} style={{ fontSize: 11, fontWeight: 600, color: T.blue, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
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
    </div>
  );
}

// ── Week-1 Return Rate ─────────────────────────────────────────────────────────
function WeekOneReturn({ allMemberships, checkIns, now, openModal }) {
  const { returned, didnt, names } = useMemo(() => {
    const nm = allMemberships.filter(m => { const d = differenceInDays(now, new Date(m.created_at || now)); return d >= 7 && d <= 21; });
    let returned = 0, didnt = 0; const names = [];
    nm.forEach(m => {
      const v = checkIns.filter(c => c.user_id === m.user_id);
      if (v.length >= 2) returned++;
      else { didnt++; if (names.length < 3) names.push(m.name || m.full_name || 'Member'); }
    });
    return { returned, didnt, names };
  }, [allMemberships, checkIns, now]);
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
              <button onClick={() => openModal('message')} style={{ fontSize: 11, fontWeight: 600, color: T.red, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                Send follow-up <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Engagement split ───────────────────────────────────────────────────────────
function EngagementBreakdown({ monthCiPer, totalMembers, atRisk, setTab }) {
  const rows = [
    { label: 'Super active', sub: '12+ visits/mo', val: (monthCiPer || []).filter(v => v >= 12).length,          color: T.green },
    { label: 'Active',       sub: '4–11 visits',   val: (monthCiPer || []).filter(v => v >= 4 && v < 12).length, color: T.blue  },
    { label: 'Occasional',   sub: '1–3 visits',    val: (monthCiPer || []).filter(v => v >= 1 && v < 4).length,  color: T.amber },
    { label: 'At risk',      sub: '14+ days away', val: atRisk,                                                   color: T.red   },
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
    </div>
  );
}

// ── Recent Activity ────────────────────────────────────────────────────────────
function ActivityFeed({ recentActivity, now, avatarMap }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 16 }}>Recent Activity</div>
      {!recentActivity || recentActivity.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center' }}>
          <Activity style={{ width: 20, height: 20, color: T.text3, margin: '0 auto 8px', display: 'block' }} />
          <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>No activity yet</p>
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

// ── Member Growth ─────────────────────────────────────────────────────────────
// FIX: sparse data (1 bar) shows a placeholder instead of a broken-looking chart
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
        // FIX: don't show a single lonely bar — show a friendly placeholder
        <div style={{ height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: T.divider, gap: 6 }}>
          <div style={{ fontSize: 12, color: T.text3, fontWeight: 500 }}>Chart populates as data grows</div>
          <div style={{ fontSize: 11, color: T.text3 }}>Check back next month for trends</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.divider}` }}>
        {[
          { label: 'New',       value: newSignUps,                          color: newSignUps > 0 ? T.green : T.text3 },
          { label: 'Cancelled', value: cancelledEst,                        color: cancelledEst > 0 ? T.red : T.text3 },
          { label: 'Net',       value: `${newSignUps - cancelledEst >= 0 ? '+' : ''}${newSignUps - cancelledEst}`, color: newSignUps >= cancelledEst ? T.green : T.red },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? `1px solid ${T.divider}` : 'none' }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: T.text3, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
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
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Members checked in last 2 hours
  const inGymNow = checkIns.filter(c => {
    const diff = (now - new Date(c.check_in_date)) / 60000;
    return diff >= 0 && diff <= 120;
  }).length;

  const ciSub   = yesterdayCI === 0 ? (todayCI > 0 ? 'No prior data' : 'No check-ins yet') : todayVsYest > 0 ? `+${todayVsYest}% vs yesterday` : todayVsYest < 0 ? `${todayVsYest}% vs yesterday` : 'Same as yesterday';
  const ciTrend = yesterdayCI > 0 && todayVsYest > 0 ? 'up' : yesterdayCI > 0 && todayVsYest < 0 ? 'down' : null;

  // FIX: today's bar label matches chart X-axis format exactly for correct highlight
  const todayLabel = format(now, chartRange <= 7 ? 'EEE' : 'MMM d');
  const chartMax   = Math.max(...(chartDays || []).map(d => d.value), 1);

  // FIX: only expose 7D and 30D — 90D causes the platform to show "App Preview" watermark
  const RANGES = [{ val: 7, label: '7D' }, { val: 30, label: '30D' }];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, alignItems: 'start' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

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
            sub={`${retentionRate}% engagement`}
            subTrend={retentionRate >= 70 ? 'up' : retentionRate < 50 ? 'down' : null}
            // FIX: ring only when partial — 100% shows as empty circle, 0% shows as nothing
            ring={retentionRate > 5 && retentionRate < 98 ? retentionRate : null}
            ringColor={T.blue}
            sparkData={retentionRate <= 5 || retentionRate >= 98 ? sparkData : null}
            icon={UserPlus}
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

        {/* Check-in Activity */}
        <div style={{ padding: '20px 20px 16px', borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text1 }}>Check-in Activity</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Daily attendance</div>
            </div>
            {/* FIX: only 7D and 30D — 90D shows "App Preview" platform watermark */}
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
              <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
              <XAxis dataKey="day" tick={tickStyle} axisLine={false} tickLine={false} interval={chartRange <= 7 ? 0 : 4} />
              {/* FIX: Y-axis padded so bars don't touch ceiling on small datasets */}
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={28} allowDecimals={false} domain={[0, Math.max(chartMax + 1, 5)]} />
              <Tooltip content={<Tip unit=" check-ins" />} cursor={{ fill: `${T.blue}07` }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {(chartDays || []).map((entry, i) => (
                  // FIX: two tones only — today solid blue, others faded blue. No multi-shade effect.
                  <Cell key={i} fill={entry.day === todayLabel ? T.blue : `${T.blue}42`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Member Growth */}
        <MemberGrowthCard
          newSignUps={newSignUps} cancelledEst={cancelledEst}
          retentionRate={retentionRate} monthGrowthData={monthGrowthData}
        />

        {/* Drop-off Risk + Week-1 Return */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <RetentionBreakdown allMemberships={allMemberships} checkIns={checkIns} now={now} setTab={setTab} />
          <WeekOneReturn allMemberships={allMemberships} checkIns={checkIns} now={now} openModal={openModal} />
        </div>

        {/* Engagement + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <EngagementBreakdown monthCiPer={monthCiPer} totalMembers={totalMembers} atRisk={atRisk} setTab={setTab} />
          <ActivityFeed recentActivity={recentActivity} now={now} avatarMap={avatarMap} />
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Action Items */}
        <TodayActions
          atRisk={atRisk} checkIns={checkIns} allMemberships={allMemberships}
          posts={posts} challenges={challenges} now={now}
          openModal={openModal} setTab={setTab}
        />

        {/* Quick Actions */}
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

        {/* Monthly Snapshot */}
        <div style={{ padding: 20, borderRadius: 12, background: T.card, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 2 }}>Monthly Snapshot</div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 14 }}>{format(now, 'MMMM yyyy')}</div>
          <StatRow label="Total members"    value={totalMembers} />
          <StatRow label="Active this week" value={activeThisWeek}  valueColor={T.blue} />
          <StatRow label="New sign-ups"     value={newSignUps}       valueColor={newSignUps > 0 ? T.green : T.text1} />
          <StatRow label="Cancelled est."   value={cancelledEst}     valueColor={cancelledEst > 0 ? T.red : T.text3} />
          <StatRow label="At risk"          value={atRisk}           valueColor={atRisk > 0 ? T.red : T.green} />
          <StatRow label="Retention rate"   value={`${retentionRate}%`} valueColor={retentionRate >= 70 ? T.green : retentionRate >= 50 ? T.amber : T.red} />
          <StatRow label="Month change"     value={monthChangePct > 0 ? `+${monthChangePct}%` : `${monthChangePct}%`} valueColor={monthChangePct >= 0 ? T.green : T.red} last />
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

        {/* Smart nudges */}
        <SmartNudges
          atRisk={atRisk} challenges={challenges} polls={polls}
          monthChangePct={monthChangePct} openModal={openModal} setTab={setTab}
          checkIns={checkIns} allMemberships={allMemberships} now={now}
        />
      </div>
    </div>
  );
}