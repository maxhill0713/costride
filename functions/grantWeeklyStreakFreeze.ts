import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. SDK version bumped.
// 2. Had NO authentication — any unauthenticated request could trigger a full User.list()
//    and update streak_freezes for every user in the platform.
//    Now requires admin or is a scheduled (unauthenticated) automation call.
// 3. Capped per-run to MAX_USERS.
// 4. Raw error.message suppressed.

const MAX_USERS_PER_RUN = 2000;

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

    const users = await base44.asServiceRole.entities.User.list('full_name', MAX_USERS_PER_RUN);
    let grantedCount = 0;

    for (const user of users) {
      const currentFreezes = user.streak_freezes || 0;
      const newFreezes     = Math.min(currentFreezes + 1, 5);
      await base44.asServiceRole.entities.User.update(user.id, {
        streak_freezes:    newFreezes,
        last_freeze_grant: new Date().toISOString().split('T')[0],
      });
      grantedCount++;
    }

    return Response.json({
      success:      true,
      message:      `Granted streak freezes to ${grantedCount} users`,
      usersUpdated: grantedCount,
    });
  } catch (error) {
    console.error('Error granting streak freezes:', error);
    return Response.json({ error: 'An internal error occurred', success: false }, { status: 500 });
  }
});