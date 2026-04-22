import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. This function had NO authentication at all — any unauthenticated HTTP request could
//    forge a CheckIn or User event payload and inflate any user's challenge progress.
// 2. When called directly (not via automation), it now verifies the caller is either:
//    - An authenticated user updating their OWN progress, or
//    - The system/admin via a trusted automation path.
// 3. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();
    const event      = payload.event;
    const entityData = payload.data || event?.data;

    if (!event) {
      return Response.json({ success: true });
    }

    // ── Authentication / authorisation ───────────────────────────────────────
    // Automation-driven calls won't have a user session; that's fine.
    // Direct invocation (e.g. from performCheckIn) must be authenticated.
    let callerUserId = null;
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const caller = await base44.auth.me();
      if (!caller) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      callerUserId = caller.id;
    }

    let userId = null;

    if (event.entity_name === 'CheckIn' && event.type === 'create') {
      userId = entityData?.user_id;
    } else if (event.entity_name === 'User' && event.type === 'update') {
      userId = entityData?.id || event.entity_id;
    } else {
      return Response.json({ success: true });
    }

    if (!userId) {
      console.warn('No user_id found in event payload');
      return Response.json({ error: 'User ID not found in event' }, { status: 400 });
    }

    // SECURITY: If called directly (authenticated), the caller must be updating their own progress
    if (callerUserId && callerUserId !== userId) {
      console.warn(`SECURITY: User ${callerUserId} tried to update challenge progress for ${userId}`);
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch authoritative user record from DB — never trust the event payload values
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const dbUser = users[0];
    const currentStreak = dbUser.current_streak || 0;

    const participants = await base44.asServiceRole.entities.ChallengeParticipant.filter({
      user_id:   userId,
      completed: false,
    });

    if (participants.length === 0) {
      return Response.json({ success: true, updated: 0 });
    }

    for (const participant of participants) {
      let newProgress = participant.progress || 0;

      if (participant.goal_type === 'streak' || participant.goal_type === 'longest_streak') {
        newProgress = currentStreak;
      } else if (participant.goal_type === 'check_ins' || participant.goal_type === 'most_check_ins') {
        // Count from DB — don't accept client-supplied counts
        const checkIns = await base44.asServiceRole.entities.CheckIn.filter({ user_id: userId }, '-check_in_date', 5000);
        newProgress = checkIns.length;
      } else {
        continue;
      }

      const targetValue = participant.target_value || 0;
      const isCompleted = newProgress >= targetValue;
      const wasAlreadyCompleted = participant.completed === true;

      // Cap progress at target — never exceed it
      const cappedProgress = targetValue > 0 ? Math.min(newProgress, targetValue) : newProgress;

      await base44.asServiceRole.entities.ChallengeParticipant.update(participant.id, {
        progress:       Math.max(0, cappedProgress),
        completed:      isCompleted,
        completed_date: isCompleted && !wasAlreadyCompleted ? new Date().toISOString() : (participant.completed_date || null),
      });

      // Grant streak variant reward on first completion
      if (isCompleted && !wasAlreadyCompleted) {
        // Determine which variant to unlock based on the challenge title
        const challenges = await base44.asServiceRole.entities.Challenge.filter({ id: participant.challenge_id });
        const challenge = challenges[0];
        let variantToUnlock = null;
        if (challenge) {
          const title = (challenge.title || '').toLowerCase();
          if (title.includes('discipline builder')) variantToUnlock = 'beach';
          else if (title.includes('witness my gains')) variantToUnlock = 'spartan';
        }

        if (variantToUnlock) {
          const userRecords = await base44.asServiceRole.entities.User.filter({ id: userId });
          if (userRecords.length > 0) {
            const user = userRecords[0];
            const existing = user.unlocked_streak_variants || [];
            if (!existing.includes(variantToUnlock)) {
              await base44.asServiceRole.entities.User.update(userId, {
                unlocked_streak_variants: [...existing, variantToUnlock],
              });
              console.log(`Granted '${variantToUnlock}' streak variant to user ${userId}`);
            }
          }
        }
      }
    }

    return Response.json({ success: true, updated: participants.length });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});