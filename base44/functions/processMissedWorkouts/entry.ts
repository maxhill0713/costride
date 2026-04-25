import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Streak logic: a streak freeze is consumed (or streak reset) ONLY if the user
// logged ZERO workouts in the entire previous calendar week (Mon–Sun).
// Running daily but only acts when yesterday was a Sunday (end of week).

const MAX_USERS_PER_RUN = 500;

function isAuthorizedAutomation(req) {
  const secret = Deno.env.get('AUTOMATION_SECRET');
  if (!secret) return true;
  return req.headers.get('X-Automation-Secret') === secret;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const isAuthenticated = await base44.auth.isAuthenticated();
  if (isAuthenticated) {
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    if (!isAuthorizedAutomation(req)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDay = yesterday.getDay(); // 0 = Sunday

  // Only process at the end of the week (Sunday = day 0).
  // If yesterday wasn't Sunday, nothing to do yet.
  if (yesterdayDay !== 0) {
    console.log(`Yesterday was not Sunday (day ${yesterdayDay}). Skipping weekly streak check.`);
    return Response.json({ skipped: true, reason: 'not_end_of_week' });
  }

  // Calculate the Mon–Sun date range for last week (Mon = yesterday - 6, Sun = yesterday)
  const sunday = new Date(yesterday);
  const monday = new Date(sunday);
  monday.setDate(monday.getDate() - 6);

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const weekStart = fmt(monday);
  const weekEnd   = fmt(sunday);

  console.log(`Weekly streak check for ${weekStart} → ${weekEnd}`);

  const activeMemberships = await base44.asServiceRole.entities.GymMembership.filter(
    { status: 'active' }, '-created_date', MAX_USERS_PER_RUN
  );
  const uniqueUserIds = [...new Set(
    activeMemberships.map((m) => m.user_id).filter(Boolean)
  )];

  if (!uniqueUserIds.length) {
    return Response.json({ weekStart, weekEnd, processed: 0, freezeUsed: 0, streakReset: 0, skipped: 0 });
  }

  const allUsers = await base44.asServiceRole.entities.User.filter(
    { id: { $in: uniqueUserIds } }, 'full_name', MAX_USERS_PER_RUN
  );

  let processed = 0, freezeUsed = 0, streakReset = 0, skipped = 0;

  for (const user of allUsers) {
    try {
      if (user.deleted_at) { skipped++; continue; }

      // Check if the user logged at least one workout in the past week
      const logs = await base44.asServiceRole.entities.WorkoutLog.filter({
        user_id: user.id,
        completed_date: { $gte: weekStart, $lte: weekEnd },
      });

      if (logs.length > 0) {
        // User worked out at least once — streak is safe
        skipped++;
        continue;
      }

      // Zero workouts this week — consume a freeze or reset streak
      const currentStreak = user.current_streak || 0;
      const streakFreezes = user.streak_freezes ?? 3;

      if (streakFreezes > 0) {
        await base44.asServiceRole.entities.User.update(user.id, { streak_freezes: streakFreezes - 1 });
        console.log(`[${user.id}] Freeze used (missed week). Remaining: ${streakFreezes - 1}. Streak stays at ${currentStreak}.`);
        freezeUsed++;
      } else {
        await base44.asServiceRole.entities.User.update(user.id, {
          current_streak: 0,
          previous_streak: currentStreak > 0 ? currentStreak : (user.previous_streak || 0),
        });
        console.log(`[${user.id}] No freezes. Streak reset from ${currentStreak} to 0.`);
        streakReset++;
      }
      processed++;
    } catch (e) {
      console.error(`Error processing user ${user.id}:`, e.message);
    }
  }

  console.log(`Done. Processed: ${processed}, Freezes used: ${freezeUsed}, Streaks reset: ${streakReset}, Skipped: ${skipped}`);
  return Response.json({ weekStart, weekEnd, processed, freezeUsed, streakReset, skipped });
});