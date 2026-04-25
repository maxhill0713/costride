import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. Called User.list() — full platform user table scan.
//    FIXED: Replaced with GymMembership-scoped query. Only active gym members are processed.
// 2. No per-run size cap — added MAX_USERS_PER_RUN.
// 3. Automation bypass pattern retained (scheduled calls are unauthenticated by design);
//    admin check enforced for any authenticated caller.
// 4. try/catch around per-user loop body to prevent one bad user aborting the entire run.

const MAX_USERS_PER_RUN = 500;

function isAuthorizedAutomation(req: Request): boolean {
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
  const yesterdayStr    = yesterday.toISOString().split('T')[0];
  const rawDay          = yesterday.getDay();
  const yesterdayDayKey = rawDay === 0 ? 7 : rawDay;

  console.log(`Processing missed workouts for ${yesterdayStr} (day key ${yesterdayDayKey})`);

  // SECURITY FIX: Replaced User.list() (full platform scan) with GymMembership-scoped
  // query. Only active gym members are processed.
  const activeMemberships = await base44.asServiceRole.entities.GymMembership.filter(
    { status: 'active' }, '-created_date', MAX_USERS_PER_RUN
  );
  const uniqueUserIds = [...new Set(
    activeMemberships.map((m: Record<string, string>) => m.user_id).filter(Boolean)
  )];

  if (!uniqueUserIds.length) {
    return Response.json({ date: yesterdayStr, dayKey: yesterdayDayKey, processed: 0, freezeUsed: 0, streakReset: 0, skipped: 0 });
  }

  const allUsers = await base44.asServiceRole.entities.User.filter(
    { id: { $in: uniqueUserIds } }, 'full_name', MAX_USERS_PER_RUN
  );

  let processed = 0, freezeUsed = 0, streakReset = 0, skipped = 0;

  for (const user of allUsers) {
    try {
      // Skip users who are mid-deletion or have been marked as deleted
      if (user.deleted_at) { skipped++; continue; }

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
        console.log(`[${user.id}] Freeze used. Remaining: ${streakFreezes - 1}. Streak stays at ${currentStreak}.`);
        freezeUsed++;
      } else {
        // Save previous_streak before resetting so the client-side loss animation can detect it
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
  return Response.json({ date: yesterdayStr, dayKey: yesterdayDayKey, processed, freezeUsed, streakReset, skipped });
});