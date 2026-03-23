import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastAnimationDate = user.last_streak_loss_animation_shown;

    // Only allow animation once per day
    if (lastAnimationDate === today) {
      return Response.json({
        shouldShowAnimation: false,
        previousStreak: 0,
      });
    }

    // Check if streak was lost (current streak is 0 but we need to know what it was)
    const currentStreak = user.current_streak || 0;
    const previousStreak = user.previous_streak || 0;

    // Only show animation if streak was just lost
    if (currentStreak === 0 && previousStreak > 0) {
      // Update user to mark animation as shown
      await base44.auth.updateMe({
        last_streak_loss_animation_shown: today,
      });

      return Response.json({
        shouldShowAnimation: true,
        previousStreak: previousStreak,
      });
    }

    return Response.json({
      shouldShowAnimation: false,
      previousStreak: 0,
    });
  } catch (error) {
    console.error('Error checking streak loss:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});