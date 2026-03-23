import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastAnimationDate = user.last_freeze_animation_shown;

    // Only allow animation once per day
    if (lastAnimationDate === today) {
      return Response.json({
        shouldShowAnimation: false,
        freezesLostCount: 0,
        currentFreezes: user.streak_freezes || 0,
      });
    }

    // Get training days configuration
    const trainingDays = user.training_days || [];
    if (trainingDays.length === 0) {
      return Response.json({
        shouldShowAnimation: false,
        freezesLostCount: 0,
        currentFreezes: user.streak_freezes || 0,
      });
    }

    // Check for missed workouts starting from yesterday, going back
    let missedCount = 0;
    let checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday

    // Look back up to 7 days to find missed workouts
    for (let i = 0; i < 7; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      // Check if this day is a training day
      if (trainingDays.includes(adjustedDay)) {
        // Check if there's a workout log for this day
        const logs = await base44.entities.WorkoutLog.filter({
          user_id: user.id,
          completed_date: dateStr,
        });

        if (logs.length === 0) {
          // No workout logged on this training day - it was missed
          missedCount++;
        } else {
          // Found a logged workout, stop checking further back
          break;
        }
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    // If there are missed workouts, consume freezes and show animation
    if (missedCount > 0) {
      const currentFreezes = user.streak_freezes || 0;
      const newFreezes = Math.max(0, currentFreezes - missedCount);

      // Update user: consume freezes and mark animation as shown
      await base44.auth.updateMe({
        streak_freezes: newFreezes,
        last_freeze_animation_shown: today,
      });

      return Response.json({
        shouldShowAnimation: true,
        freezesLostCount: missedCount,
        currentFreezes: newFreezes,
      });
    }

    return Response.json({
      shouldShowAnimation: false,
      freezesLostCount: 0,
      currentFreezes: user.streak_freezes || 0,
    });
  } catch (error) {
    console.error('Error checking missed workouts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});