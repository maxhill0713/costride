import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user's gyms as admin
    const allGyms = await base44.asServiceRole.entities.Gym.list();
    const userGyms = allGyms.filter(g => g.admin_id === user.id || g.owner_email === user.email);

    // Delete all user's gyms
    for (const gym of userGyms) {
      await base44.asServiceRole.entities.Gym.delete(gym.id);
    }

    // Delete all user's check-ins
    const allCheckIns = await base44.asServiceRole.entities.CheckIn.list();
    const userCheckIns = allCheckIns.filter(c => c.user_id === user.id);
    for (const checkIn of userCheckIns) {
      await base44.asServiceRole.entities.CheckIn.delete(checkIn.id);
    }

    // Delete all user's gym memberships
    const allMemberships = await base44.asServiceRole.entities.GymMembership.list();
    const userMemberships = allMemberships.filter(m => m.user_id === user.id);
    for (const membership of userMemberships) {
      await base44.asServiceRole.entities.GymMembership.delete(membership.id);
    }

    // Delete all user's lifts
    const allLifts = await base44.asServiceRole.entities.Lift.list();
    const userLifts = allLifts.filter(l => l.member_id === user.id);
    for (const lift of userLifts) {
      try {
        await base44.asServiceRole.entities.Lift.delete(lift.id);
      } catch (e) {
        console.warn('Lift already deleted or not found:', lift.id);
      }
    }

    // Delete all user's goals
    const allGoals = await base44.asServiceRole.entities.Goal.list();
    const userGoals = allGoals.filter(g => g.user_id === user.id);
    for (const goal of userGoals) {
      try {
        await base44.asServiceRole.entities.Goal.delete(goal.id);
      } catch (e) {
        console.warn('Goal already deleted or not found:', goal.id);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Account deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});