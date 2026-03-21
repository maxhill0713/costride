import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { gymId } = await req.json();

    if (!gymId) return Response.json({ error: 'gymId required' }, { status: 400 });

    // Fetch check-ins and lifts in parallel
    const [checkIns, lifts] = await Promise.all([
      base44.asServiceRole.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 500),
      base44.asServiceRole.entities.Lift.filter({ gym_id: gymId }, '-lift_date', 300),
    ]);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyCheckIns = checkIns.filter(c => new Date(c.check_in_date) >= weekAgo);

    // ── Check-in leaderboard ──────────────────────────────────────────────────
    const checkInLeaderboard = Object.values(
      weeklyCheckIns.reduce((acc, c) => {
        const id = c.user_id;
        if (!acc[id]) acc[id] = { userId: id, userName: c.user_name, count: 0 };
        acc[id].count++;
        return acc;
      }, {})
    ).sort((a, b) => b.count - a.count).slice(0, 10);

    // ── Streak leaderboard ────────────────────────────────────────────────────
    const userCheckInMap = checkIns.reduce((acc, c) => {
      if (!acc[c.user_id]) acc[c.user_id] = { userId: c.user_id, userName: c.user_name, dates: [] };
      acc[c.user_id].dates.push(new Date(c.check_in_date));
      return acc;
    }, {});

    const calcStreak = (dates) => {
      if (!dates.length) return 0;
      const sorted = dates.sort((a, b) => b - a);
      let streak = 1;
      let cur = new Date(sorted[0]); cur.setHours(0, 0, 0, 0);
      for (let i = 1; i < sorted.length; i++) {
        const d = new Date(sorted[i]); d.setHours(0, 0, 0, 0);
        const diff = Math.floor((cur - d) / 86400000);
        if (diff === 1) { streak++; cur = d; } else if (diff > 1) break;
      }
      return streak;
    };

    const streakLeaderboard = Object.values(userCheckInMap)
      .map(item => ({ userId: item.userId, userName: item.userName, streak: calcStreak(item.dates) }))
      .sort((a, b) => b.streak - a.streak).slice(0, 10);

    // ── Progress leaderboard ──────────────────────────────────────────────────
    const buildProgressLeaderboard = (cutoffMs) => {
      const cutoff = cutoffMs ? new Date(now.getTime() - cutoffMs) : new Date(0);
      const userMaxWeights = {};
      lifts
        .filter(l => new Date(l.lift_date) >= cutoff)
        .forEach(l => {
          const key = `${l.member_id}-${l.exercise}`;
          if (!userMaxWeights[key]) userMaxWeights[key] = { userId: l.member_id, userName: l.member_name, exercise: l.exercise, maxWeight: l.weight_lbs, prevMax: 0 };
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
        .sort((a, b) => b.increase - a.increase).slice(0, 10);
    };

    return Response.json({
      checkInLeaderboard,
      streakLeaderboard,
      progressLeaderboardWeek: buildProgressLeaderboard(7 * 86400000),
      progressLeaderboardMonth: buildProgressLeaderboard(30 * 86400000),
      progressLeaderboardAllTime: buildProgressLeaderboard(null),
    });
  } catch (error) {
    console.error('getGymLeaderboards error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});