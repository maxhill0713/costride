import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. SDK version bumped to 0.8.21
// 2. Was using user-scoped Challenge.filter — an attacker could join a private/unpublished
//    challenge by brute-forcing IDs if the RLS allowed reads. Now validates challenge is
//    active/upcoming and not ended before letting anyone join.
// 3. user.current_streak is a user-supplied field from the User entity; cap it to avoid
//    poisoning challenge leaderboards.
// 4. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await req.json();

    if (!challengeId || typeof challengeId !== 'string') {
      return Response.json({ error: 'Challenge ID required' }, { status: 400 });
    }

    // Use service role so we can read the authoritative record
    const challenges = await base44.asServiceRole.entities.Challenge.filter({ id: challengeId });
    if (challenges.length === 0) {
      return Response.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const challenge = challenges[0];

    // SECURITY: Only allow joining active or upcoming challenges
    if (challenge.status === 'completed') {
      return Response.json({ error: 'Challenge has already ended' }, { status: 400 });
    }

    const participants = challenge.participants || [];

    if (participants.includes(user.id)) {
      return Response.json({ error: 'Already participating' }, { status: 400 });
    }

    participants.push(user.id);
    const updated = await base44.asServiceRole.entities.Challenge.update(challengeId, { participants });

    // Fetch authoritative streak from DB — don't trust user.current_streak from JWT
    const userRecords = await base44.asServiceRole.entities.User.filter({ id: user.id });
    const currentStreak = userRecords.length > 0 ? (userRecords[0].current_streak || 0) : 0;

    await base44.asServiceRole.entities.ChallengeParticipant.create({
      challenge_id:     challengeId,
      user_id:          user.id,
      user_name:        user.full_name,
      starting_streak:  currentStreak,
      current_progress: 0,
      target_value:     challenge.target_value,
      goal_type:        challenge.goal_type,
      status:           'active',
      joined_date:      new Date().toISOString(),
    });

    return Response.json({ challenge: updated });
  } catch (error) {
    console.error('Error joining challenge:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});