import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Support both direct invocation (gymId) and automation payload (data.gym_id)
    const gymId = payload.gymId || payload.data?.gym_id;

    if (!gymId) {
      return Response.json({ error: 'Gym ID required' }, { status: 400 });
    }

    const [members, checkIns, challenges, lifts] = await Promise.all([
      base44.asServiceRole.entities.GymMembership.filter({ gym_id: gymId, status: 'active' }),
      base44.asServiceRole.entities.CheckIn.filter({ gym_id: gymId }),
      base44.asServiceRole.entities.Challenge.filter({ gym_id: gymId }),
      base44.asServiceRole.entities.Lift.filter({ gym_id: gymId })
    ]);

    // Active members (checked in this month)
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const activeMembers = new Set(
      checkIns.filter(c => new Date(c.check_in_date) > monthAgo).map(c => c.user_id)
    ).size;

    // Total stats
    const totalWeight = lifts.reduce((sum, l) => sum + (l.weight_lbs * (l.reps || 1)), 0);
    const challengesWon = challenges.filter(c => c.status === 'completed').length;

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(
      100,
      (activeMembers / (members.length || 1)) * 40 +
      (checkIns.length / Math.max(1, members.length * 10)) * 30 +
      (challengesWon / Math.max(1, members.length / 5)) * 30
    );

    const stats = {
      gym_id: gymId,
      total_members: members.length,
      active_members: activeMembers,
      total_lifts: lifts.length,
      total_weight_moved: totalWeight,
      challenges_won: challengesWon,
      engagement_score: Math.round(engagementScore)
    };

    // Update or create GymStats record
    const existingStats = await base44.asServiceRole.entities.GymStats.filter({ gym_id: gymId });
    if (existingStats.length > 0) {
      await base44.asServiceRole.entities.GymStats.update(existingStats[0].id, stats);
    }

    return Response.json(stats);
  } catch (error) {
    console.error('Error calculating gym stats:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});