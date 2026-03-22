import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Allow both scheduled (service role) and admin manual calls
  const isAuthenticated = await base44.auth.isAuthenticated();
  if (isAuthenticated) {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Work out yesterday's date and day-of-week (1=Mon, 7=Sun)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const rawDay = yesterday.getDay(); // 0=Sun
  const yesterdayDayKey = rawDay === 0 ? 7 : rawDay; // 1=Mon … 7=Sun

  console.log(`Processing missed workouts for ${yesterdayStr} (day key ${yesterdayDayKey})`);

  const allUsers = await base44.asServiceRole.entities.User.list();
  let processed = 0, freezeUsed = 0, streakReset = 0, skipped = 0;

  for (const user of allUsers) {
    const trainingDays = user.training_days || [];

    // Only act if yesterday was a planned training day
    if (!trainingDays.includes(yesterdayDayKey)) {
      skipped++;
      continue;
    }

    // Check if they logged a workout yesterday
    const logs = await base44.asServiceRole.entities.WorkoutLog.filter({
      user_id: user.id,
      completed_date: yesterdayStr,
    });

    if (logs.length > 0) {
      // Workout was logged — nothing to do
      skipped++;
      continue;
    }

    // Missed a planned day — apply freeze or reset
    const currentStreak = user.current_streak || 0;
    const streakFreezes = user.streak_freezes ?? 3; // default 3 for existing users

    if (streakFreezes > 0) {
      // Use a freeze: streak stays the same, freeze count decreases
      await base44.asServiceRole.entities.User.update(user.id, {
        streak_freezes: streakFreezes - 1,
      });
      console.log(`[${user.email}] Freeze used. Freezes remaining: ${streakFreezes - 1}. Streak stays at ${currentStreak}.`);
      freezeUsed++;
    } else {
      // No freezes left — reset streak
      await base44.asServiceRole.entities.User.update(user.id, {
        current_streak: 0,
      });
      console.log(`[${user.email}] No freezes left. Streak reset from ${currentStreak} to 0.`);
      streakReset++;
    }

    processed++;
  }

  console.log(`Done. Processed: ${processed}, Freezes used: ${freezeUsed}, Streaks reset: ${streakReset}, Skipped: ${skipped}`);

  return Response.json({
    date: yesterdayStr,
    dayKey: yesterdayDayKey,
    processed,
    freezeUsed,
    streakReset,
    skipped,
  });
});