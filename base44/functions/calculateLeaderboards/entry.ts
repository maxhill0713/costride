import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me(); // Just check auth

    const { gym_id, limit = 50, metric = 'checkIns' } = await req.json();

    let leaderboardData = [];

    if (metric === 'checkIns') {
      const checkIns = await base44.entities.CheckIn.list('-check_in_date');
      const checkInCounts = {};
      
      checkIns.forEach(c => {
        if (!gym_id || c.gym_id === gym_id) {
          checkInCounts[c.user_id] = (checkInCounts[c.user_id] || 0) + 1;
        }
      });

      leaderboardData = Object.entries(checkInCounts)
        .map(([userId, count]) => ({ userId, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
    } else if (metric === 'totalWeight') {
      const lifts = await base44.entities.Lift.list();
      const weightByMember = {};
      
      lifts.forEach(l => {
        weightByMember[l.member_id] = (weightByMember[l.member_id] || 0) + (l.weight_lbs * (l.reps || 1));
      });

      leaderboardData = Object.entries(weightByMember)
        .map(([memberId, weight]) => ({ memberId, value: weight }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
    } else if (metric === 'personalRecords') {
      const lifts = await base44.entities.Lift.filter({ is_pr: true });
      const prsByMember = {};
      
      lifts.forEach(l => {
        prsByMember[l.member_id] = (prsByMember[l.member_id] || 0) + 1;
      });

      leaderboardData = Object.entries(prsByMember)
        .map(([memberId, prs]) => ({ memberId, value: prs }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
    }

    return Response.json({ leaderboard: leaderboardData });
  } catch (error) {
    console.error('Error calculating leaderboards:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});