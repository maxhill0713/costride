import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymId } = await req.json();

    if (!gymId) {
      return Response.json({ error: 'Gym ID required' }, { status: 400 });
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

    // Create check-in
    const checkIn = await base44.entities.CheckIn.create({
      user_id: user.id,
      user_name: user.full_name,
      gym_id: gymId,
      gym_name: (await base44.asServiceRole.entities.Gym.filter({ id: gymId }))[0]?.name,
      check_in_date: new Date().toISOString(),
      first_visit: false
    });

    // Calculate streak
    const allCheckIns = await base44.entities.CheckIn.filter({ user_id: user.id }, '-check_in_date');
    let streak = 1;
    for (let i = 0; i < allCheckIns.length - 1; i++) {
      const current = new Date(allCheckIns[i].check_in_date);
      const next = new Date(allCheckIns[i + 1].check_in_date);
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((current - next) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1 || daysDiff === 2) streak++;
      else break;
    }

    // Update user's current streak
    await base44.auth.updateMe({ current_streak: streak });

    return Response.json({ checkIn, streak });
  } catch (error) {
    console.error('Error performing check-in:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});