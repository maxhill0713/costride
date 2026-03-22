import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch all user data
    const [lifts, checkIns, challenges, workoutLogs] = await Promise.all([
      base44.entities.Lift.filter({ member_id: userId }),
      base44.entities.CheckIn.filter({ user_id: userId }, '-check_in_date'),
      base44.entities.Challenge.filter({ participants: { $in: [userId] } }),
      base44.entities.WorkoutLog.filter({ user_id: userId })
    ]);

    // Calculate stats
    const totalLifts = lifts.length;
    const personalRecords = lifts.filter(l => l.is_pr).length;
    const totalWeight = lifts.reduce((sum, l) => sum + (l.weight_lbs * (l.reps || 1)), 0);
    const bestLift = Math.max(...lifts.map(l => l.weight_lbs), 0);
    const completedChallenges = challenges.filter(c => c.status === 'completed').length;
    const totalCheckIns = checkIns.length;

    // Calculate current streak
    const calculateStreak = () => {
      if (checkIns.length === 0) return 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastCheckInDate = new Date(checkIns[0].check_in_date);
      lastCheckInDate.setHours(0, 0, 0, 0);
      
      const daysSinceLastCheckIn = Math.floor((today - lastCheckInDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastCheckIn > 1) return 0;
      
      let streak = 1;
      for (let i = 0; i < checkIns.length - 1; i++) {
        const current = new Date(checkIns[i].check_in_date);
        const next = new Date(checkIns[i + 1].check_in_date);
        current.setHours(0, 0, 0, 0);
        next.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((current - next) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1 || daysDiff === 2) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };

    const currentStreak = calculateStreak();

    return Response.json({
      stats: {
        totalLifts,
        personalRecords,
        totalWeight,
        bestLift,
        completedChallenges,
        totalCheckIns,
        currentStreak
      }
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});