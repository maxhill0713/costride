import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, subDays } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowRight, Zap, Star,
  CheckCircle, Trophy, BarChart2, UserPlus, QrCode, MessageSquarePlus,
  Pencil, Calendar, Activity, Sparkles, MoreHorizontal, Users,
  AlertTriangle, Heart, Flame, Clock, Bell, ChevronRight, Target,
  Award, MessageCircle, RefreshCw, Eye, Shuffle, Shield
} from 'lucide-react';
import {
  Card, SectionTitle, Empty, Avatar, RingChart, Sparkline, ChartTip
} from './DashboardPrimitives';
import { StreakCelebrations, GymSetupChecklist, SmartNudges, CommunityHealthScore } from './OverviewWidgets';

// ── Custom tooltips ────────────────────────────────────────────────────────────
function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 10, padding: '9px 13px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p style={{ color: '#8ba0b8', fontSize: 10, fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
      <p style={{ color: '#38bdf8', fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value} check-ins</p>
    </div>
  );
}

function GrowthTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(6,12,24,0.97)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '9px 13px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p style={{ color: '#8ba0b8', fontSize: 10, fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
      <p style={{ color: '#10b981', fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value} active</p>
    </div>
  );
}

// ── Elevated KPI Card ──────────────────────────────────────────────────────────
function KpiCard({ label, value, valueSuffix, sub, subColor, subIcon: SubIcon, sparkData, sparkColor, ring, ringColor, accentColor, footerBar, gradient, icon: Icon }) {
  return (
    <div style={{
      borderRadius: 16, padding: '18px 20px 16px',
      background: gradient || 'var(--card)',
      border: `1px solid rgba(255,255,255,0.07)`,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: 0,
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
    }}>
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: accentColor || '#0ea5e9', opacity: 0.07, filter: 'blur(28px)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accentColor || '#0ea5e9'}18`, border: `1px solid ${accentColor || '#0ea5e9'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 13, height: 13, color: accentColor || '#0ea5e9' }}/>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--text1)', lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</span>
            {valueSuffix && <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)', letterSpacing: '-0.02em' }}>{valueSuffix}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7 }}>
            {SubIcon && <SubIcon style={{ width: 11, height: 11, color: subColor || 'var(--text2)' }}/>}
            <span style={{ fontSize: 11, fontWeight: 600, color: subColor || 'var(--text2)', lineHeight: 1.3 }}>{sub}</span>
          </div>
        </div>
        {ring != null ? (
          <RingChart pct={ring} size={52} stroke={5} color={ringColor || '#0ea5e9'}/>
        ) : sparkData ? (
          <Sparkline data={sparkData} color={accentColor || '#0ea5e9'}/>
        ) : null}
      </div>
      {footerBar != null && (
        <div style={{ marginTop: 6, height: 3, borderRadius: 99, background: `${accentColor || '#0ea5e9'}18`, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, footerBar)}%`, background: `linear-gradient(90deg, ${accentColor || '#10b981'}, ${accentColor ? accentColor + 'cc' : '#06b6d4'})`, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
        </div>
      )}
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: `linear-gradient(90deg, transparent, ${accentColor || '#0ea5e9'}50, transparent)`, pointerEvents: 'none' }}/>
    </div>
  );
}

// ── Retention Risk Breakdown ───────────────────────────────────────────────────
// Shows drop-off patterns: when members tend to go inactive
function RetentionRiskWidget({ allMemberships, checkIns, now, setTab }) {
  const risks = useMemo(() => {
    const buckets = { week1: 0, week2to4: 0, month2to3: 0, beyond: 0 };
    allMemberships.forEach(m => {
      const lastCI = checkIns
        .filter(c => c.user_id === m.user_id)
        .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      if (!lastCI) return;
      const daysSince = differenceInDays(now, new Date(lastCI.check_in_date));
      const joinedDaysAgo = differenceInDays(now, new Date(m.created_at || now));
      if (daysSince >= 7 && joinedDaysAgo <= 14) buckets.week1++;
      else if (daysSince >= 7 && joinedDaysAgo <= 30) buckets.week2to4++;
      else if (daysSince >= 14 && joinedDaysAgo <= 90) buckets.month2to3++;
      else if (daysSince >= 21) buckets.beyond++;
    });
    return buckets;
  }, [allMemberships, checkIns, now]);

  const total = Object.values(risks).reduce((a, b) => a + b, 0);
  const items = [
    { label: 'New & gone quiet', sub: 'Joined < 2 wks, no return', val: risks.week1, color: '#ef4444', icon: AlertTriangle },
    { label: 'Early drop-off', sub: 'Week 2–4 inactivity', val: risks.week2to4, color: '#f59e0b', icon: TrendingDown },
    { label: 'Month 2–3 slip', sub: 'Common churn window', val: risks.month2to3, color: '#fb923c', icon: Clock },
    { label: 'Long inactive', sub: '21+ days away', val: risks.beyond, color: '#94a3b8', icon: Users },
  ];

  return (
    <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.35), transparent)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Drop-off Risk Map</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Where members tend to go quiet</div>
        </div>
        <button onClick={() => setTab('members')} style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
          View all →
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: item.val > 0 ? `${item.color}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${item.val > 0 ? item.color + '20' : 'rgba(255,255,255,0.05)'}` }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <item.icon style={{ width: 12, height: 12, color: item.color }}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#d4e4f4' }}>{item.label}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>{item.sub}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: item.val > 0 ? item.color : '#334155', letterSpacing: '-0.03em' }}>{item.val}</div>
              <div style={{ fontSize: 9, color: '#475569' }}>{total > 0 ? Math.round((item.val / total) * 100) : 0}%</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── First Visit Follow-up Tracker ─────────────────────────────────────────────
// New members who did / didn't return in week 1
function FirstVisitTracker({ allMemberships, checkIns, now, openModal }) {
  const { returned, didnt, names } = useMemo(() => {
    const newMembers = allMemberships.filter(m => {
      const daysAgo = differenceInDays(now, new Date(m.created_at || now));
      return daysAgo >= 7 && daysAgo <= 21;
    });
    let returned = 0, didnt = 0;
    const names = [];
    newMembers.forEach(m => {
      const visits = checkIns.filter(c => c.user_id === m.user_id);
      if (visits.length >= 2) returned++;
      else {
        didnt++;
        if (names.length < 3) names.push(m.name || m.full_name || 'Member');
      }
    });
    return { returned, didnt, names };
  }, [allMemberships, checkIns, now]);

  const total = returned + didnt;
  const pct = total > 0 ? Math.round((returned / total) * 100) : 0;

  return (
    <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.35), transparent)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>Week-1 Return Rate</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>New members (joined 1–3 wks ago)</div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444', letterSpacing: '-0.04em' }}>{pct}%</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 60 ? 'linear-gradient(90deg,#10b981,#34d399)' : pct >= 40 ? 'linear-gradient(90deg,#f59e0b,#fcd34d)' : 'linear-gradient(90deg,#ef4444,#f87171)', borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: didnt > 0 ? 12 : 0 }}>
        <div style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>{returned}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Came back</div>
        </div>
        <div style={{ flex: 1, padding: '7px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>{didnt}</div>
          <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Didn't return</div>
        </div>
      </div>

      {didnt > 0 && names.length > 0 && (
        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, marginBottom: 4 }}>⚡ Needs follow-up</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{names.join(', ')}{didnt > 3 ? ` +${didnt - 3} more` : ''}</div>
          <button onClick={() => openModal('message')} style={{ marginTop: 7, fontSize: 10, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
            Send welcome nudge →
          </button>
        </div>
      )}
    </Card>
  );
}

// ── Referral Tracker ──────────────────────────────────────────────────────────
function ReferralTracker({ allMemberships, now }) {
  // Approximate: members joined in last 30 days with referral data
  // In real app this would use a referrals table; here we approximate from metadata
  const referred = useMemo(() => {
    return allMemberships.filter(m => m.referred_by || m.referral_source === 'member').length;
  }, [allMemberships]);

  const total = allMemberships.length;
  const pct = total > 0 ? Math.round((referred / total) * 100) : 0;

  // Top referrers (members who have referred others)
  const referrerCounts = useMemo(() => {
    const counts = {};
    allMemberships.forEach(m => {
      if (m.referred_by) {
        counts[m.referred_by] = (counts[m.referred_by] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }, [allMemberships]);

  return (
    <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.35), transparent)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>Member Referrals</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Who's growing your community</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#a78bfa', letterSpacing: '-0.04em' }}>{referred}</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>referred</span>
        </div>
      </div>

      {referrerCounts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Top advocates</div>
          {referrerCounts.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#a78bfa' }}>{i + 1}</div>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#d4e4f4' }}>{r.name}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa' }}>{r.count} brought in</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>No referral data tracked yet. Enable referral tracking in Settings.</div>
        </div>
      )}
    </Card>
  );
}

// ── Quiet Member Spotlight ────────────────────────────────────────────────────
// Members attending but not engaging socially — high churn risk
function QuietMemberSpotlight({ allMemberships, checkIns, posts, now, openModal }) {
  const quietMembers = useMemo(() => {
    const activeUserIds = new Set(
      checkIns
        .filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 30)
        .map(c => c.user_id)
    );
    const engagedUserIds = new Set(
      (posts || [])
        .filter(p => differenceInDays(now, new Date(p.created_at)) <= 30)
        .map(p => p.user_id)
    );
    return allMemberships
      .filter(m => activeUserIds.has(m.user_id) && !engagedUserIds.has(m.user_id))
      .slice(0, 4);
  }, [allMemberships, checkIns, posts, now]);

  return (
    <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.35), transparent)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>Quiet Members</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Active but not engaging — reach out</div>
        </div>
        <div style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fb923c' }}>{quietMembers.length}</span>
        </div>
      </div>

      {quietMembers.length === 0 ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>✓ Your community is well-engaged</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {quietMembers.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Avatar name={m.name || m.full_name || '?'} size={26}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#d4e4f4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || m.full_name}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>Attending but never posts</div>
                </div>
                <Eye style={{ width: 11, height: 11, color: '#fb923c', flexShrink: 0 }}/>
              </div>
            ))}
          </div>
          <button onClick={() => openModal('message')} style={{ marginTop: 10, width: '100%', fontSize: 11, fontWeight: 700, color: '#fb923c', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'center' }}>
            Send community invite →
          </button>
        </>
      )}
    </Card>
  );
}

// ── Class Loyalty Alert ───────────────────────────────────────────────────────
// Members locked to a single class/coach — dependency risk
function ClassLoyaltyAlert({ checkIns, classes, now, setTab }) {
  const loyal = useMemo(() => {
    const byMember = {};
    checkIns
      .filter(c => c.class_id && differenceInDays(now, new Date(c.check_in_date)) <= 60)
      .forEach(c => {
        if (!byMember[c.user_id]) byMember[c.user_id] = {};
        byMember[c.user_id][c.class_id] = (byMember[c.user_id][c.class_id] || 0) + 1;
      });

    return Object.entries(byMember)
      .filter(([, classMap]) => {
        const visits = Object.values(classMap);
        const total = visits.reduce((a, b) => a + b, 0);
        const max = Math.max(...visits);
        return total >= 4 && max / total >= 0.8;
      })
      .map(([userId, classMap]) => {
        const topClassId = Object.entries(classMap).sort((a, b) => b[1] - a[1])[0][0];
        const cls = (classes || []).find(c => String(c.id) === String(topClassId));
        return { userId, className: cls?.name || 'One class', visits: Object.values(classMap).reduce((a, b) => a + b, 0) };
      })
      .slice(0, 3);
  }, [checkIns, classes, now]);

  if (loyal.length === 0) return null;

  return (
    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(251,146,60,0.07)', border: '1px solid rgba(251,146,60,0.2)', marginTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Shield style={{ width: 12, height: 12, color: '#fb923c' }}/>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#fb923c' }}>Class Dependency Risk</span>
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>
        {loyal.length} member{loyal.length > 1 ? 's' : ''} only attend one class. If it changes, they may leave.
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {loyal.map((l, i) => (
          <div key={i} style={{ fontSize: 10, fontWeight: 600, color: '#fb923c', background: 'rgba(251,146,60,0.12)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(251,146,60,0.2)' }}>
            {l.className}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Waitlist Conversion ───────────────────────────────────────────────────────
function WaitlistConversionWidget({ classes, checkIns, now }) {
  const data = useMemo(() => {
    const waitlisted = (classes || []).filter(c => c.waitlist_count > 0);
    const totalWaiting = waitlisted.reduce((a, c) => a + (c.waitlist_count || 0), 0);
    const converted = waitlisted.filter(c => c.waitlist_converted > 0).reduce((a, c) => a + (c.waitlist_converted || 0), 0);
    const pct = totalWaiting > 0 ? Math.round((converted / totalWaiting) * 100) : 0;
    return { totalWaiting, converted, pct, count: waitlisted.length };
  }, [classes]);

  if (data.totalWaiting === 0) return null;

  return (
    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', marginBottom: 3 }}>⏳ Waitlist Conversion</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>{data.totalWaiting} waiting across {data.count} classes</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: data.pct >= 50 ? '#10b981' : '#f59e0b', letterSpacing: '-0.03em' }}>{data.pct}%</div>
          <div style={{ fontSize: 9, color: '#64748b' }}>converted</div>
        </div>
      </div>
    </div>
  );
}

// ── Streak Recovery Prompts ───────────────────────────────────────────────────
// Members who just broke a streak — prime re-engagement window
function StreakRecoveryWidget({ checkIns, allMemberships, now, openModal }) {
  const broken = useMemo(() => {
    return allMemberships
      .map(m => {
        const memberCIs = checkIns
          .filter(c => c.user_id === m.user_id)
          .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
        if (memberCIs.length < 3) return null;
        const daysSinceLast = differenceInDays(now, new Date(memberCIs[0].check_in_date));
        // Was consistent (streak) but just stopped 2–5 days ago
        const hadStreak = differenceInDays(new Date(memberCIs[0].check_in_date), new Date(memberCIs[2].check_in_date)) <= 10;
        if (daysSinceLast >= 2 && daysSinceLast <= 6 && hadStreak) {
          return { name: m.name || m.full_name || 'Member', daysSince: daysSinceLast };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 3);
  }, [allMemberships, checkIns, now]);

  if (broken.length === 0) return null;

  return (
    <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.35), transparent)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <Flame style={{ width: 14, height: 14, color: '#f59e0b' }}/>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8' }}>Streak Recovery</div>
          <div style={{ fontSize: 10, color: '#64748b' }}>Recently broke a streak — re-engage now</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {broken.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <Flame style={{ width: 12, height: 12, color: '#f59e0b', flexShrink: 0 }}/>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#d4e4f4' }}>{b.name}</span>
            <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>{b.daysSince}d gap</span>
          </div>
        ))}
      </div>
      <button onClick={() => openModal('message')} style={{ marginTop: 10, width: '100%', fontSize: 11, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'center' }}>
        Send encouragement →
      </button>
    </Card>
  );
}

// ── "What Should I Do Today?" Action Panel ────────────────────────────────────
function TodayActionPanel({ atRisk, newSignUps, checkIns, allMemberships, posts, challenges, now, openModal, setTab }) {
  const actions = useMemo(() => {
    const items = [];

    // Check for new members with no week-1 return
    const newNoReturn = allMemberships.filter(m => {
      const daysAgo = differenceInDays(now, new Date(m.created_at || now));
      if (daysAgo < 7 || daysAgo > 14) return false;
      return checkIns.filter(c => c.user_id === m.user_id).length < 2;
    });
    if (newNoReturn.length > 0) {
      items.push({
        priority: 1, color: '#ef4444', bg: 'rgba(239,68,68,0.1)',
        icon: UserPlus, label: `${newNoReturn.length} new member${newNoReturn.length > 1 ? 's' : ''} haven't returned after joining`,
        action: 'Follow up', fn: () => openModal('message'),
      });
    }

    // At-risk members
    if (atRisk > 0) {
      items.push({
        priority: 2, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
        icon: AlertTriangle, label: `${atRisk} member${atRisk > 1 ? 's' : ''} haven't visited in 14+ days`,
        action: 'Reach out', fn: () => setTab('members'),
      });
    }

    // No active challenge
    const activeChallenge = (challenges || []).find(c => !c.ended_at);
    if (!activeChallenge) {
      items.push({
        priority: 3, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
        icon: Trophy, label: 'No active challenge — engagement drops without one',
        action: 'Create', fn: () => openModal('challenge'),
      });
    }

    // No community post this week
    const recentPost = (posts || []).find(p => differenceInDays(now, new Date(p.created_at)) <= 7);
    if (!recentPost) {
      items.push({
        priority: 4, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',
        icon: MessageSquarePlus, label: 'No community post this week — keep your feed active',
        action: 'Post now', fn: () => openModal('post'),
      });
    }

    // Low today check-ins
    const todayCI = checkIns.filter(c => {
      const d = new Date(c.check_in_date);
      const t = now;
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    if (todayCI === 0 && now.getHours() >= 10) {
      items.push({
        priority: 5, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',
        icon: Activity, label: 'No check-ins recorded today — is the scanner working?',
        action: 'Check', fn: () => openModal('qrScanner'),
      });
    }

    return items.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }, [atRisk, newSignUps, checkIns, allMemberships, posts, challenges, now]);

  return (
    <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)', pointerEvents: 'none' }}/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Sparkles style={{ width: 14, height: 14, color: '#0ea5e9' }}/>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>What to do today</span>
      </div>
      {actions.length === 0 ? (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle style={{ width: 13, height: 13, color: '#10b981' }}/>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>All clear — your gym is thriving today!</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {actions.map((a, i) => (
            <div key={i} className="priority-row" onClick={a.fn}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', background: a.bg, border: `1px solid ${a.color}25`, transition: 'background 0.14s' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${a.color}20`, flexShrink: 0 }}>
                <a.icon style={{ width: 13, height: 13, color: a.color }}/>
              </div>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#d4e4f4', lineHeight: 1.4 }}>{a.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: a.color, whiteSpace: 'nowrap', padding: '3px 8px', borderRadius: 6, background: `${a.color}15`, border: `1px solid ${a.color}25`, flexShrink: 0 }}>
                {a.action} →
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Axis tick style ────────────────────────────────────────────────────────────
const tickStyle = { fill: '#64748b', fontSize: 10, fontFamily: 'DM Sans, system-ui' };

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

  // In the gym now: check-ins in last 2 hours
  const inGymNow = checkIns.filter(c => {
    const diff = (now - new Date(c.check_in_date)) / 60000;
    return diff >= 0 && diff <= 120;
  }).length;

  // Today's check-ins sub-label
  const ciSub = yesterdayCI === 0
    ? (todayCI > 0 ? 'No data yesterday' : 'No check-ins yet')
    : todayVsYest > 0
      ? `+${todayVsYest}% vs yesterday`
      : todayVsYest < 0
        ? `${todayVsYest}% vs yesterday`
        : 'Same as yesterday';

  const ciAccent = yesterdayCI === 0 ? '#64748b' : todayVsYest > 0 ? '#10b981' : todayVsYest < 0 ? '#ef4444' : '#64748b';
  const ciSubColor = ciAccent;
  const ciSubIcon = yesterdayCI > 0 && todayVsYest > 0 ? ArrowUpRight : yesterdayCI > 0 && todayVsYest < 0 ? TrendingDown : null;

  const growthSub = ciPrev30.length === 0
    ? 'No prior month data'
    : monthChangePct > 0 ? `+${monthChangePct}% vs last month`
    : monthChangePct < 0 ? `${monthChangePct}% vs last month`
    : 'Same as last month';

  const growthSubColor = monthChangePct > 0 ? '#34d399' : monthChangePct < 0 ? '#f87171' : '#64748b';
  const growthSubIcon = monthChangePct > 0 ? ArrowUpRight : monthChangePct < 0 ? TrendingDown : null;

  const todayLabel = format(now, chartRange <= 7 ? 'EEE' : 'MMM d');
  const chartMax = Math.max(...chartDays.map(d => d.value), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 18, alignItems: 'start' }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 14 }}>
          <KpiCard
            label="Today's Check-ins" value={todayCI}
            sub={ciSub} subColor={ciSubColor} subIcon={ciSubIcon}
            sparkData={sparkData} accentColor={ciAccent}
            footerBar={Math.min(100, (todayCI / Math.max(activeThisWeek / 7, 1)) * 100)}
            icon={Activity}
          />
          <KpiCard
            label="Active Members" value={activeThisWeek} valueSuffix={`/ ${totalMembers}`}
            sub={`${retentionRate}% engagement`} subColor="#38bdf8" subIcon={ArrowUpRight}
            ring={retentionRate} ringColor="#0ea5e9" accentColor="#0ea5e9" icon={UserPlus}
          />
          <KpiCard
            label="In the Gym Now" value={inGymNow}
            sub={inGymNow === 0 ? 'No recent check-ins' : 'Last 2 hours'}
            subColor={inGymNow > 0 ? '#34d399' : '#64748b'}
            subIcon={inGymNow > 0 ? Activity : null}
            sparkData={sparkData}
            accentColor={inGymNow > 0 ? '#10b981' : '#334155'}
            footerBar={totalMembers > 0 ? (inGymNow / totalMembers) * 100 : 0}
            icon={Users}
          />
          <KpiCard
            label="At-Risk Members" value={atRisk}
            sub={atRisk > 0 ? '14+ days inactive' : 'All members active'}
            subColor={atRisk > 0 ? '#f87171' : '#34d399'}
            subIcon={atRisk > 0 ? TrendingDown : CheckCircle}
            sparkData={[...sparkData].map((v, i, a) => Math.max(0, a[a.length - 1 - i])).reverse()}
            accentColor={atRisk > 0 ? '#ef4444' : '#10b981'}
            icon={Zap}
          />
        </div>

        {/* Check-ins bar chart */}
        <Card style={{ padding: '20px 20px 14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.35), transparent)', pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4f8' }}>Check-ins Over Time</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Daily attendance</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[7, 30, 90].map(r => (
                <button key={r} onClick={() => setChartRange(r)}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99, cursor: 'pointer', transition: 'all 0.15s',
                    background: chartRange === r ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
                    color: chartRange === r ? '#38bdf8' : '#64748b',
                    border: `1px solid ${chartRange === r ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  }}>
                  {r === 7 ? '7D' : r === 30 ? '30D' : '90D'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartDays} margin={{ top: 6, right: 8, left: 0, bottom: 0 }} barSize={chartRange <= 7 ? 24 : chartRange <= 30 ? 10 : 5}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="day" tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} interval={chartRange <= 7 ? 0 : chartRange <= 30 ? 4 : 13}/>
              <YAxis tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={28} allowDecimals={false}/>
              <Tooltip content={<BarTip/>} cursor={{ fill: 'rgba(56,189,248,0.06)' }}/>
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartDays.map((entry, i) => (
                  <Cell key={i} fill={entry.day === todayLabel ? '#38bdf8' : entry.value >= chartMax * 0.7 ? '#0ea5e9' : 'rgba(56,189,248,0.3)'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Waitlist conversion inline */}
          <WaitlistConversionWidget classes={classes} checkIns={checkIns} now={now}/>
        </Card>

        {/* Retention Risk Map */}
        <RetentionRiskWidget allMemberships={allMemberships} checkIns={checkIns} now={now} setTab={setTab}/>

        {/* Member Growth */}
        <Card style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 1, background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.35), transparent)', pointerEvents: 'none' }}/>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4f8', marginBottom: 4 }}>Member Growth</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#10b981', letterSpacing: '-0.04em' }}>+{newSignUps}</span>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>this month</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 10, fontWeight: 700, color: '#34d399' }}>
                {retentionRate}% retention
              </div>
              <div style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 10, fontWeight: 700, color: '#f87171' }}>
                {cancelledEst} cancelled
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={monthGrowthData} barSize={22} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="label" tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false}/>
              <YAxis tick={tickStyle} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={28} allowDecimals={false}/>
              <Tooltip content={<GrowthTip/>} cursor={{ fill: 'rgba(16,185,129,0.06)' }}/>
              <Bar dataKey="value" fill="url(#barGrad)" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, marginTop: 10, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'New Members', value: newSignUps, color: '#10b981', icon: ArrowUpRight },
              { label: 'Cancelled',   value: cancelledEst, color: '#ef4444', icon: TrendingDown },
              { label: 'Retention',   value: `${retentionRate}%`, color: '#38bdf8', icon: ArrowUpRight },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</span>
                  <s.icon style={{ width: 11, height: 11, color: s.color }}/>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Class loyalty alert inside growth card — dependency signal */}
          <ClassLoyaltyAlert checkIns={checkIns} classes={classes} now={now} setTab={setTab}/>
        </Card>

        {/* First Visit + Community Health */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <FirstVisitTracker allMemberships={allMemberships} checkIns={checkIns} now={now} openModal={openModal}/>
          <CommunityHealthScore checkIns={checkIns} challenges={challenges} posts={posts} allMemberships={allMemberships} now={now}/>
        </div>

        {/* Recent Activity + Quiet Members */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <Card style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent)', pointerEvents: 'none' }}/>
            <SectionTitle>Recent Activity</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentActivity.length === 0 && <Empty icon={Activity} label="No activity yet"/>}
              {recentActivity.slice(0, 5).map((a, i) => {
                const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
                const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` : `${Math.floor(minsAgo / 1440)}d ago`;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={a.name} size={30} src={avatarMap[a.user_id] || null}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#f0f4f8', lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 700 }}>{a.name}</span>
                        <span style={{ color: '#94a3b8' }}> {a.action}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{timeStr}</div>
                    </div>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0, boxShadow: `0 0 6px ${a.color}80` }}/>
                  </div>
                );
              })}
            </div>
          </Card>

          <QuietMemberSpotlight allMemberships={allMemberships} checkIns={checkIns} posts={posts} now={now} openModal={openModal}/>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* What to do today — replaces/expands Priorities */}
        <TodayActionPanel
          atRisk={atRisk} newSignUps={newSignUps} checkIns={checkIns}
          allMemberships={allMemberships} posts={posts} challenges={challenges}
          now={now} openModal={openModal} setTab={setTab}
        />

        {/* Original priorities (owner-defined) */}
        {priorities.length > 0 && (
          <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)', pointerEvents: 'none' }}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>Pinned Priorities</span>
              <MoreHorizontal style={{ width: 15, height: 15, color: '#64748b', cursor: 'pointer' }}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {priorities.map((p, i) => (
                <div key={i} className="priority-row" onClick={p.fn}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.14s' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.bg, flexShrink: 0 }}>
                    <p.icon style={{ width: 13, height: 13, color: p.color }}/>
                  </div>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#d4e4f4', lineHeight: 1.35 }}>{p.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.color, whiteSpace: 'nowrap', padding: '3px 8px', borderRadius: 6, background: `${p.color}15`, border: `1px solid ${p.color}25` }}>
                    {p.action} →
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.35), transparent)', pointerEvents: 'none' }}/>
          <SectionTitle>Quick Actions</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {[
              { icon: UserPlus,          label: 'Add Member',    color: '#0ea5e9', fn: () => openModal('members')   },
              { icon: QrCode,            label: 'Scan Check-in', color: '#10b981', fn: () => openModal('qrScanner') },
              { icon: Trophy,            label: 'New Challenge', color: '#f59e0b', fn: () => openModal('challenge') },
              { icon: MessageSquarePlus, label: 'Send Message',  color: '#a78bfa', fn: () => openModal('post')      },
              { icon: Pencil,            label: 'Post Update',   color: '#38bdf8', fn: () => openModal('post')      },
              { icon: Calendar,          label: 'Schedule Event',color: '#34d399', fn: () => openModal('event')     },
            ].map(({ icon: Icon, label, color, fn }, i) => (
              <button key={i} className="qa-btn" onClick={fn}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.14s', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 13, height: 13, color }}/>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#d4e4f4' }}>{label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Smart Nudges */}
        <SmartNudges atRisk={atRisk} challenges={challenges} polls={polls} monthChangePct={monthChangePct} openModal={openModal} setTab={setTab} checkIns={checkIns} allMemberships={allMemberships} now={now}/>

        {/* Streak Recovery */}
        <StreakRecoveryWidget checkIns={checkIns} allMemberships={allMemberships} now={now} openModal={openModal}/>

        {/* Referral Tracker */}
        <ReferralTracker allMemberships={allMemberships} now={now}/>

        {/* Gym Setup Checklist */}
        <GymSetupChecklist selectedGym={selectedGym} classes={classes} coaches={coaches} openModal={openModal}/>

        {/* Streak Celebrations */}
        <StreakCelebrations checkIns={checkIns} openModal={openModal} now={now}/>

        {/* Engagement Breakdown */}
        <Card style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 1, background: 'linear-gradient(90deg, transparent, rgba(14,165,233,0.35), transparent)', pointerEvents: 'none' }}/>
          <SectionTitle action={() => setTab('members')} actionLabel="All">Engagement</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Super Active', sub: '12+ visits',  val: monthCiPer.filter(v => v >= 12).length,          color: '#10b981', pct: totalMembers > 0 ? (monthCiPer.filter(v => v >= 12).length / totalMembers) * 100 : 0 },
              { label: 'Active',       sub: '4–11 visits', val: monthCiPer.filter(v => v >= 4 && v < 12).length, color: '#0ea5e9', pct: totalMembers > 0 ? (monthCiPer.filter(v => v >= 4 && v < 12).length / totalMembers) * 100 : 0 },
              { label: 'Quiet',        sub: '1–3 visits',  val: monthCiPer.filter(v => v >= 1 && v < 4).length,  color: '#f59e0b', pct: totalMembers > 0 ? (monthCiPer.filter(v => v >= 1 && v < 4).length / totalMembers) * 100 : 0 },
              { label: 'At Risk',      sub: '14+ days',    val: atRisk,                                           color: '#ef4444', pct: totalMembers > 0 ? (atRisk / totalMembers) * 100 : 0 },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#d4e4f4' }}>{s.label}</span>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500, marginLeft: 5 }}>{s.sub}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: s.color }}>{s.val}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: '#64748b' }}>{Math.round(s.pct)}%</span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.pct}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}99)`, borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
