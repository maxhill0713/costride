import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { challengeId } = await req.json();

    if (!challengeId) {
      return Response.json({ error: 'Challenge ID required' }, { status: 400 });
    }

    const challenges = await base44.entities.Challenge.filter({ id: challengeId });
    if (challenges.length === 0) {
      return Response.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const challenge = challenges[0];
    const participants = challenge.participants || [];

    if (participants.includes(user.id)) {
      return Response.json({ error: 'Already participating' }, { status: 400 });
    }

    participants.push(user.id);
    const updated = await base44.entities.Challenge.update(challengeId, {
      participants
    });

    await base44.entities.ChallengeParticipant.create({
      challenge_id: challengeId,
      user_id: user.id,
      user_name: user.full_name,
      starting_streak: user.current_streak || 0,
      current_progress: 0,
      target_value: challenge.target_value,
      goal_type: challenge.goal_type,
      status: 'active',
      joined_date: new Date().toISOString()
    });

    return Response.json({ challenge: updated });
  } catch (error) {
    console.error('Error joining challenge:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});