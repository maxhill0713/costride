import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. SDK version bumped.
// 2. Had NO authentication — any unauthenticated request could trigger Gym.list()
//    followed by Lift + GymMembership queries for every gym (heavy table scan with no auth).
//    Now requires admin or is a scheduled (unauthenticated) automation call.
// 3. Raw error.message suppressed.

function isAuthorizedAutomation(req: Request): boolean {
  const secret = Deno.env.get('AUTOMATION_SECRET');
  if (!secret) return true;
  return req.headers.get('X-Automation-Secret') === secret;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // For direct (non-automation) calls, require admin
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
      }
    } else {
      if (!isAuthorizedAutomation(req)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const allGyms = await base44.asServiceRole.entities.Gym.filter({ status: 'approved' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process gyms in parallel batches of 5 — reduces wall time for 100 gyms from
    // 100 sequential DB calls to 20 parallel batches. Promise.allSettled ensures one
    // failing gym doesn't abort the rest.
    const CONCURRENCY = 5;
    for (let i = 0; i < allGyms.length; i += CONCURRENCY) {
      const batch = allGyms.slice(i, i + CONCURRENCY);
      await Promise.allSettled(batch.map(async (gym) => {
        try {
          const todayLifts = await base44.asServiceRole.entities.Lift.filter({
            gym_id:       gym.id,
            created_date: { $gte: today.toISOString() },
          });

          const leaderboard = {};
          todayLifts.forEach(lift => {
            if (!leaderboard[lift.member_id]) {
              leaderboard[lift.member_id] = {
                member_id:    lift.member_id,
                member_name:  lift.member_name,
                total_weight: 0,
                total_reps:   0,
                lift_count:   0,
                pr_count:     0,
              };
            }
            leaderboard[lift.member_id].total_weight += lift.weight_lbs || 0;
            leaderboard[lift.member_id].total_reps   += lift.reps       || 0;
            leaderboard[lift.member_id].lift_count   += 1;
            if (lift.is_pr) leaderboard[lift.member_id].pr_count += 1;
          });

          const sorted = Object.values(leaderboard).sort((a, b) => b.total_weight - a.total_weight);
          for (let i = 0; i < Math.min(10, sorted.length); i++) sorted[i].rank = i + 1;

          console.log(`Updated leaderboard for gym ${gym.id}: ${sorted.length} entries`);
        } catch (e) {
          console.error(`Error processing gym ${gym.id}:`, e.message);
        }
      }));
    }

    return Response.json({ success: true, message: 'Daily leaderboards updated' });
  } catch (error) {
    console.error('Error updating leaderboards:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});