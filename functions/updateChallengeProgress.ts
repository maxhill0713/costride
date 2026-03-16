import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Support both automation payload { event, data } and direct invocation { event: { type, entity_name, data } }
    const event = payload.event;
    const entityData = payload.data || event?.data;

    if (!event) {
      return Response.json({ success: true });
    }

    let userId = null;

    // Handle CheckIn events (check_ins challenge)
    if (event.entity_name === 'CheckIn' && event.type === 'create') {
      userId = entityData?.user_id;
    }
    // Handle User streak updates (streak challenge)
    else if (event.entity_name === 'User' && event.type === 'update') {
      userId = entityData?.id || event.entity_id;
    }
    else {
      return Response.json({ success: true });
    }

    if (!userId) {
      console.warn('No user_id found in event payload', JSON.stringify(payload));
      return Response.json({ error: 'User ID not found in event' }, { status: 400 });
    }

    // Fetch the user to get current streak and check-in count
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const currentStreak = user.current_streak || 0;

    // Find all active challenges for this user
    const participants = await base44.asServiceRole.entities.ChallengeParticipant.filter({
      user_id: userId,
      completed: false
    });

    if (participants.length === 0) {
      return Response.json({ success: true, updated: 0 });
    }

    // Update progress for each active challenge
    for (const participant of participants) {
      let newProgress = participant.progress || 0;

      // Streak challenge: use current streak
      if (participant.goal_type === 'streak' || participant.goal_type === 'longest_streak') {
        newProgress = currentStreak;
      }
      // Check-in challenge: count total check-ins
      else if (participant.goal_type === 'check_ins' || participant.goal_type === 'most_check_ins') {
        const checkIns = await base44.asServiceRole.entities.CheckIn.filter({ user_id: userId });
        newProgress = checkIns.length;
      }
      else {
        continue; // Skip other goal types
      }

      const isCompleted = newProgress >= (participant.target_value || 0);

      await base44.asServiceRole.entities.ChallengeParticipant.update(participant.id, {
        progress: Math.max(0, newProgress),
        completed: isCompleted,
        completed_date: isCompleted ? new Date().toISOString() : null
      });
    }

    return Response.json({ success: true, updated: participants.length });
  } catch (error) {
    console.error('Error updating challenge progress:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});