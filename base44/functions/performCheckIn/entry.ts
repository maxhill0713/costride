import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymId, userLat, userLon } = await req.json();

    if (!gymId) {
      return Response.json({ error: 'Gym ID required' }, { status: 400 });
    }

    // Fetch gym details for location verification
    const gymData = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
    if (!gymData || gymData.length === 0) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }

    const gym = gymData[0];

    // If gym has coordinates, location is required and must be within 500m
    if (gym.latitude && gym.longitude) {
      if (userLat == null || userLon == null) {
        return Response.json({ error: 'Location required to check in to this gym' }, { status: 400 });
      }
      const R = 6371000;
      const dLat = (gym.latitude - userLat) * Math.PI / 180;
      const dLon = (gym.longitude - userLon) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(userLat * Math.PI / 180) * Math.cos(gym.latitude * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (distance > 500) {
        return Response.json({
          error: `You're ${Math.round(distance)}m away. Must be within 500m of the gym to check in.`,
          distance,
          required: 500
        }, { status: 400 });
      }
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckIn = await base44.entities.CheckIn.filter({
      user_id: user.id,
      gym_id: gymId,
      check_in_date: { $gte: today.toISOString() }
    });

    if (todayCheckIn.length > 0) {
      return Response.json({ error: 'Already checked in today' }, { status: 400 });
    }

    // Determine if this is the user's first ever visit to this gym
    const previousVisits = await base44.entities.CheckIn.filter({ user_id: user.id, gym_id: gymId });
    const isFirstVisit = previousVisits.length === 0;

    const checkIn = await base44.entities.CheckIn.create({
      user_id: user.id,
      user_name: user.full_name,
      gym_id: gymId,
      gym_name: gym.name,
      check_in_date: new Date().toISOString(),
      first_visit: isFirstVisit,
    });

    // Update challenge progress immediately
    try {
      await base44.functions.invoke('updateChallengeProgress', {
        event: {
          type: 'create',
          entity_name: 'CheckIn',
          data: { user_id: user.id }
        }
      });
    } catch (e) {
      console.warn('Failed to update challenge progress:', e.message);
    }

    return Response.json({ checkIn });
  } catch (error) {
    console.error('Error performing check-in:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});