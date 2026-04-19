import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. Had NO authentication — any unauthenticated request could query leaderboard data
//    for any gym_id, including user names and IDs.
//    Now requires auth + membership/ownership verification.
// 2. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymId } = await req.json();
    if (!gymId || typeof gymId !== 'string') {
      return Response.json({ error: 'gymId required' }, { status: 400 });
    }

    // Verify gym exists and caller has access
    const gymRecord = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gymRecord.length) return Response.json({ error: 'Gym not found' }, { status: 404 });
    const gym = gymRecord[0];
    const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
    if (!isOwner && user.role !== 'admin') {
      const membership = await base44.asServiceRole.entities.GymMembership.filter({
        gym_id: gymId, user_id: user.id, status: 'active',
      });
      if (membership.length === 0) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const [checkIns, lifts, members] = await Promise.all([
      base44.asServiceRole.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 500),
      base44.asServiceRole.entities.Lift.filter({ gym_id: gymId }, '-lift_date', 300),
      base44.asServiceRole.entities.GymMembership.filter({ gym_id: gymId, status: 'active' }, 'user_name', 200),
    ]);

    // Build a userId -> display name map, resolving usernames over raw stored names
    // Pull User records for all unique user IDs so we can use display_name or full_name
    const uniqueUserIds = [...new Set([
      ...checkIns.map(c => c.user_id),
      ...lifts.map(l => l.member_id),
    ])].filter(Boolean);

    let userDisplayNames = {};
    try {
      // Fetch users in batches if needed — base44 supports filter by array
      const users = await base44.asServiceRole.entities.User.list('-created_date', 500);
      users.forEach(u => {
        if (u.id) userDisplayNames[u.id] = u.display_name || u.full_name || null;
      });
    } catch (_) { /* fallback to stored names */ }

    // Also use membership records as a fallback name source
    members.forEach(m => {
      if (m.user_id && !userDisplayNames[m.user_id]) {
        userDisplayNames[m.user_id] = m.user_name || null;
      }
    });

    const resolveName = (userId, fallback) => {
      const name = userDisplayNames[userId] || fallback || '';
      // Clean up email-based or username-based formats
      // e.g. "mottershead.matthew" → "Matthew Mottershead"
      // e.g. "john.smith@example.com" → "John Smith"
      let cleaned = name;
      if (cleaned.includes('@')) cleaned = cleaned.split('@')[0];
      if (cleaned.includes('.')) {
        // Split on dots, reverse and title case: "mottershead.matthew" → ["mottershead", "matthew"] → "Matthew Mottershead"
        const parts = cleaned.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
        return parts.reverse().join(' ');
      }
      // Already a normal name, just title case it
      return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };

    const now     = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const calcStreak = (dates) => {
      if (!dates.length) return 0;
      const sorted = dates.sort((a, b) => b - a);
      let streak = 1, cur = new Date(sorted[0]); cur.setHours(0, 0, 0, 0);
      for (let i = 1; i < sorted.length; i++) {
        const d = new Date(sorted[i]); d.setHours(0, 0, 0, 0);
        const diff = Math.floor((cur - d) / 86400000);
        if (diff === 1) { streak++; cur = d; } else if (diff > 1) break;
      }
      return streak;
    };

    const buildCheckInLeaderboard = (cutoffDate) => {
      const filtered = checkIns.filter(c => new Date(c.check_in_date) >= cutoffDate);
      return Object.values(
        filtered.reduce((acc, c) => {
          if (!acc[c.user_id]) acc[c.user_id] = { userId: c.user_id, userName: resolveName(c.user_id, c.user_name), count: 0 };
          acc[c.user_id].count++;
          return acc;
        }, {})
      ).sort((a, b) => b.count - a.count).slice(0, 20);
    };

    const buildStreakLeaderboard = (cutoffDate) => {
      const filtered = checkIns.filter(c => new Date(c.check_in_date) >= cutoffDate);
      const userMap = {};
      filtered.forEach(c => {
        if (!userMap[c.user_id]) userMap[c.user_id] = { userId: c.user_id, userName: resolveName(c.user_id, c.user_name), dates: [] };
        userMap[c.user_id].dates.push(new Date(c.check_in_date));
      });
      return Object.values(userMap)
        .map(item => ({ userId: item.userId, userName: item.userName, streak: calcStreak(item.dates) }))
        .sort((a, b) => b.streak - a.streak).slice(0, 20);
    };

    const checkInLeaderboardWeek = buildCheckInLeaderboard(weekAgo);
    const checkInLeaderboardMonth = buildCheckInLeaderboard(monthAgo);
    const checkInLeaderboardAllTime = buildCheckInLeaderboard(new Date(0));

    const streakLeaderboardWeek = buildStreakLeaderboard(weekAgo);
    const streakLeaderboardMonth = buildStreakLeaderboard(monthAgo);
    const streakLeaderboardAllTime = buildStreakLeaderboard(new Date(0));

    const buildProgressLeaderboard = (cutoffMs) => {
      const cutoff = cutoffMs ? new Date(now.getTime() - cutoffMs) : new Date(0);
      const userMaxWeights = {};
      lifts.filter(l => new Date(l.lift_date) >= cutoff).forEach(l => {
        const key = `${l.member_id}-${l.exercise}`;
        if (!userMaxWeights[key]) userMaxWeights[key] = { userId: l.member_id, userName: resolveName(l.member_id, l.member_name), exercise: l.exercise, maxWeight: l.weight_lbs, prevMax: 0 };
        if (l.weight_lbs > userMaxWeights[key].maxWeight) {
          userMaxWeights[key].prevMax = userMaxWeights[key].maxWeight;
          userMaxWeights[key].maxWeight = l.weight_lbs;
        }
      });
      return Object.values(userMaxWeights)
        .map(item => ({ userId: item.userId, userName: item.userName, increase: item.maxWeight - item.prevMax }))
        .filter(item => item.increase > 0)
        .reduce((acc, item) => {
          const ex = acc.find(a => a.userId === item.userId);
          if (ex) ex.increase += item.increase; else acc.push(item);
          return acc;
        }, [])
        .sort((a, b) => b.increase - a.increase).slice(0, 20);
    };

    return Response.json({
      checkInLeaderboardWeek,
      checkInLeaderboardMonth,
      checkInLeaderboardAllTime,
      streakLeaderboardWeek,
      streakLeaderboardMonth,
      streakLeaderboardAllTime,
      progressLeaderboardWeek:    buildProgressLeaderboard(7 * 86400000),
      progressLeaderboardMonth:   buildProgressLeaderboard(30 * 86400000),
      progressLeaderboardAllTime: buildProgressLeaderboard(null),
    });
  } catch (error) {
    console.error('getGymLeaderboards error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});