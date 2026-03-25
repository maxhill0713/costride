import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. SDK version bumped.
// 2. Auth result was IGNORED — the function called base44.auth.me() but never checked
//    the return value. Any unauthenticated request passed through.
// 3. Used CheckIn.list() and Lift.list() with NO scope — returns all check-ins/lifts
//    platform-wide. Now scoped to gym_id (required), and uses asServiceRole consistently.
// 4. limit was taken from client with no cap — could be abused to dump all records.
//    Now capped at 50.
// 5. metric is validated against an allowlist.
// 6. Raw error.message suppressed.

const ALLOWED_METRICS = ['checkIns', 'totalWeight', 'personalRecords'];
const MAX_LIMIT = 50;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gym_id, limit: rawLimit = 20, metric = 'checkIns' } = await req.json();

    if (!gym_id || typeof gym_id !== 'string') {
      return Response.json({ error: 'gym_id is required' }, { status: 400 });
    }

    if (!ALLOWED_METRICS.includes(metric)) {
      return Response.json({ error: 'Invalid metric' }, { status: 400 });
    }

    const limit = Math.min(Math.max(parseInt(rawLimit) || 20, 1), MAX_LIMIT);

    // Verify the caller has access to this gym (is a member or owner)
    const [membership, gymRecord] = await Promise.all([
      base44.asServiceRole.entities.GymMembership.filter({ gym_id, user_id: user.id, status: 'active' }),
      base44.asServiceRole.entities.Gym.filter({ id: gym_id }),
    ]);
    if (!gymRecord.length) return Response.json({ error: 'Gym not found' }, { status: 404 });
    const gym = gymRecord[0];
    const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
    if (!isOwner && membership.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Date-scope all metrics: all-time leaderboards are inaccurate at scale (2000-record limit
    // covers days, not all time, for active gyms). 30-day rolling windows are accurate and useful.
    const ts = Date.now();
    const thirtyDaysAgo = new Date(ts - 30 * 86400000).toISOString();
    const ninetyDaysAgo = new Date(ts - 90 * 86400000).toISOString();

    let leaderboardData = [];

    if (metric === 'checkIns') {
      const checkIns = await base44.asServiceRole.entities.CheckIn.filter(
        { gym_id, check_in_date: { $gte: thirtyDaysAgo } }, '-check_in_date', 2000
      );
      const counts = {};
      checkIns.forEach(c => { counts[c.user_id] = (counts[c.user_id] || 0) + 1; });
      leaderboardData = Object.entries(counts)
        .map(([userId, value]) => ({ userId, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);

    } else if (metric === 'totalWeight') {
      const lifts = await base44.asServiceRole.entities.Lift.filter(
        { gym_id, lift_date: { $gte: thirtyDaysAgo } }, '-lift_date', 2000
      );
      const weights = {};
      lifts.forEach(l => { weights[l.member_id] = (weights[l.member_id] || 0) + (l.weight_lbs * (l.reps || 1)); });
      leaderboardData = Object.entries(weights)
        .map(([memberId, value]) => ({ memberId, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);

    } else if (metric === 'personalRecords') {
      const lifts = await base44.asServiceRole.entities.Lift.filter(
        { gym_id, is_pr: true, lift_date: { $gte: ninetyDaysAgo } }, '-lift_date', 2000
      );
      const prs = {};
      lifts.forEach(l => { prs[l.member_id] = (prs[l.member_id] || 0) + 1; });
      leaderboardData = Object.entries(prs)
        .map(([memberId, value]) => ({ memberId, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
    }

    return Response.json({ leaderboard: leaderboardData });
  } catch (error) {
    console.error('Error calculating leaderboards:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});