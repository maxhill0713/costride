import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [LOW]:
// 1. Raw error.message suppressed.
// (SDK already at 0.8.21, auth already correct)

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastAnimationDate = user.last_streak_loss_animation_shown;

    if (lastAnimationDate === today) {
      return Response.json({ shouldShowAnimation: false, previousStreak: 0 });
    }

    const currentStreak  = user.current_streak  || 0;
    const previousStreak = user.previous_streak || 0;

    if (currentStreak === 0 && previousStreak > 0) {
      await base44.auth.updateMe({ last_streak_loss_animation_shown: today });
      return Response.json({ shouldShowAnimation: true, previousStreak });
    }

    return Response.json({ shouldShowAnimation: false, previousStreak: 0 });
  } catch (error) {
    console.error('Error checking streak loss:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});