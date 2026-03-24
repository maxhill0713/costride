import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [CRITICAL]: Was calling Gym.list() — no arguments — scanning the ENTIRE
// gym table across all tenants. An attacker invoking this function could trigger a full
// table write reassigning admin_id on gyms they don't own (if filter logic were wrong).
// Now scoped to owner_email === user.email only, using admin-only guard.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only gym owners (account_type) or admins should call this
    if (user.role !== 'admin' && user.account_type !== 'gym_owner') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SECURITY: Filter strictly by the authenticated user's email only — never all gyms
    const userGyms = await base44.asServiceRole.entities.Gym.filter({ owner_email: user.email });

    let updated = 0;
    for (const gym of userGyms) {
      if (!gym.admin_id || gym.admin_id !== user.id) {
        await base44.asServiceRole.entities.Gym.update(gym.id, {
          admin_id:    user.id,
          owner_email: user.email,
        });
        updated++;
      }
    }

    return Response.json({
      success: true,
      gyms_updated: updated,
      message: `Linked ${updated} gym(s) to your account`,
    });
  } catch (error) {
    console.error('Error linking gym owner:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});