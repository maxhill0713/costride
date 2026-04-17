import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { gymId } = body;

    if (!gymId) {
      return Response.json({ error: 'gymId is required' }, { status: 400 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch everything in parallel using service role — bypasses RLS so new users see all gym data
    const [checkIns, achievements, posts, classes, challenges, events, rewards, polls] = await Promise.all([
      base44.asServiceRole.entities.CheckIn.filter(
        { gym_id: gymId, check_in_date: { $gte: thirtyDaysAgo } },
        '-check_in_date',
        200
      ),
      base44.asServiceRole.entities.Achievement.filter(
        { gym_id: gymId },
        '-created_date',
        100
      ),
      // No date filter on posts — new users should see ALL historic posts
      base44.asServiceRole.entities.Post.filter(
        { gym_id: gymId, is_hidden: false },
        '-created_date',
        100
      ),
      base44.asServiceRole.entities.GymClass.filter(
        { gym_id: gymId },
        'name',
        100
      ),
      base44.asServiceRole.entities.Challenge.filter(
        { gym_id: gymId, is_app_challenge: false },
        '-created_date',
        50
      ),
      base44.asServiceRole.entities.Event.filter(
        { gym_id: gymId },
        '-event_date',
        50
      ),
      base44.asServiceRole.entities.Reward.filter(
        { gym_id: gymId },
        'name',
        50
      ),
      base44.asServiceRole.entities.Poll.filter(
        { gym_id: gymId, status: 'active' },
        '-created_date',
        30
      ),
    ]);

    // Get all unique user IDs across check-ins and posts
    const allUserIds = [...new Set([
      ...checkIns.map(c => c.user_id),
      ...posts.map(p => p.member_id),
      ...achievements.map(a => a.user_id),
    ].filter(Boolean))].slice(0, 150);

    const userIds = allUserIds.slice(0, 50);

    let workoutLogs = [];
    let memberAvatars = {};

    const [workoutLogsResult, memberUsersResult] = await Promise.all([
      userIds.length > 0
        ? base44.asServiceRole.entities.WorkoutLog.filter(
            { user_id: { $in: userIds }, completed_date: { $gte: sevenDaysAgo } },
            '-created_date',
            200
          )
        : Promise.resolve([]),
      allUserIds.length > 0
        ? base44.asServiceRole.entities.User.filter({ id: { $in: allUserIds } }, null, 150)
        : Promise.resolve([]),
    ]);

    workoutLogs = workoutLogsResult;

    // Build avatar + name maps keyed by user ID — only expose public profile fields
    // Prefer display_name > username > full_name (full_name is often the email prefix)
    const memberNames = {};
    memberUsersResult.forEach(u => {
      const avatar = u.avatar_url || null;
      if (avatar) memberAvatars[u.id] = avatar;
      const name = u.display_name || u.username || u.full_name || null;
      if (name) memberNames[u.id] = name;
    });

    return Response.json({
      checkIns,
      workoutLogs,
      achievements,
      posts,
      classes,
      challenges,
      events,
      rewards,
      polls,
      memberAvatars,
      memberNames,
    });
  } catch (error) {
    console.error('getGymActivityFeed error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});