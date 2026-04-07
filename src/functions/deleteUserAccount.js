import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId = user.id;
    const body = await req.json().catch(() => ({}));

    // Admin can delete another user by email
    if (body.email && user.role === 'admin') {
      const users = await base44.asServiceRole.entities.User.filter({ email: body.email });
      if (!users || users.length === 0) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }
      userId = users[0].id;
    }

    // Helper to safely delete records sequentially to avoid rate limiting
    const safeDeleteSequential = async (entity, ids) => {
      for (const id of ids) {
        try {
          await entity.delete(id);
          // Small delay between deletes to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 10));
        } catch (err) {
          if (err.status !== 404) throw err;
        }
      }
    };

    // Delete all user-related data (sequential to avoid rate limiting)
    const entities = [
      { entity: base44.asServiceRole.entities.CheckIn, filter: { user_id: userId } },
      { entity: base44.asServiceRole.entities.WorkoutLog, filter: { user_id: userId } },
      { entity: base44.asServiceRole.entities.Lift, filter: { member_id: userId } },
      { entity: base44.asServiceRole.entities.Post, filter: { member_id: userId } },
      { entity: base44.asServiceRole.entities.GymMembership, filter: { user_id: userId } },
      { entity: base44.asServiceRole.entities.Friend, filter: { $or: [{ user_id: userId }, { friend_id: userId }] } },
      { entity: base44.asServiceRole.entities.Goal, filter: { user_id: userId } },
      { entity: base44.asServiceRole.entities.Message, filter: { $or: [{ sender_id: userId }, { receiver_id: userId }] } },
      { entity: base44.asServiceRole.entities.Notification, filter: { user_id: userId } },
      { entity: base44.asServiceRole.entities.Achievement, filter: { user_id: userId } },
      { entity: base44.asServiceRole.entities.CoachInvite, filter: { $or: [{ coach_id: userId }, { member_id: userId }] } },
      { entity: base44.asServiceRole.entities.AssignedWorkout, filter: { member_id: userId } },
    ];

    for (const { entity, filter } of entities) {
      const items = await entity.filter(filter);
      await safeDeleteSequential(entity, items.map(i => i.id));
    }

    return Response.json({ success: true, message: 'Account deleted. Please log out on the frontend.' });
  } catch (error) {
    console.error('Error deleting user account:', error.message);
    return Response.json({ error: 'Failed to delete account', details: error.message }, { status: 500 });
  }
});