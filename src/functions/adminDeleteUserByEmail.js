import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only allow admin users to run this
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    // Find user by email
    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = users[0];
    const userId = targetUser.id;

    console.log(`Deleting account for ${email} (ID: ${userId})`);

    // Delete all user-related data in parallel
    await Promise.all([
      base44.asServiceRole.entities.CheckIn.filter({ user_id: userId }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.CheckIn.delete(i.id)))
      ),
      base44.asServiceRole.entities.WorkoutLog.filter({ user_id: userId }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.WorkoutLog.delete(i.id)))
      ),
      base44.asServiceRole.entities.Lift.filter({ member_id: userId }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.Lift.delete(i.id)))
      ),
      base44.asServiceRole.entities.Post.filter({ member_id: userId }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.Post.delete(i.id)))
      ),
      base44.asServiceRole.entities.GymMembership.filter({ user_id: userId }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.GymMembership.delete(i.id)))
      ),
      base44.asServiceRole.entities.Friend.filter({ $or: [{ user_id: userId }, { friend_id: userId }] }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.Friend.delete(i.id)))
      ),
      base44.asServiceRole.entities.Goal.filter({ user_id: userId }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.Goal.delete(i.id)))
      ),
      base44.asServiceRole.entities.Message.filter({ $or: [{ sender_id: userId }, { receiver_id: userId }] }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.Message.delete(i.id)))
      ),
      base44.asServiceRole.entities.Notification.filter({ user_id: userId }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.Notification.delete(i.id)))
      ),
      base44.asServiceRole.entities.Achievement.filter({ user_id: userId }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.Achievement.delete(i.id)))
      ),
      base44.asServiceRole.entities.CoachInvite.filter({ $or: [{ coach_id: userId }, { member_id: userId }] }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.CoachInvite.delete(i.id)))
      ),
      base44.asServiceRole.entities.AssignedWorkout.filter({ member_id: userId }).then(items =>
        Promise.all(items.map(i => base44.asServiceRole.entities.AssignedWorkout.delete(i.id)))
      ),
    ]);

    console.log(`Successfully deleted all data for ${email}`);
    return Response.json({ success: true, message: `Account ${email} fully deleted` });
  } catch (error) {
    console.error('Error deleting user:', error.message);
    return Response.json({ error: 'Deletion failed', details: error.message }, { status: 500 });
  }
});