import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all gyms
    const allGyms = await base44.asServiceRole.entities.Gym.list();

    for (const gym of allGyms) {
      // Get all lifts for this gym today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayLifts = await base44.asServiceRole.entities.Lift.filter({
        gym_id: gym.id,
        created_date: { $gte: today.toISOString() }
      });

      // Get all members of this gym
      const members = await base44.asServiceRole.entities.GymMembership.filter({
        gym_id: gym.id,
        status: 'active'
      });

      // Calculate leaderboard
      const leaderboard = {};
      
      todayLifts.forEach(lift => {
        if (!leaderboard[lift.member_id]) {
          leaderboard[lift.member_id] = {
            member_id: lift.member_id,
            member_name: lift.member_name,
            total_weight: 0,
            total_reps: 0,
            lift_count: 0,
            pr_count: 0
          };
        }
        
        leaderboard[lift.member_id].total_weight += lift.weight_lbs || 0;
        leaderboard[lift.member_id].total_reps += lift.reps || 0;
        leaderboard[lift.member_id].lift_count += 1;
        if (lift.is_pr) leaderboard[lift.member_id].pr_count += 1;
      });

      // Sort by total weight moved
      const sorted = Object.values(leaderboard).sort((a, b) => b.total_weight - a.total_weight);

      // Store top 10
      for (let i = 0; i < Math.min(10, sorted.length); i++) {
        sorted[i].rank = i + 1;
      }

      console.log(`Updated leaderboard for gym ${gym.id}: ${sorted.length} members`);
    }

    return Response.json({ 
      success: true,
      message: 'Daily leaderboards updated'
    });
  } catch (error) {
    console.error('Error updating leaderboards:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});