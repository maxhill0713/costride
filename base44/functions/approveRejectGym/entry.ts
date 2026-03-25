import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY [CRITICAL FIX]:
// AdminGyms.jsx was calling base44.entities.Gym.update(id, { status }) directly from
// the browser with no server-side admin check. Any authenticated user who knew a gym
// ID could approve or reject any gym by calling the entity API directly.
// This function replaces that with a server-side admin-only gate.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Admin-only — gym approval/rejection must never be self-service.
    if (user.role !== 'admin') {
      console.warn(`SECURITY: Non-admin user ${user.email} tried to approve/reject a gym`);
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { gymId, status } = await req.json();

    if (!gymId || typeof gymId !== 'string') {
      return Response.json({ error: 'gymId is required' }, { status: 400 });
    }

    const VALID_STATUSES = ['approved', 'rejected'];
    if (!status || !VALID_STATUSES.includes(status)) {
      return Response.json({ error: 'status must be "approved" or "rejected"' }, { status: 400 });
    }

    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gyms.length) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }

    const updated = await base44.asServiceRole.entities.Gym.update(gymId, { status });

    console.log(JSON.stringify({
      event: 'AUDIT', action: `gym_${status}`,
      user_id: user.id, user_email: user.email,
      resource_type: 'gym', resource_id: gymId,
      status: 'success', timestamp: new Date().toISOString(),
    }));

    return Response.json({ gym: updated });
  } catch (error) {
    console.error('approveRejectGym error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});
