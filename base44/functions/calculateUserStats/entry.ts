import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [LOW]:
// 1. SDK version bumped.
// 2. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const [lifts, checkIns, challenges, workoutLogs] = await Promise.all([
      base44.entities.Lift.filter({ member_id: userId }),
      base44.entities.CheckIn.filter({ user_id: userId }, '-check_in_date'),
      base44.entities.Challenge.filter({ participants: { $in: [userId] } }),
      base44.entities.WorkoutLog.filter({ user_id: userId }),
    ]);

    const totalLifts         = lifts.length;
    const personalRecords    = lifts.filter(l => l.is_pr).length;
    const totalWeight        = lifts.reduce((sum, l) => sum + (l.weight_lbs * (l.reps || 1)), 0);
    const bestLift           = lifts.length ? Math.max(...lifts.map(l => l.weight_lbs)) : 0;
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const totalCheckIns      = checkIns.length;

    const calculateStreak = () => {
      if (!checkIns.length) return 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const last  = new Date(checkIns[0].check_in_date); last.setHours(0, 0, 0, 0);
      if (Math.floor((today - last) / 86400000) > 1) return 0;
      let streak = 1;
      for (let i = 0; i < checkIns.length - 1; i++) {
        const a = new Date(checkIns[i].check_in_date);   a.setHours(0,0,0,0);
        const b = new Date(checkIns[i+1].check_in_date); b.setHours(0,0,0,0);
        const d = Math.floor((a - b) / 86400000);
        if (d === 1 || d === 2) streak++;
        else break;
      }
      return streak;
    };

    return Response.json({
      stats: {
        totalLifts, personalRecords, totalWeight, bestLift,
        completedChallenges, totalCheckIns,
        currentStreak: calculateStreak(),
      },
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});