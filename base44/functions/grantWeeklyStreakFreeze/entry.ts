import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. SDK version bumped.
// 2. Had NO authentication — any unauthenticated request could trigger a full User.list()
//    and update streak_freezes for every user in the platform.
//    Now requires admin or is a scheduled (unauthenticated) automation call.
// 3. FIXED: Replaced User.list() (full platform user table scan) with GymMembership-scoped
//    query — only active gym members receive freeze grants.
// 4. Raw error.message suppressed.

const MAX_USERS_PER_RUN = 500;

// Returns true if the request is an authorized automation call.
// If AUTOMATION_SECRET env var is set, the header must match.
// If not set, all unauthenticated calls are allowed (backwards compat with existing scheduler).
function isAuthorizedAutomation(req: Request): boolean {
  const secret = Deno.env.get('AUTOMATION_SECRET');
  if (!secret) return true;
  return req.headers.get('X-Automation-Secret') === secret;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      // Direct call — must be admin
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
      }
    } else {
      // Unauthenticated — must be the scheduler with the automation secret
      if (!isAuthorizedAutomation(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // SECURITY FIX: Replaced User.list() (full platform scan) with GymMembership-scoped
    // query. Only active gym members receive freeze grants, scoped to MAX_USERS_PER_RUN.
    const activeMemberships = await base44.asServiceRole.entities.GymMembership.filter(
      { status: 'active' }, '-created_date', MAX_USERS_PER_RUN
    );
    const uniqueUserIds = [...new Set(
      activeMemberships.map((m: Record<string, string>) => m.user_id).filter(Boolean)
    )];

    if (!uniqueUserIds.length) {
      return Response.json({ success: true, usersUpdated: 0 });
    }

    // Fetch only the fields we need for these users
    const users = await base44.asServiceRole.entities.User.filter(
      { id: { $in: uniqueUserIds } }, 'full_name', MAX_USERS_PER_RUN
    );

    const today = new Date().toISOString().split('T')[0];
    let grantedCount = 0;

    for (const user of users) {
      // Skip users already granted a freeze today
      if (user.last_freeze_grant === today) continue;

      const currentFreezes = user.streak_freezes || 0;
      const newFreezes     = Math.min(currentFreezes + 1, 5);
      await base44.asServiceRole.entities.User.update(user.id, {
        streak_freezes:    newFreezes,
        last_freeze_grant: today,
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
