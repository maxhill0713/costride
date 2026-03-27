import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [LOW]:
// 1. Raw error.message suppressed.
// (SDK already at 0.8.21, auth already correct, scoped to current user only)

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
        freezesLostCount:    0,
        currentFreezes:      user.streak_freezes || 0,
      });
    }

    const trainingDays = user.training_days || [];
    if (trainingDays.length === 0) {
      return Response.json({
        shouldShowAnimation: false,
        freezesLostCount:    0,
        currentFreezes:      user.streak_freezes || 0,
      });
    }

    let missedCount = 0;
    let checkDate   = new Date();
    checkDate.setDate(checkDate.getDate() - 1);

    for (let i = 0; i < 7; i++) {
      const dateStr      = checkDate.toISOString().split('T')[0];
      const dayOfWeek    = checkDate.getDay();
      const adjustedDay  = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (trainingDays.includes(adjustedDay)) {
        const logs = await base44.entities.WorkoutLog.filter({
          user_id:        user.id,
          completed_date: dateStr,
        });
        if (logs.length === 0) missedCount++;
        else break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (missedCount > 0) {
      const currentFreezes = user.streak_freezes || 0;
      const newFreezes     = Math.max(0, currentFreezes - missedCount);
      const freezesActuallyConsumed = currentFreezes - newFreezes;
      await base44.auth.updateMe({ streak_freezes: newFreezes, last_freeze_animation_shown: today });
      // Only show freeze animation if at least one freeze was actually consumed
      if (freezesActuallyConsumed > 0) {
        return Response.json({ shouldShowAnimation: true, freezesLostCount: freezesActuallyConsumed, currentFreezes: newFreezes });
      }
      return Response.json({ shouldShowAnimation: false, freezesLostCount: 0, currentFreezes: newFreezes });
    }

    return Response.json({ shouldShowAnimation: false, freezesLostCount: 0, currentFreezes: user.streak_freezes || 0 });
  } catch (error) {
    console.error('Error checking missed workouts:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});