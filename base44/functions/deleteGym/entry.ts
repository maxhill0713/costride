import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// AUDIT LOGGING UTILITY
async function logAuditEvent(base44, event) {
  const auditLog = {
    action: event.action,
    user_id: event.user_id,
    user_email: event.user_email,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    status: event.status,
    reason: event.reason || null,
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify({ event: 'AUDIT', ...auditLog }));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymId } = await req.json();
    if (!gymId || typeof gymId !== 'string') {
      return Response.json({ error: 'gymId required and must be string' }, { status: 400 });
    }

    // Verify ownership before deleting
    const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gyms.length) {
      await logAuditEvent(base44, {
        action: 'gym_delete_attempt',
        user_id: user.id,
        user_email: user.email,
        resource_type: 'gym',
        resource_id: gymId,
        status: 'failure',
        reason: 'gym_not_found'
      });
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }

    const gym = gyms[0];
    const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      await logAuditEvent(base44, {
        action: 'gym_delete_attempt',
        user_id: user.id,
        user_email: user.email,
        resource_type: 'gym',
        resource_id: gymId,
        status: 'failure',
        reason: 'unauthorized'
      });
      return Response.json({ error: 'Forbidden: You do not own this gym' }, { status: 403 });
    }

    // Perform deletion
    await base44.asServiceRole.entities.Gym.delete(gymId);

    // Log successful deletion
    await logAuditEvent(base44, {
      action: 'gym_deleted',
      user_id: user.id,
      user_email: user.email,
      resource_type: 'gym',
      resource_id: gymId,
      status: 'success'
    });

    return Response.json({ success: true, message: `Gym ${gym.name} permanently deleted` });
  } catch (error) {
    console.error('deleteGym error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});