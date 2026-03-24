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

    // ── Fetch only the user's own data (no platform-wide .list() calls) ───────
    const [userGyms, userCheckIns, userMemberships, userLifts, userGoals, userNotifs, userFriends, userFriendsReverse] = await Promise.all([
      base44.asServiceRole.entities.Gym.filter({ admin_id: userId }),
      base44.asServiceRole.entities.CheckIn.filter({ user_id: userId }),
      base44.asServiceRole.entities.GymMembership.filter({ user_id: userId }),
      base44.asServiceRole.entities.Lift.filter({ member_id: userId }),
      base44.asServiceRole.entities.Goal.filter({ user_id: userId }),
      base44.asServiceRole.entities.Notification.filter({ user_id: userId }),
      base44.asServiceRole.entities.Friend.filter({ user_id: userId }),
      base44.asServiceRole.entities.Friend.filter({ friend_id: userId }),
    ]);

    // Also fetch gyms by owner_email (some owners may not have admin_id set)
    const userGymsByEmail = await base44.asServiceRole.entities.Gym.filter({ owner_email: userEmail });
    const allUserGyms = [...userGyms, ...userGymsByEmail.filter(g => !userGyms.find(x => x.id === g.id))];
    const allUserFriends = [...userFriends, ...userFriendsReverse.filter(f => !userFriends.find(x => x.id === f.id))];

    // Delete in parallel where safe
    await Promise.all([
      ...allUserGyms.map(g => base44.asServiceRole.entities.Gym.delete(g.id)),
      ...userCheckIns.map(c => base44.asServiceRole.entities.CheckIn.delete(c.id)),
      ...userMemberships.map(m => base44.asServiceRole.entities.GymMembership.delete(m.id)),
      ...userLifts.map(l => base44.asServiceRole.entities.Lift.delete(l.id)),
      ...userGoals.map(g => base44.asServiceRole.entities.Goal.delete(g.id)),
      ...userNotifs.map(n => base44.asServiceRole.entities.Notification.delete(n.id)),
      ...allUserFriends.map(f => base44.asServiceRole.entities.Friend.delete(f.id)),
    ]);

    // Finally, delete the User record itself — this revokes access
    await base44.asServiceRole.entities.User.delete(userId);

    console.log(`Account fully deleted for: ${userEmail}`);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});