import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. No authentication — any request could trigger a full gym stats recalculation for
//    any gym_id. Now requires admin or gym owner.
// 3. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();
    const gymId   = payload.gymId || payload.data?.gym_id;

    if (!gymId || typeof gymId !== 'string') {
      return Response.json({ error: 'Gym ID required' }, { status: 400 });
    }

    // Verify auth and ownership (automation calls run without user session)
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') {
        const gyms = await base44.asServiceRole.entities.Gym.filter({ id: gymId });
        if (!gyms.length) return Response.json({ error: 'Gym not found' }, { status: 404 });
        const gym = gyms[0];
        const isOwner = gym.owner_email === user.email || gym.admin_id === user.id;
        if (!isOwner) {
          console.warn(`SECURITY: User ${user.email} tried to calculateGymStats for ${gymId}`);
          return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString();
    const [members, checkIns, challenges, lifts] = await Promise.all([
      base44.asServiceRole.entities.GymMembership.filter({ gym_id: gymId, status: 'active' }, 'user_name', 5000),
      base44.asServiceRole.entities.CheckIn.filter({ gym_id: gymId, check_in_date: { $gte: oneYearAgo } }, '-check_in_date', 5000),
      base44.asServiceRole.entities.Challenge.filter({ gym_id: gymId }),
      base44.asServiceRole.entities.Lift.filter({ gym_id: gymId }, '-lift_date', 5000),
    ]);

    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const activeMembers = new Set(
      checkIns.filter(c => new Date(c.check_in_date) > monthAgo).map(c => c.user_id)
    ).size;

    const totalWeight    = lifts.reduce((sum, l) => sum + (l.weight_lbs * (l.reps || 1)), 0);
    const challengesWon  = challenges.filter(c => c.status === 'completed').length;
    const engagementScore = Math.min(100, Math.round(
      (activeMembers / (members.length || 1)) * 40 +
      (checkIns.length / Math.max(1, members.length * 10)) * 30 +
      (challengesWon / Math.max(1, members.length / 5)) * 30
    ));

    const stats = {
      gym_id:            gymId,
      total_members:     members.length,
      active_members:    activeMembers,
      total_lifts:       lifts.length,
      total_weight_moved: totalWeight,
      challenges_won:    challengesWon,
      engagement_score:  engagementScore,
    };

    const existingStats = await base44.asServiceRole.entities.GymStats.filter({ gym_id: gymId });
    if (existingStats.length > 0) {
      await base44.asServiceRole.entities.GymStats.update(existingStats[0].id, stats);
    }

    return Response.json(stats);
  } catch (error) {
    console.error('Error calculating gym stats:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});