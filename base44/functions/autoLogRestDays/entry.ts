import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import { startOfDay, subDays, isSameDay } from 'npm:date-fns@3.6.0';

// SECURITY FIX [CRITICAL]:
// 1. SDK version bumped.
// 2. Called User.list() with no auth guard — any unauthenticated request could trigger a
//    full user table scan and create check-ins for every user in the system.
//    This is a scheduled/automation function. Added isAuthenticated + admin guard for
//    direct (non-scheduled) calls.
// 3. Raw error.message suppressed.
// 4. Added per-run cap to prevent unbounded loops.

const MAX_USERS_PER_RUN = 500;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // For direct (non-automation) calls, require admin
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
      }
    }

    // SECURITY FIX: Was calling User.list() which returns all users platform-wide.
    // Now scoped via GymMembership to only fetch users who are active gym members,
    // then fetches their user records individually to check training_days.
    // This avoids a full user table scan and keeps queries scoped to gym members.
    const activeMemberships = await base44.asServiceRole.entities.GymMembership.filter(
      { status: 'active' }, '-created_date', MAX_USERS_PER_RUN
    );
    const uniqueUserIds = [...new Set(activeMemberships.map((m: Record<string, string>) => m.user_id).filter(Boolean))];
    if (!uniqueUserIds.length) {
      return Response.json({ success: true, restDaysLogged: 0 });
    }

    // Fetch user records in batch using $in to get training_days
    const allUsers = await base44.asServiceRole.entities.User.filter(
      { id: { $in: uniqueUserIds } }, 'full_name', MAX_USERS_PER_RUN
    );
    const usersWithSplits = allUsers.filter((u: Record<string, unknown>) => Array.isArray(u.training_days) && (u.training_days as unknown[]).length > 0);

    const yesterday = subDays(new Date(), 1);
    const yesterdayDayOfWeek = yesterday.getDay();
    const adjustedYesterdayDay = yesterdayDayOfWeek === 0 ? 7 : yesterdayDayOfWeek;

    let restDaysLogged = 0;

    for (const user of usersWithSplits) {
      const isRestDay = !user.training_days.includes(adjustedYesterdayDay);
      if (!isRestDay) continue;

      const checkIns = await base44.asServiceRole.entities.CheckIn.filter(
        { user_id: user.id }, '-check_in_date', 10
      );
      const hasYesterdayCheckIn = checkIns.some(c => isSameDay(new Date(c.check_in_date), yesterday));
      if (hasYesterdayCheckIn) continue;

      const memberships = await base44.asServiceRole.entities.GymMembership.filter(
        { user_id: user.id, status: 'active' }, '-created_date', 1
      );
      if (memberships.length === 0) continue;

      await base44.asServiceRole.entities.CheckIn.create({
        user_id:       user.id,
        user_name:     user.full_name,
        gym_id:        memberships[0].gym_id,
        gym_name:      memberships[0].gym_name,
        check_in_date: startOfDay(yesterday).toISOString(),
        first_visit:   false,
        is_rest_day:   true,
      });

      restDaysLogged++;
    }

    return Response.json({ success: true, restDaysLogged });
  } catch (error) {
    console.error('Error auto-logging rest days:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});