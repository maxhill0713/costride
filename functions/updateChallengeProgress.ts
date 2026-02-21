import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event } = await req.json();

    if (event.type !== 'create' || event.entity_name !== 'CheckIn') {
      return Response.json({ success: true });
    }

    const checkInData = event.data;
    const userId = checkInData.user_id;

    // Get user's current streak
    const user = await base44.auth.me();
    if (!user || user.id !== userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentStreak = user.current_streak || 0;

    // Find all active streak challenges for this user
    const participants = await base44.entities.ChallengeParticipant.filter({
      user_id: userId,
      goal_type: 'longest_streak',
      status: 'active'
    });

    // Update progress for each active challenge
    for (const participant of participants) {
      const newProgress = currentStreak - participant.starting_streak;
      const isCompleted = newProgress >= participant.target_value;

      await base44.entities.ChallengeParticipant.update(participant.id, {
        current_progress: Math.max(0, newProgress),
        status: isCompleted ? 'completed' : 'active',
        completed_date: isCompleted ? new Date().toISOString() : null
      });
    }

    return Response.json({ success: true, updated: participants.length });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});