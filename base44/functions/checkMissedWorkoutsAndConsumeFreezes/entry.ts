import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Streak loss only happens if the user logged ZERO workouts in the previous
// calendar week (Mon–Sun). Checked once per day but only penalises at week end.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    if (user.last_freeze_animation_shown === today) {
      return Response.json({
        shouldShowAnimation: false,
        freezesLostCount: 0,
        currentFreezes: user.streak_freezes || 0,
      });
    }

    // Find the most recent Sunday (end of last week)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon …

    // Days since last Sunday
    const daysSinceLastSunday = dayOfWeek === 0 ? 7 : dayOfWeek;
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - daysSinceLastSunday);

    const lastMonday = new Date(lastSunday);
    lastMonday.setDate(lastSunday.getDate() - 6);

    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const weekStart = fmt(lastMonday);
    const weekEnd   = fmt(lastSunday);

    // Check if user has any workout logs in the previous week
    const logs = await base44.entities.WorkoutLog.filter({
      user_id: user.id,
      completed_date: { $gte: weekStart, $lte: weekEnd },
    });

    if (logs.length > 0) {
      // Worked out at least once last week — streak is safe
      return Response.json({
        shouldShowAnimation: false,
        freezesLostCount: 0,
        currentFreezes: user.streak_freezes || 0,
      });
    }

    // No workouts last week — consume a freeze or reset streak
    const currentFreezes = user.streak_freezes || 0;
    const newFreezes = Math.max(0, currentFreezes - 1);
    const freezesActuallyConsumed = currentFreezes - newFreezes;

    const updateData = { streak_freezes: newFreezes, last_freeze_animation_shown: today };

    if (newFreezes === 0 && currentFreezes === 0) {
      // Already out of freezes — reset streak
      if ((user.current_streak || 0) > 0) {
        updateData.previous_streak = user.current_streak;
        updateData.current_streak = 0;
      }
    }

    await base44.auth.updateMe(updateData);

    if (freezesActuallyConsumed > 0) {
      return Response.json({ shouldShowAnimation: true, freezesLostCount: freezesActuallyConsumed, currentFreezes: newFreezes });
    }
    return Response.json({ shouldShowAnimation: false, freezesLostCount: 0, currentFreezes: newFreezes });

  } catch (error) {
    console.error('Error checking missed workouts:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});