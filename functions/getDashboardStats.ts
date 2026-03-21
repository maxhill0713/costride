import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { gymId, atRiskDays = 14, chartRange = 7 } = await req.json();
    if (!gymId) return Response.json({ error: 'gymId required' }, { status: 400 });

    const [checkIns, allMemberships, allUsers] = await Promise.all([
      base44.asServiceRole.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 2000),
      base44.asServiceRole.entities.GymMembership.filter({ gym_id: gymId, status: 'active' }),
      base44.asServiceRole.entities.User.list('-created_date', 300),
    ]);

    const now = new Date();
    const DAY = 86400000;
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const t7  = new Date(now - 7  * DAY);
    const t14 = new Date(now - 14 * DAY);
    const t30 = new Date(now - 30 * DAY);
    const t60 = new Date(now - 60 * DAY);
    const yesterdayStart = new Date(todayStart - DAY);

    const ci7      = checkIns.filter(c => new Date(c.check_in_date) >= t7);
    const ci30     = checkIns.filter(c => new Date(c.check_in_date) >= t30);
    const ciPrev30 = checkIns.filter(c => { const d = new Date(c.check_in_date); return d >= t60 && d < t30; });

    const todayCI     = checkIns.filter(c => new Date(c.check_in_date) >= todayStart).length;
    const yesterdayCI = checkIns.filter(c => { const d = new Date(c.check_in_date); return d >= yesterdayStart && d < todayStart; }).length;
    const todayVsYest = yesterdayCI > 0 ? Math.round(((todayCI - yesterdayCI) / yesterdayCI) * 100) : 0;

    const activeThisWeek  = new Set(ci7.map(c => c.user_id)).size;
    const activeLastWeek  = new Set(checkIns.filter(c => { const d = new Date(c.check_in_date); return d >= t14 && d < t7; }).map(c => c.user_id)).size;
    const activeThisMonth = new Set(ci30.map(c => c.user_id)).size;
    const totalMembers    = allMemberships.length;
    const retentionRate   = totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0;
    const weeklyChangePct = activeLastWeek > 0 ? Math.round(((activeThisWeek - activeLastWeek) / activeLastWeek) * 100) : 0;
    const monthChangePct  = ciPrev30.length > 0 ? Math.round(((ci30.length - ciPrev30.length) / ciPrev30.length) * 100) : 0;

    // ── Per-member accumulators (single pass each) ────────────────────────────
    const acc30 = {}, prevAcc = {}, totalAcc = {}, memberLastCheckIn = {};
    checkIns.forEach(c => {
      const d = new Date(c.check_in_date);
      totalAcc[c.user_id] = (totalAcc[c.user_id] || 0) + 1;
      if (!memberLastCheckIn[c.user_id] || d > new Date(memberLastCheckIn[c.user_id]))
        memberLastCheckIn[c.user_id] = c.check_in_date;
      if (d >= t30)          acc30[c.user_id]  = (acc30[c.user_id]  || 0) + 1;
      if (d >= t60 && d < t30) prevAcc[c.user_id] = (prevAcc[c.user_id] || 0) + 1;
    });
    const monthCiPer = Object.values(acc30);

    // ── Streak per member (single pass) ──────────────────────────────────────
    const byUser = {};
    checkIns.forEach(c => {
      if (!byUser[c.user_id]) byUser[c.user_id] = [];
      byUser[c.user_id].push(c.check_in_date);
    });
    const streakMap = {};
    Object.entries(byUser).forEach(([userId, dates]) => {
      const sorted = [...new Set(dates.map(d => {
        const dt = new Date(d); dt.setHours(0,0,0,0); return dt.getTime();
      }))].sort((a,b) => b - a);
      let streak = sorted.length > 0 ? 1 : 0, cur = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const diff = Math.round((cur - sorted[i]) / DAY);
        if (diff === 1) { streak++; cur = sorted[i]; } else if (diff > 1) break;
      }
      streakMap[userId] = streak;
    });

    // ── Enriched memberships ──────────────────────────────────────────────────
    const membersWithActivity = allMemberships.map(m => ({
      ...m,
      lastCheckIn:    memberLastCheckIn[m.user_id] || null,
      ci30Count:      acc30[m.user_id]    || 0,
      prevCi30Count:  prevAcc[m.user_id]  || 0,
      visitsTotal:    totalAcc[m.user_id] || 0,
      daysSince:      memberLastCheckIn[m.user_id]
                        ? Math.floor((now - new Date(memberLastCheckIn[m.user_id])) / DAY)
                        : null,
      streak:         streakMap[m.user_id] || 0,
    }));

    // At-risk
    const atRiskMembersData = membersWithActivity.filter(m => {
      const ds = m.daysSince;
      return ds === null || ds >= atRiskDays;
    });

    // Sign-ups
    const newSignUps     = allMemberships.filter(m => new Date(m.join_date || m.created_date || now) >= t30).length;
    const newSignUpsPrev = allMemberships.filter(m => { const d = new Date(m.join_date || m.created_date || now); return d >= t60 && d < t30; }).length;
    const cancelledEst   = Math.max(0, newSignUpsPrev - newSignUps);

    // Sparkline (7 days)
    const sparkData7 = Array.from({ length: 7 }, (_, i) => {
      const s = new Date(todayStart - (6 - i) * DAY);
      const e = new Date(s.getTime() + DAY);
      return checkIns.filter(c => { const d = new Date(c.check_in_date); return d >= s && d < e; }).length;
    });

    // 6-month growth
    const monthGrowthData = Array.from({ length: 6 }, (_, i) => {
      const end   = new Date(now - i * 30 * DAY);
      const start = new Date(end - 30 * DAY);
      const label = end.toLocaleDateString('en-GB', { month: 'short' });
      const value = new Set(checkIns.filter(c => { const d = new Date(c.check_in_date); return d >= start && d <= end; }).map(c => c.user_id)).size;
      return { label, value };
    }).reverse();

    // Peak hour (single entry - backward compat)
    const hourAccAll = {};
    checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAccAll[h] = (hourAccAll[h] || 0) + 1; });
    const peakEntry = Object.entries(hourAccAll).sort(([,a],[,b]) => b - a)[0];
    const peakLabel    = peakEntry ? (() => { const h = parseInt(peakEntry[0]); return h < 12 ? `${h || 12}AM` : `${h === 12 ? 12 : h - 12}PM`; })() : null;
    const peakEndLabel = peakEntry ? (() => { const h = parseInt(peakEntry[0]) + 1; return h < 12 ? `${h}AM` : `${h === 12 ? 12 : h - 12}PM`; })() : null;

    // Peak hours list (analytics tab)
    const hourMax = Math.max(...Object.values(hourAccAll), 1);
    const peakHours = Object.entries(hourAccAll).sort(([,a],[,b]) => b - a).slice(0, 8).map(([hour, count]) => {
      const h = parseInt(hour);
      return { label: h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`, count, pct: (count / hourMax) * 100 };
    });

    // Busiest days
    const dayAccAll = {};
    checkIns.forEach(c => { const d = new Date(c.check_in_date).getDay(); dayAccAll[d] = (dayAccAll[d] || 0) + 1; });
    const dayMax = Math.max(...Object.values(dayAccAll), 1);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const busiestDays = dayNames.map((name, idx) => ({
      name, count: dayAccAll[idx] || 0, pct: ((dayAccAll[idx] || 0) / dayMax) * 100,
    })).sort((a, b) => b.count - a.count);

    // Saturday vs average
    const satCI = checkIns.filter(c => new Date(c.check_in_date).getDay() === 6).length;
    const otherCI = checkIns.filter(c => new Date(c.check_in_date).getDay() !== 6).length;
    const weeks = Math.max(Math.ceil(checkIns.length / 7), 1);
    const satVsAvg = (otherCI / (weeks * 6)) > 0 ? Math.round(((satCI / weeks - otherCI / (weeks * 6)) / (otherCI / (weeks * 6))) * 100) : 0;

    // Chart days
    const days = chartRange <= 7 ? 7 : chartRange <= 30 ? 30 : 90;
    const chartDays = Array.from({ length: days }, (_, i) => {
      const d = new Date(todayStart.getTime() - (days - 1 - i) * DAY);
      const e = new Date(d.getTime() + DAY);
      const label = d.toLocaleDateString('en-GB', days <= 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' });
      const value = checkIns.filter(c => { const cd = new Date(c.check_in_date); return cd >= d && cd < e; }).length;
      return { day: label, value };
    });

    // 12-week trend (analytics tab)
    const weekTrend = Array.from({ length: 12 }, (_, i) => {
      const s = new Date(todayStart.getTime() - (11 - i) * 7 * DAY);
      const e = new Date(s.getTime() + 7 * DAY);
      const label = s.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      const value = checkIns.filter(c => { const d = new Date(c.check_in_date); return d >= s && d < e; }).length;
      return { label, value };
    });

    // Return rate & daily avg
    const returnRate = checkIns.length > 0 ? Math.round((checkIns.filter(c => !c.first_visit).length / checkIns.length) * 100) : 0;
    const dailyAvg   = Math.round(ci30.length / 30);

    // Engagement segments
    const superActive    = monthCiPer.filter(v => v >= 15).length;
    const activeSegment  = monthCiPer.filter(v => v >= 8 && v < 15).length;
    const casual         = monthCiPer.filter(v => v >= 1 && v < 8).length;
    const inactiveSegment = Math.max(0, totalMembers - monthCiPer.length);
    const engagementSegments = { superActive, active: activeSegment, casual, inactive: inactiveSegment };

    // ── Retention funnel ──────────────────────────────────────────────────────
    const w1Return = membersWithActivity.filter(m => {
      const joinDate = m.join_date || m.created_date;
      if (!joinDate) return false;
      const age = Math.floor((now - new Date(joinDate)) / DAY);
      return age >= 7 && (m.visitsTotal || 0) >= 2;
    }).length;
    const month1Active = membersWithActivity.filter(m => {
      const joinDate = m.join_date || m.created_date;
      if (!joinDate) return false;
      const age = Math.floor((now - new Date(joinDate)) / DAY);
      if (age < 30) return false;
      const jd = new Date(joinDate);
      const month1CI = checkIns.filter(c => {
        if (c.user_id !== m.user_id) return false;
        const d = new Date(c.check_in_date);
        return d >= jd && Math.floor((d - jd) / DAY) <= 30;
      }).length;
      return month1CI >= 4;
    }).length;
    const month3Retained = membersWithActivity.filter(m => {
      const joinDate = m.join_date || m.created_date;
      if (!joinDate) return false;
      const age = Math.floor((now - new Date(joinDate)) / DAY);
      return age >= 90 && (m.daysSince != null ? m.daysSince : 999) <= 21;
    }).length;
    const retentionFunnel = [
      { label: 'Joined',           val: totalMembers,    desc: 'Total members' },
      { label: 'Week-1 return',    val: w1Return,        desc: 'Came back in first week' },
      { label: 'Month-1 active',   val: month1Active,    desc: '4+ visits in first month' },
      { label: 'Month-3 retained', val: month3Retained,  desc: 'Still active at 3 months' },
    ];

    // ── Drop-off buckets ──────────────────────────────────────────────────────
    const dropOffBuckets = [
      { label: 'Week 1',     min: 0,  max: 14,   daysInactive: 7  },
      { label: 'Month 1',   min: 14, max: 30,   daysInactive: 7  },
      { label: 'Month 2',   min: 30, max: 60,   daysInactive: 14 },
      { label: 'Month 3',   min: 60, max: 90,   daysInactive: 14 },
      { label: '3+ months', min: 90, max: 9999, daysInactive: 21 },
    ].map(b => ({
      label: b.label,
      count: membersWithActivity.filter(m => {
        const joinDate = m.join_date || m.created_date;
        if (!joinDate) return false;
        const age = Math.floor((now - new Date(joinDate)) / DAY);
        if (age < b.min || age >= b.max) return false;
        return (m.daysSince != null ? m.daysSince : 999) >= b.daysInactive;
      }).length,
    }));

    // ── Churn signals (top 5 by score) ───────────────────────────────────────
    const churnSignals = membersWithActivity.map(m => {
      const ds    = m.daysSince != null ? m.daysSince : 999;
      const last30 = m.ci30Count    || 0;
      const prev30 = m.prevCi30Count || 0;
      const freqDrop = prev30 >= 4 && last30 < prev30 * 0.5;
      let score = 0;
      if (ds >= 7)  score += 20;
      if (ds >= 14) score += 30;
      if (ds >= 21) score += 30;
      if (freqDrop) score += 20;
      return { user_id: m.user_id, name: m.user_name || 'Member', daysSince: ds, freqDrop, score, last30, prev30 };
    }).filter(m => m.score >= 40).sort((a,b) => b.score - a.score).slice(0, 5);

    // ── Week-1 return trend (8 bi-weekly cohorts) ─────────────────────────────
    const week1ReturnTrend = Array.from({ length: 8 }, (_, i) => {
      const s = new Date(todayStart.getTime() - (7 - i) * 14 * DAY);
      const e = new Date(todayStart.getTime() - (6 - i) * 14 * DAY);
      const label = s.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
      const cohort = membersWithActivity.filter(m => {
        const jd = m.join_date || m.created_date;
        if (!jd) return false;
        const d = new Date(jd);
        return d >= s && d < e;
      });
      if (!cohort.length) return { label, pct: 0, total: 0 };
      const returned = cohort.filter(m => (m.visitsTotal || 0) >= 2).length;
      return { label, pct: Math.round((returned / cohort.length) * 100), total: cohort.length };
    });

    // ── Retention breakdown (for Overview tab) ────────────────────────────────
    const retentionBreakdown = { week1: 0, week2to4: 0, month2to3: 0, beyond: 0 };
    membersWithActivity.forEach(m => {
      const ds = m.daysSince != null ? m.daysSince : 999;
      if (ds < 7) return;
      const joinDate = m.join_date || m.created_date || m.created_at;
      if (!joinDate) return;
      const jd = Math.floor((now - new Date(joinDate)) / DAY);
      if      (ds >= 7  && jd <= 14) retentionBreakdown.week1++;
      else if (ds >= 7  && jd <= 30) retentionBreakdown.week2to4++;
      else if (ds >= 14 && jd <= 90) retentionBreakdown.month2to3++;
      else if (ds >= 21)             retentionBreakdown.beyond++;
    });

    // ── Week-1 return rate (for Overview WeekOneReturn) ───────────────────────
    const w1RateMembers = membersWithActivity.filter(m => {
      const joinDate = m.join_date || m.created_date || m.created_at;
      if (!joinDate) return false;
      const d = Math.floor((now - new Date(joinDate)) / DAY);
      return d >= 7 && d <= 21;
    });
    let w1Returned = 0, w1Didnt = 0; const w1Names = [];
    w1RateMembers.forEach(m => {
      if ((m.visitsTotal || 0) >= 2) w1Returned++;
      else { w1Didnt++; if (w1Names.length < 3) w1Names.push(m.user_name || 'Member'); }
    });
    const week1ReturnRate = { returned: w1Returned, didnt: w1Didnt, names: w1Names };

    // New members who haven't returned (for TodayActions signal)
    const newNoReturnCount = membersWithActivity.filter(m => {
      const joinDate = m.join_date || m.created_date || m.created_at;
      if (!joinDate) return false;
      const d = Math.floor((now - new Date(joinDate)) / DAY);
      return d >= 7 && d <= 14 && (m.visitsTotal || 0) < 2;
    }).length;

    // ── Streaks leaderboard (top 5) ───────────────────────────────────────────
    const streaks = Object.entries(streakMap)
      .map(([userId, streak]) => {
        const name = checkIns.find(c => c.user_id === userId)?.user_name || 'Member';
        return { name, userId, streak };
      })
      .sort((a,b) => b.streak - a.streak).slice(0, 5);

    // Recent activity
    const recentActivity = checkIns.slice(0, 8).map(c => ({
      name: c.user_name || 'Member', user_id: c.user_id,
      action: 'checked in', time: c.check_in_date, color: '#10b981',
    }));

    // Avatar map
    const avatarMap = {};
    allUsers.forEach(u => {
      const av = u.avatar_url || u.profile_picture || u.photo_url || null;
      if (av) avatarMap[u.id] = av;
    });

    // Lightweight recent check-ins for UI (last 300)
    const recentCheckIns = checkIns.slice(0, 300).map(c => ({
      id: c.id, user_id: c.user_id, user_name: c.user_name, check_in_date: c.check_in_date,
    }));

    return Response.json({
      // Core KPIs
      todayCI, yesterdayCI, todayVsYest,
      activeThisWeek, activeLastWeek, weeklyChangePct,
      activeThisMonth, totalMembers, retentionRate,
      monthChangePct, monthCiPer,
      newSignUps, newSignUpsPrev, cancelledEst,
      atRisk: atRiskMembersData.length,
      atRiskMembersData,
      membersWithActivity,
      memberLastCheckIn,
      sparkData7, monthGrowthData,
      peakLabel, peakEndLabel,
      peakEntry: peakEntry ? { hour: peakEntry[0], count: parseInt(peakEntry[1]) } : null,
      satVsAvg, chartDays, streaks, recentActivity,
      ci30Count: ci30.length, ciPrev30Count: ciPrev30.length,
      avatarMap, recentCheckIns,
      // Analytics pre-computed
      weekTrend, peakHours, busiestDays,
      returnRate, dailyAvg, engagementSegments,
      retentionFunnel, dropOffBuckets, churnSignals, week1ReturnTrend,
      // Overview pre-computed
      retentionBreakdown, week1ReturnRate, newNoReturnCount,
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});