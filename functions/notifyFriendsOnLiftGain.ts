import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get the lift data from the automation event
    const body = await req.json();
    const newLift = body.data;
    
    if (!newLift) {
      return Response.json({ error: 'No lift data provided' }, { status: 400 });
    }

    // Get all previous lifts for this user and exercise
    const previousLifts = await base44.asServiceRole.entities.Lift.filter({
      member_id: newLift.member_id,
      exercise: newLift.exercise
    }, '-created_date');

    // Check if this is an improvement (higher weight than any previous lift)
    if (previousLifts.length > 1) { // More than 1 means there are previous lifts (current one is included)
      const previousBest = Math.max(...previousLifts.slice(1).map(l => l.weight_lbs));
      const weightGain = newLift.weight_lbs - previousBest;

      // Only notify if there's an actual gain
      if (weightGain > 0) {
        // Get the user's friends
        const friendships = await base44.asServiceRole.entities.Friend.filter({
          friend_id: newLift.member_id,
          status: 'accepted'
        });

        // Create notifications for each friend
        const notificationPromises = friendships.map(friendship => 
          base44.asServiceRole.entities.Notification.create({
            user_id: friendship.user_id,
            type: 'friend_achievement',
            title: `${newLift.member_name} leveled up! 💪`,
            message: `${newLift.member_name} just went up ${weightGain}kg on ${newLift.exercise.replace(/_/g, ' ')}. Your turn to level up!`,
            icon: '🔥',
            read: false
          })
        );

        await Promise.all(notificationPromises);

        return Response.json({ 
          success: true, 
          notified: friendships.length,
          gain: weightGain 
        });
      }
    }

    return Response.json({ success: true, message: 'No gain detected or first lift' });
  } catch (error) {
    console.error('Error notifying friends:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});