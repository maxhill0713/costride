import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email;

    console.log(`Deleting account for user: ${userEmail} (${userId})`);

    // Delete user's gyms (as gym owner)
    const allGyms = await base44.asServiceRole.entities.Gym.list();
    const userGyms = allGyms.filter(g => g.admin_id === userId || g.owner_email === userEmail);
    for (const gym of userGyms) {
      await base44.asServiceRole.entities.Gym.delete(gym.id);
    }

    // Delete check-ins
    const allCheckIns = await base44.asServiceRole.entities.CheckIn.list();
    const userCheckIns = allCheckIns.filter(c => c.user_id === userId);
    for (const checkIn of userCheckIns) {
      await base44.asServiceRole.entities.CheckIn.delete(checkIn.id);
    }

    // Delete gym memberships
    const allMemberships = await base44.asServiceRole.entities.GymMembership.list();
    const userMemberships = allMemberships.filter(m => m.user_id === userId);
    for (const membership of userMemberships) {
      await base44.asServiceRole.entities.GymMembership.delete(membership.id);
    }

    // Delete lifts
    const allLifts = await base44.asServiceRole.entities.Lift.list();
    const userLifts = allLifts.filter(l => l.member_id === userId);
    for (const lift of userLifts) {
      await base44.asServiceRole.entities.Lift.delete(lift.id);
    }

    // Delete goals
    const allGoals = await base44.asServiceRole.entities.Goal.list();
    const userGoals = allGoals.filter(g => g.user_id === userId);
    for (const goal of userGoals) {
      await base44.asServiceRole.entities.Goal.delete(goal.id);
    }

    // Delete notifications
    const allNotifs = await base44.asServiceRole.entities.Notification.list();
    const userNotifs = allNotifs.filter(n => n.user_id === userId);
    for (const notif of userNotifs) {
      await base44.asServiceRole.entities.Notification.delete(notif.id);
    }

    // Delete friends
    const allFriends = await base44.asServiceRole.entities.Friend.list();
    const userFriends = allFriends.filter(f => f.user_id === userId || f.friend_id === userId);
    for (const friend of userFriends) {
      await base44.asServiceRole.entities.Friend.delete(friend.id);
    }

    // Finally, delete the User record itself — this revokes access
    await base44.asServiceRole.entities.User.delete(userId);

    console.log(`Account fully deleted for: ${userEmail}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});