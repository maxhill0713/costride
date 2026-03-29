import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { gymId } = body;

    if (!gymId) {
      return Response.json({ error: 'gymId is required' }, { status: 400 });
    }

    // Use service role to bypass per-user RLS — all gym members should see the same feed
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch all data in parallel
    const [checkIns, achievements, gymMemberships] = await Promise.all([
      base44.asServiceRole.entities.CheckIn.filter(
        { gym_id: gymId, check_in_date: { $gte: thirtyDaysAgo } },
        '-check_in_date',
        200
      ),
      base44.asServiceRole.entities.Achievement.filter(
        { gym_id: gymId, created_date: { $gte: thirtyDaysAgo } },
        '-created_date',
        100
      ),
      base44.asServiceRole.entities.GymMembership.filter(
        { gym_id: gymId, status: 'active' },
        '-created_date',
        200
      ),
    ]);

    // Get unique user IDs from check-ins and memberships
    const userIds = [...new Set([
      ...checkIns.map(c => c.user_id),
      ...gymMemberships.map(m => m.user_id),
    ].filter(Boolean))].slice(0, 100);

    // Fetch workout logs for those users
    let workoutLogs = [];
    if (userIds.length > 0) {
      workoutLogs = await base44.asServiceRole.entities.WorkoutLog.filter(
        { user_id: { $in: userIds.slice(0, 50) }, completed_date: { $gte: sevenDaysAgo } },
        '-created_date',
        200
      );
    }

    return Response.json({
      checkIns,
      workoutLogs,
      achievements,
      memberUserIds: userIds,
    });
  } catch (error) {
    console.error('getGymActivityFeed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});