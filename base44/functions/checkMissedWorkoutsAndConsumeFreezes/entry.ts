import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

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

    const trainingDays = user.training_days || [];
    if (trainingDays.length === 0) {
      return Response.json({
        shouldShowAnimation: false,
        freezesLostCount: 0,
        currentFreezes: user.streak_freezes || 0,
      });
    }

    // Accept all swap/override data from the client (stored in localStorage, not available server-side)
    let restSwap = null;       // { fromDay, toDay } — moved today's workout to a future rest day
    let creditRestDay = null;  // dayNum — user used credit to make a training day a rest day
    let restDayOverride = null; // dayNum — user switched a rest day to a training day
    try {
      const body = await req.json();
      restSwap = body?.restSwap || null;
      creditRestDay = body?.creditRestDay || null;
      restDayOverride = body?.restDayOverride || null;
    } catch {}

    let missedCount = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1);

    for (let i = 0; i < 7; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      // Start with the base training schedule
      let isTrainingDay = trainingDays.includes(adjustedDay);

      // Apply rest swap: fromDay becomes rest, toDay becomes training
      if (restSwap) {
        if (adjustedDay === restSwap.fromDay) isTrainingDay = false;
        if (adjustedDay === restSwap.toDay) isTrainingDay = true;
      }

      // Apply credit rest: that training day was switched to rest
      if (creditRestDay && adjustedDay === creditRestDay) {
        isTrainingDay = false;
      }

      // Apply rest-day override: that rest day was switched to training
      if (restDayOverride && adjustedDay === restDayOverride) {
        isTrainingDay = true;
      }

      if (isTrainingDay) {
        const logs = await base44.entities.WorkoutLog.filter({
          user_id: user.id,
          completed_date: dateStr,
        });
        if (logs.length === 0) missedCount++;
        else break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    if (missedCount > 0) {
      const currentFreezes = user.streak_freezes || 0;
      const newFreezes = Math.max(0, currentFreezes - missedCount);
      const freezesActuallyConsumed = currentFreezes - newFreezes;
      
      const updateData = { streak_freezes: newFreezes, last_freeze_animation_shown: today };

      // If no freezes left, reset the streak and save previous_streak for the loss animation
      if (newFreezes === 0 && currentFreezes === 0) {
        // Already out of freezes — streak should be 0 already, but ensure previous_streak is saved
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
    }

    return Response.json({ shouldShowAnimation: false, freezesLostCount: 0, currentFreezes: user.streak_freezes || 0 });
  } catch (error) {
    console.error('Error checking missed workouts:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});