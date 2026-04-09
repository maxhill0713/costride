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

// Helper: delete records in batches
async function deleteAll(entity, records) {
  const BATCH = 50;
  for (let i = 0; i < records.length; i += BATCH) {
    await Promise.all(records.slice(i, i + BATCH).map(r => 
      entity.delete(r.id).catch(err => {
        // Ignore 404 errors (record already deleted or doesn't exist)
        if (err?.status !== 404) throw err;
      })
    ));
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

    console.log(`[deleteUserAccount] START — user: ${userEmail} (${userId}) at ${new Date().toISOString()}`);

    // ── STEP 1: Immediately mark account as deleted to prevent race conditions
    // (e.g. scheduled automations re-processing this user while deletion is in-flight)
    // NOTE: Do NOT touch onboarding_completed here — changing it prematurely causes the
    // frontend to redirect to Onboarding before the user has intentionally triggered that flow.
    await db.entities.User.update(userId, {
      deleted_at: new Date().toISOString(),
    });

    // ── STEP 2: Fetch all data owned by this user (strictly scoped to userId/userEmail)
    const [
      checkIns, memberships, lifts, goals, notifs,
      // friendsBy = Friend records where THIS user sent the request (their outbound side)
      // friendsTo = Friend records where THIS user is the friend_id (other users' records pointing TO us)
      //             These must also be deleted — otherwise other users have dangling friend references.
      friendsBy, friendsTo, posts, workoutLogs,
      messages, achievements, coachInvites, assignedWorkouts,
    ] = await Promise.all([
      fetchAll(db.entities.CheckIn,        { user_id: userId }),
      fetchAll(db.entities.GymMembership,  { user_id: userId }),
      fetchAll(db.entities.Lift,           { member_id: userId }),
      fetchAll(db.entities.Goal,           { user_id: userId }),
      fetchAll(db.entities.Notification,   { user_id: userId }),
      fetchAll(db.entities.Friend,         { user_id: userId }),
      fetchAll(db.entities.Friend,         { friend_id: userId }),
      fetchAll(db.entities.Post,           { member_id: userId }),
      fetchAll(db.entities.WorkoutLog,     { user_id: userId }),
      fetchAll(db.entities.Message,        { sender_id: userId }),
      fetchAll(db.entities.Achievement,    { user_id: userId }),
      fetchAll(db.entities.CoachInvite,    { member_id: userId }),
      fetchAll(db.entities.AssignedWorkout,{ member_id: userId }),
    ]);

    // Gyms owned by this user
    const [gymsByAdmin, gymsByEmail] = await Promise.all([
      fetchAll(db.entities.Gym, { admin_id: userId }),
      fetchAll(db.entities.Gym, { owner_email: userEmail }),
    ]);
    const gymIds = new Set(gymsByAdmin.map(g => g.id));
    const allGyms = [...gymsByAdmin, ...gymsByEmail.filter(g => !gymIds.has(g.id))];

    // Deduplicate friends — both sides
    const friendIdsSeen = new Set(friendsBy.map(f => f.id));
    const allFriends = [...friendsBy, ...friendsTo.filter(f => !friendIdsSeen.has(f.id))];

    console.log(`[deleteUserAccount] Queued for deletion:`);
    console.log(`  check-ins: ${checkIns.length}, memberships: ${memberships.length}, lifts: ${lifts.length}`);
    console.log(`  goals: ${goals.length}, notifications: ${notifs.length}, friend records: ${allFriends.length}`);
    console.log(`  posts: ${posts.length}, workout logs: ${workoutLogs.length}, gyms: ${allGyms.length}`);
    console.log(`  messages: ${messages.length}, achievements: ${achievements.length}`);
    console.log(`  NOTE: friendsTo (${friendsTo.length}) = records owned by OTHER users pointing to this account — these WILL be deleted to avoid dangling references`);

    // ── STEP 3: Delete all owned data
    await Promise.all([
      deleteAll(db.entities.CheckIn,        checkIns),
      deleteAll(db.entities.GymMembership,  memberships),
      deleteAll(db.entities.Lift,           lifts),
      deleteAll(db.entities.Goal,           goals),
      deleteAll(db.entities.Notification,   notifs),
      deleteAll(db.entities.Friend,         allFriends),
      deleteAll(db.entities.Post,           posts),
      deleteAll(db.entities.WorkoutLog,     workoutLogs),
      deleteAll(db.entities.Gym,            allGyms),
      deleteAll(db.entities.Message,        messages),
      deleteAll(db.entities.Achievement,    achievements),
      deleteAll(db.entities.CoachInvite,    coachInvites),
      deleteAll(db.entities.AssignedWorkout,assignedWorkouts),
    ]);

    // ── STEP 4: Full profile reset (preserves the User row for platform auth purposes)
    await db.entities.User.update(userId, {
      onboarding_completed: false,
      account_type: null,
      primary_gym_id: null,
      training_days: null,
      custom_workout_types: null,
      workout_split: null,
      custom_split_name: null,
      saved_splits: null,
      current_streak: 0,
      streak_freezes: 0,
      avatar_url: null,
      display_name: null,
      username: null,
      hero_image_url: null,
      gym_location: null,
      monthly_challenge_progress: null,
      unlocked_streak_variants: null,
      streak_variant: null,
      equipped_badges: null,
      // deleted_at cleared so account is fresh for re-onboarding
      deleted_at: null,
    });

    console.log(`[deleteUserAccount] COMPLETE — account fully reset for: ${userEmail} (${userId})`);
    return Response.json({ success: true });

  } catch (error) {
    console.error('Error deleting account:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});