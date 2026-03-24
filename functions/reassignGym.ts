import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [CRITICAL]:
// 1. Was calling Gym.list() — full table scan with no scope.
// 2. Any authenticated user could call this and set themselves as owner of any gym by name.
//    Now restricted to admin only — this is a privileged admin operation.
// 3. Raw error.message suppressed.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: This is an admin-only function — gym ownership reassignment must never
    // be self-service.
    if (user.role !== 'admin') {
      console.warn(`SECURITY: Non-admin user ${user.email} attempted to call reassignGym`);
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { gymName, targetEmail } = await req.json();

    if (!gymName) {
      return Response.json({ error: 'Gym name is required' }, { status: 400 });
    }

    // Use scoped filter instead of listing all gyms
    const gyms = await base44.asServiceRole.entities.Gym.filter({ name: gymName });
    if (!gyms.length) {
      return Response.json({ error: 'Gym not found' }, { status: 404 });
    }

    const gym            = gyms[0];
    const newOwnerEmail  = targetEmail || user.email;

    await base44.asServiceRole.entities.Gym.update(gym.id, { owner_email: newOwnerEmail });

    // Create membership for the new owner if needed
    const memberships = await base44.asServiceRole.entities.GymMembership.filter({
      gym_id:  gym.id,
      user_id: user.id,
    });
    if (memberships.length === 0) {
      await base44.asServiceRole.entities.GymMembership.create({
        user_id:         user.id,
        user_name:       user.full_name,
        user_email:      user.email,
        gym_id:          gym.id,
        gym_name:        gym.name,
        status:          'active',
        join_date:       new Date().toISOString().split('T')[0],
        membership_type: 'lifetime',
      });
    }

    return Response.json({ success: true, gym });
  } catch (error) {
    console.error('Error reassigning gym:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});