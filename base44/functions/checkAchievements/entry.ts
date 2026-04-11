import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. Raw error.message suppressed.
// 3. Achievement.create used user-scoped entity — safe, but also added a guard so this
//    function can only be called for the authenticated user themselves (no userId param abuse).

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Cap data fetched to avoid large scans; achievements are checked incrementally
    const [lifts, checkIns, achievements] = await Promise.all([
      base44.entities.Lift.filter({ member_id: userId }, '-created_date', 500),
      base44.entities.CheckIn.filter({ user_id: userId }, '-check_in_date', 500),
      base44.entities.Achievement.filter({ user_id: userId }),
    ]);

    const existingTypes = new Set(achievements.map(a => a.achievement_type));
    const newAchievements = [];

    const checks = [
      {
        type:  'first_pr',
        check: () => lifts.some(l => l.is_pr) && !existingTypes.has('first_pr'),
        data:  { title: 'First PR', description: 'Achieved your first personal record', icon: '🎯', points: 50 },
      },
      {
        type:  'streak_7',
        check: () => checkIns.length >= 7 && !existingTypes.has('streak_7'),
        data:  { title: '7 Day Warrior', description: 'Maintain a 7-day check-in streak', icon: '🔥', points: 100 },
      },
      {
        type:  'streak_30',
        check: () => checkIns.length >= 30 && !existingTypes.has('streak_30'),
        data:  { title: 'Monthly Master', description: 'Maintain a 30-day check-in streak', icon: '⚡', points: 250 },
      },
      {
        type:  '100_lifts',
        check: () => lifts.length >= 100 && !existingTypes.has('100_lifts'),
        data:  { title: 'Century Champion', description: 'Log 100 lifts', icon: '💪', points: 500 },
      },
    ];

    for (const check of checks) {
      if (check.check()) {
        const achievement = await base44.asServiceRole.entities.Achievement.create({
          user_id:          userId,
          user_name:        user.full_name,
          achievement_type: check.type,
          title:            check.data.title,
          description:      check.data.description,
          icon:             check.data.icon,
          points:           check.data.points,
        });
        newAchievements.push(achievement);
      }
    }

    return Response.json({ newAchievements });
  } catch (error) {
    console.error('Error checking achievements:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});