import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event } = await req.json();

    if (event.type !== 'create' || event.entity_name !== 'WorkoutLog') {
      return Response.json({ success: true });
    }

    const { user_id: userId } = event.data;

    // Fetch the user to get their current streak
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const currentStreak = users[0].current_streak || 0;

    // Find all active challenges for this user
    const participants = await base44.entities.ChallengeParticipant.filter({
      user_id: userId,
      status: 'active'
    });

    // Update progress for each active challenge
    for (const participant of participants) {
      let newProgress;
      
      if (participant.goal_type === 'longest_streak') {
        newProgress = currentStreak - participant.starting_streak;
      } else if (participant.goal_type === 'most_check_ins') {
        // Count check-ins since joining challenge
        const checkIns = await base44.entities.CheckIn.filter({
          user_id: userId,
          created_date: { $gte: participant.joined_date }
        });
        newProgress = checkIns.length;
      } else {
        continue; // Skip other goal types for now
      }

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