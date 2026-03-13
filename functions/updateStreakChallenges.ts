import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active challenge participants with streak goals
    const streakParticipants = await base44.asServiceRole.entities.ChallengeParticipant.filter({
      goal_type: 'streak'
    });

    let updated = 0;

    for (const participant of streakParticipants) {
      // Fetch the user to get current streak
      const users = await base44.asServiceRole.entities.User.filter({ id: participant.user_id });
      if (users.length === 0) continue;

      const currentStreak = users[0].current_streak || 0;
      const isCompleted = currentStreak >= participant.target_value;

      // Only update if progress changed
      if (participant.progress !== currentStreak || participant.completed !== isCompleted) {
        await base44.asServiceRole.entities.ChallengeParticipant.update(participant.id, {
          progress: currentStreak,
          completed: isCompleted,
          completed_date: isCompleted ? new Date().toISOString() : null
        });
        updated++;
      }
    }

    return Response.json({ success: true, updated });
  } catch (error) {
    console.error('Error updating streak challenges:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});