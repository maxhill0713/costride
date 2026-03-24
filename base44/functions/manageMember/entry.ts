import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// AUDIT LOGGING UTILITY
async function logAuditEvent(base44, event) {
  const auditLog = {
    action: event.action,
    user_id: event.user_id,
    user_email: event.user_email,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    target_id: event.target_id || null,
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

    const { memberId, gymId, action } = await req.json();

    // Input validation
    if (!memberId || typeof memberId !== 'string' || !gymId || typeof gymId !== 'string' || !action || typeof action !== 'string') {
      return Response.json({ error: 'Missing or invalid required fields (memberId, gymId, action must be strings)' }, { status: 400 });
    }

    const validActions = ['ban', 'unban', 'remove'];
    if (!validActions.includes(action)) {
      return Response.json({ error: 'Invalid action. Must be: ban, unban, or remove' }, { status: 400 });
    }

    // Verify user is gym owner (check both admin_id and owner_email)
    const gymRecords = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gymRecords.length) {
      await logAuditEvent(base44, {
        action: 'member_manage_attempt',
        user_id: user.id,
        user_email: user.email,
        resource_type: 'gym',
        resource_id: gymId,
        target_id: memberId,
        status: 'failure',
        reason: 'gym_not_found'
      });
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }

    const gym = gymRecords[0];
    const isOwner = gym.admin_id === user.id || gym.owner_email === user.email;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      await logAuditEvent(base44, {
        action: 'member_manage_attempt',
        user_id: user.id,
        user_email: user.email,
        resource_type: 'gym',
        resource_id: gymId,
        target_id: memberId,
        status: 'failure',
        reason: 'unauthorized'
      });
      return Response.json({ error: 'Forbidden: You do not own this gym' }, { status: 403 });
    }

    // Prevent banning the gym owner
    if (action === 'ban' && (gym.admin_id === memberId || gym.owner_email === memberId)) {
      await logAuditEvent(base44, {
        action: 'member_ban_attempt',
        user_id: user.id,
        user_email: user.email,
        resource_type: 'gym',
        resource_id: gymId,
        target_id: memberId,
        status: 'failure',
        reason: 'cannot_ban_owner'
      });
      return Response.json({ error: 'Forbidden: Cannot ban gym owner' }, { status: 403 });
    }

    if (action === 'ban') {
      const bannedMembers = gym.banned_members || [];
      if (!bannedMembers.includes(memberId)) {
        bannedMembers.push(memberId);
        await base44.asServiceRole.entities.Gym.update(gymId, {
          banned_members: bannedMembers
        });
        await logAuditEvent(base44, {
          action: 'member_banned',
          user_id: user.id,
          user_email: user.email,
          resource_type: 'gym',
          resource_id: gymId,
          target_id: memberId,
          status: 'success'
        });
      }
      return Response.json({ success: true, message: 'Member banned successfully' });
    } else if (action === 'unban') {
      const bannedMembers = (gym.banned_members || []).filter(id => id !== memberId);
      await base44.asServiceRole.entities.Gym.update(gymId, {
        banned_members: bannedMembers
      });
      await logAuditEvent(base44, {
        action: 'member_unbanned',
        user_id: user.id,
        user_email: user.email,
        resource_type: 'gym',
        resource_id: gymId,
        target_id: memberId,
        status: 'success'
      });
      return Response.json({ success: true, message: 'Member unbanned successfully' });
    } else if (action === 'remove') {
      const membership = await base44.asServiceRole.entities.GymMembership.filter({
        user_id: memberId,
        gym_id: gymId
      });
      if (membership.length > 0) {
        await base44.asServiceRole.entities.GymMembership.update(membership[0].id, {
          status: 'cancelled'
        });
      }
      await logAuditEvent(base44, {
        action: 'member_removed',
        user_id: user.id,
        user_email: user.email,
        resource_type: 'gym',
        resource_id: gymId,
        target_id: memberId,
        status: 'success'
      });
      return Response.json({ success: true, message: 'Member removed successfully' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing member:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});