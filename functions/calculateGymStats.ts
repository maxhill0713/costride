import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    await base44.auth.me();

    const { gymId } = await req.json();

    if (!gymId) {
      return Response.json({ error: 'Gym ID required' }, { status: 400 });
    }

    const [members, checkIns, challenges, lifts] = await Promise.all([
      base44.entities.GymMembership.filter({ gym_id: gymId, status: 'active' }),
      base44.entities.CheckIn.filter({ gym_id: gymId }),
      base44.entities.Challenge.filter({ gym_id: gymId }),
      base44.entities.Lift.filter({ gym_id: gymId })
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

    return Response.json(stats);
  } catch (error) {
    console.error('Error calculating gym stats:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});