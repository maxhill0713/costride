import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * migrateUserAccounts — Admin-only migration
 *
 * Upgrades old user accounts to the unified structure:
 * 1. account_type: 'user' (legacy init default) → 'personal'
 * 2. Ensures streak defaults exist (current_streak, previous_streak, streak_freezes)
 * 3. Ensures onboarding_completed is set (not undefined)
 *
 * Safe to run multiple times (idempotent).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list('created_date', 5000);
    const results = { account_type_fixed: 0, streak_defaults_set: 0, onboarding_flag_set: 0, skipped: 0, total: allUsers.length };

    for (const u of allUsers) {
      const updates = {};

      // 1. Normalize account_type: 'user' (legacy) → 'personal'
      if (u.account_type === 'user' || u.account_type === null || u.account_type === undefined) {
        // Only upgrade to 'personal' if they're not already a gym_owner/coach/staff
        const validTypes = ['personal', 'gym_owner', 'coach', 'staff'];
        if (!validTypes.includes(u.account_type)) {
          updates.account_type = 'personal';
          results.account_type_fixed++;
        }
      }

      // 2. Ensure streak defaults
      if ((u.current_streak === undefined || u.current_streak === null) && (u.streak !== undefined && u.streak !== null)) {
        // Migrate legacy 'streak' field → 'current_streak'
        updates.current_streak = u.streak;
        updates.previous_streak = u.previous_streak ?? 0;
        results.streak_defaults_set++;
      } else if (u.current_streak === undefined || u.current_streak === null) {
        updates.current_streak = 0;
        updates.previous_streak = 0;
        results.streak_defaults_set++;
      }

      if (u.streak_freezes === undefined || u.streak_freezes === null) {
        updates.streak_freezes = 3;
      }

      // 3. Ensure onboarding_completed is a boolean (not undefined)
      if (u.onboarding_completed === undefined || u.onboarding_completed === null) {
        // If they have a primary_gym_id or username, they likely completed onboarding
        updates.onboarding_completed = !!(u.primary_gym_id || u.username || u.workout_split);
        results.onboarding_flag_set++;
      }

      if (Object.keys(updates).length > 0) {
        await base44.asServiceRole.entities.User.update(u.id, updates);
        console.log(`Migrated user ${u.id} (${u.email}):`, Object.keys(updates).join(', '));
      } else {
        results.skipped++;
      }
    }

    console.log('Migration complete:', results);
    return Response.json({ success: true, results });
  } catch (error) {
    console.error('Migration error:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});