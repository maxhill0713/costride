import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. Called User.list() inside the handler with no per-run size cap.
//    Now capped at MAX_USERS_PER_RUN.
// 2. No try/catch around the outer loop body — added to prevent single-user errors
//    from aborting the entire run.
// (SDK already at 0.8.21, admin guard already in place)

const MAX_USERS_PER_RUN = 2000;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const isAuthenticated = await base44.auth.isAuthenticated();
  if (isAuthenticated) {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr    = yesterday.toISOString().split('T')[0];
  const rawDay          = yesterday.getDay();
  const yesterdayDayKey = rawDay === 0 ? 7 : rawDay;

  console.log(`Processing missed workouts for ${yesterdayStr} (day key ${yesterdayDayKey})`);

  const allUsers = await base44.asServiceRole.entities.User.list('full_name', MAX_USERS_PER_RUN);
  let processed = 0, freezeUsed = 0, streakReset = 0, skipped = 0;

  for (const user of allUsers) {
    try {
      const trainingDays = user.training_days || [];
      if (!trainingDays.includes(yesterdayDayKey)) { skipped++; continue; }

      const logs = await base44.asServiceRole.entities.WorkoutLog.filter({
        user_id:        user.id,
        completed_date: yesterdayStr,
      });
      if (logs.length > 0) { skipped++; continue; }

      const currentStreak  = user.current_streak  || 0;
      const streakFreezes  = user.streak_freezes ?? 3;

      if (streakFreezes > 0) {
        await base44.asServiceRole.entities.User.update(user.id, { streak_freezes: streakFreezes - 1 });
        console.log(`[${user.email}] Freeze used. Remaining: ${streakFreezes - 1}. Streak stays at ${currentStreak}.`);
        freezeUsed++;
      } else {
        await base44.asServiceRole.entities.User.update(user.id, { current_streak: 0 });
        console.log(`[${user.email}] No freezes. Streak reset from ${currentStreak} to 0.`);
        streakReset++;
      }
      processed++;
    } catch (e) {
      console.error(`Error processing user ${user.id}:`, e.message);
    }
  }

  console.log(`Done. Processed: ${processed}, Freezes used: ${freezeUsed}, Streaks reset: ${streakReset}, Skipped: ${skipped}`);
  return Response.json({ date: yesterdayStr, dayKey: yesterdayDayKey, processed, freezeUsed, streakReset, skipped });
});