import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Helper: fetch ALL records matching a filter (handles pagination)
async function fetchAll(entity, filter) {
  const results = [];
  let skip = 0;
  const limit = 200;
  while (true) {
    const batch = await entity.filter(filter, '-created_date', limit, skip);
    results.push(...batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return results;
}

// Helper: delete records in batches to avoid overwhelming the API
async function deleteAll(entity, records) {
  const BATCH = 50;
  for (let i = 0; i < records.length; i += BATCH) {
    await Promise.all(records.slice(i, i + BATCH).map(r => entity.delete(r.id)));
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email;
    const db = base44.asServiceRole;

    console.log(`Deleting account for user: ${userEmail} (${userId})`);

    // Fetch all user data (paginated)
    const [
      checkIns, memberships, lifts, goals, notifs,
      friendsBy, friendsTo, posts, workoutLogs
    ] = await Promise.all([
      fetchAll(db.entities.CheckIn,       { user_id: userId }),
      fetchAll(db.entities.GymMembership, { user_id: userId }),
      fetchAll(db.entities.Lift,          { member_id: userId }),
      fetchAll(db.entities.Goal,          { user_id: userId }),
      fetchAll(db.entities.Notification,  { user_id: userId }),
      fetchAll(db.entities.Friend,        { user_id: userId }),
      fetchAll(db.entities.Friend,        { friend_id: userId }),
      fetchAll(db.entities.Post,          { member_id: userId }),
      fetchAll(db.entities.WorkoutLog,    { user_id: userId }),
    ]);

    // Gyms owned by this user (both by id and email)
    const [gymsByAdmin, gymsByEmail] = await Promise.all([
      fetchAll(db.entities.Gym, { admin_id: userId }),
      fetchAll(db.entities.Gym, { owner_email: userEmail }),
    ]);
    const gymIds = new Set(gymsByAdmin.map(g => g.id));
    const allGyms = [...gymsByAdmin, ...gymsByEmail.filter(g => !gymIds.has(g.id))];

    // Deduplicate friends
    const friendIdsSeen = new Set(friendsBy.map(f => f.id));
    const allFriends = [...friendsBy, ...friendsTo.filter(f => !friendIdsSeen.has(f.id))];

    console.log(`Deleting: ${checkIns.length} check-ins, ${memberships.length} memberships, ${lifts.length} lifts, ${goals.length} goals, ${notifs.length} notifications, ${allFriends.length} friend records, ${posts.length} posts, ${workoutLogs.length} workout logs, ${allGyms.length} gyms`);

    // Delete all data in parallel batches
    await Promise.all([
      deleteAll(db.entities.CheckIn,       checkIns),
      deleteAll(db.entities.GymMembership, memberships),
      deleteAll(db.entities.Lift,          lifts),
      deleteAll(db.entities.Goal,          goals),
      deleteAll(db.entities.Notification,  notifs),
      deleteAll(db.entities.Friend,        allFriends),
      deleteAll(db.entities.Post,          posts),
      deleteAll(db.entities.WorkoutLog,    workoutLogs),
      deleteAll(db.entities.Gym,           allGyms),
    ]);

    // Finally delete the User record itself
    await db.entities.User.delete(userId);

    console.log(`Account fully deleted for: ${userEmail}`);
    return Response.json({ success: true });

  } catch (error) {
    console.error('Error deleting account:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});