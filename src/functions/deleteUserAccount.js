import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Delete all user-related data in parallel
    await Promise.all([
      // Delete check-ins
      base44.asServiceRole.entities.CheckIn.filter({ user_id: userId }).then(checkIns =>
        Promise.all(checkIns.map(c => base44.asServiceRole.entities.CheckIn.delete(c.id)))
      ),
      // Delete workout logs
      base44.asServiceRole.entities.WorkoutLog.filter({ user_id: userId }).then(logs =>
        Promise.all(logs.map(l => base44.asServiceRole.entities.WorkoutLog.delete(l.id)))
      ),
      // Delete lifts
      base44.asServiceRole.entities.Lift.filter({ member_id: userId }).then(lifts =>
        Promise.all(lifts.map(l => base44.asServiceRole.entities.Lift.delete(l.id)))
      ),
      // Delete posts
      base44.asServiceRole.entities.Post.filter({ member_id: userId }).then(posts =>
        Promise.all(posts.map(p => base44.asServiceRole.entities.Post.delete(p.id)))
      ),
      // Delete gym memberships
      base44.asServiceRole.entities.GymMembership.filter({ user_id: userId }).then(memberships =>
        Promise.all(memberships.map(m => base44.asServiceRole.entities.GymMembership.delete(m.id)))
      ),
      // Delete friends relationships
      base44.asServiceRole.entities.Friend.filter({ $or: [{ user_id: userId }, { friend_id: userId }] }).then(friends =>
        Promise.all(friends.map(f => base44.asServiceRole.entities.Friend.delete(f.id)))
      ),
      // Delete goals
      base44.asServiceRole.entities.Goal.filter({ user_id: userId }).then(goals =>
        Promise.all(goals.map(g => base44.asServiceRole.entities.Goal.delete(g.id)))
      ),
      // Delete messages
      base44.asServiceRole.entities.Message.filter({ $or: [{ sender_id: userId }, { receiver_id: userId }] }).then(messages =>
        Promise.all(messages.map(m => base44.asServiceRole.entities.Message.delete(m.id)))
      ),
      // Delete notifications
      base44.asServiceRole.entities.Notification.filter({ user_id: userId }).then(notifications =>
        Promise.all(notifications.map(n => base44.asServiceRole.entities.Notification.delete(n.id)))
      ),
      // Delete achievements
      base44.asServiceRole.entities.Achievement.filter({ user_id: userId }).then(achievements =>
        Promise.all(achievements.map(a => base44.asServiceRole.entities.Achievement.delete(a.id)))
      ),
      // Delete coach invites
      base44.asServiceRole.entities.CoachInvite.filter({ $or: [{ coach_id: userId }, { member_id: userId }] }).then(invites =>
        Promise.all(invites.map(i => base44.asServiceRole.entities.CoachInvite.delete(i.id)))
      ),
      // Delete assigned workouts
      base44.asServiceRole.entities.AssignedWorkout.filter({ member_id: userId }).then(workouts =>
        Promise.all(workouts.map(w => base44.asServiceRole.entities.AssignedWorkout.delete(w.id)))
      ),
    ]);

    return Response.json({ success: true, message: 'Account deleted. Please log out on the frontend.' });
  } catch (error) {
    console.error('Error deleting user account:', error.message);
    return Response.json({ error: 'Failed to delete account', details: error.message }, { status: 500 });
  }
});