import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, gymId, action } = await req.json();

    if (!memberId || !gymId || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is gym owner
    const gym = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (gym.length === 0 || gym[0].admin_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'ban') {
      const bannedMembers = gym[0].banned_members || [];
      if (!bannedMembers.includes(memberId)) {
        bannedMembers.push(memberId);
        await base44.asServiceRole.entities.Gym.update(gymId, {
          banned_members: bannedMembers
        });
      }
      return Response.json({ success: true });
    } else if (action === 'unban') {
      const bannedMembers = (gym[0].banned_members || []).filter(id => id !== memberId);
      await base44.asServiceRole.entities.Gym.update(gymId, {
        banned_members: bannedMembers
      });
      return Response.json({ success: true });
    } else if (action === 'remove') {
      const membership = await base44.entities.GymMembership.filter({
        user_id: memberId,
        gym_id: gymId
      });
      if (membership.length > 0) {
        await base44.entities.GymMembership.update(membership[0].id, {
          status: 'cancelled'
        });
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing member:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});