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
    const t7   = new Date(now - 7  * DAY);
    const t14  = new Date(now - 14 * DAY);
    const t30  = new Date(now - 30 * DAY);
    const t60  = new Date(now - 60 * DAY);
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

    // Per-member ci30 counts
    const acc30 = {};
    ci30.forEach(c => { acc30[c.user_id] = (acc30[c.user_id] || 0) + 1; });
    const monthCiPer = Object.values(acc30);

    // Last check-in per user
    const memberLastCheckIn = {};
    checkIns.forEach(c => {
      if (!memberLastCheckIn[c.user_id] || new Date(c.check_in_date) > new Date(memberLastCheckIn[c.user_id]))
        memberLastCheckIn[c.user_id] = c.check_in_date;
    });

    // Memberships enriched with activity info
    const membersWithActivity = allMemberships.map(m => ({
      ...m,
      lastCheckIn: memberLastCheckIn[m.user_id] || null,
      ci30Count: acc30[m.user_id] || 0,
      daysSince: memberLastCheckIn[m.user_id] ? Math.floor((now - new Date(memberLastCheckIn[m.user_id])) / DAY) : null,
    }));

    // At-risk
    const atRiskMembersData = membersWithActivity.filter(m => {
      const last = m.lastCheckIn;
      if (!last) return true;
      return Math.floor((now - new Date(last)) / DAY) >= atRiskDays;
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

    // Peak hour
    const hourAcc = {};
    checkIns.forEach(c => { const h = new Date(c.check_in_date).getHours(); hourAcc[h] = (hourAcc[h] || 0) + 1; });
    const peakEntry    = Object.entries(hourAcc).sort(([,a],[,b]) => b - a)[0];
    const peakLabel    = peakEntry ? (() => { const h = parseInt(peakEntry[0]); return h < 12 ? `${h || 12}AM` : `${h === 12 ? 12 : h - 12}PM`; })() : null;
    const peakEndLabel = peakEntry ? (() => { const h = parseInt(peakEntry[0]) + 1; return h < 12 ? `${h}AM` : `${h === 12 ? 12 : h - 12}PM`; })() : null;

    // Saturday vs other days
    const satCI   = checkIns.filter(c => new Date(c.check_in_date).getDay() === 6).length;
    const otherCI = checkIns.filter(c => new Date(c.check_in_date).getDay() !== 6).length;
    const weeks   = Math.max(Math.ceil(checkIns.length / 7), 1);
    const satAvg   = satCI   / weeks;
    const otherAvg = otherCI / (weeks * 6);
    const satVsAvg = otherAvg > 0 ? Math.round(((satAvg - otherAvg) / otherAvg) * 100) : 0;

    // Chart days
    const days = chartRange <= 7 ? 7 : chartRange <= 30 ? 30 : 90;
    const chartDays = Array.from({ length: days }, (_, i) => {
      const d = new Date(todayStart.getTime() - (days - 1 - i) * DAY);
      const e = new Date(d.getTime() + DAY);
      const label = d.toLocaleDateString('en-GB', days <= 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' });
      const value = checkIns.filter(c => { const cd = new Date(c.check_in_date); return cd >= d && cd < e; }).length;
      return { day: label, value };
    });

    // Streaks (top 5)
    const streakAcc = {};
    checkIns.forEach(c => {
      if (!streakAcc[c.user_name]) streakAcc[c.user_name] = new Set();
      const d = new Date(c.check_in_date); d.setHours(0, 0, 0, 0);
      streakAcc[c.user_name].add(d.getTime());
    });
    const streaks = Object.entries(streakAcc)
      .map(([name, ds]) => ({ name, streak: ds.size }))
      .sort((a, b) => b.streak - a.streak).slice(0, 5);

    // Recent activity (lightweight, last 8 check-ins)
    const recentActivity = checkIns.slice(0, 8).map(c => ({
      name: c.user_name || 'Member', user_id: c.user_id,
      action: 'checked in', time: c.check_in_date, color: '#10b981',
    }));

    // Avatar map (bulk user fetch — no N+1)
    const avatarMap = {};
    allUsers.forEach(u => {
      const av = u.avatar_url || u.profile_picture || u.photo_url || null;
      if (av) avatarMap[u.id] = av;
    });

    // Lightweight recent check-ins for coach/member tab UI (last 300)
    const recentCheckIns = checkIns.slice(0, 300).map(c => ({
      id: c.id, user_id: c.user_id, user_name: c.user_name, check_in_date: c.check_in_date,
    }));

    return Response.json({
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
    });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});