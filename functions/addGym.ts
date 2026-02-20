import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymData } = await req.json();

    if (!gymData || !gymData.name || !gymData.google_place_id) {
      return Response.json({ error: 'gymData with name and google_place_id required' }, { status: 400 });
    }

    // Check if gym already exists with this google_place_id
    const existingGyms = await base44.asServiceRole.entities.Gym.filter({ google_place_id: gymData.google_place_id });

    let gym;
    let isNew = false;

    if (existingGyms.length > 0) {
      gym = existingGyms[0];
      console.log(`Gym already exists: ${gym.id}`);
    } else {
      // Create new gym using service role (bypasses admin-only RLS)
      gym = await base44.asServiceRole.entities.Gym.create({
        ...gymData,
        status: 'approved',
        members_count: 0
      });
      isNew = true;
      console.log(`Created new gym: ${gym.id}`);

      // Generate join code for the new gym
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let joinCode = '';
      for (let i = 0; i < 6; i++) {
        joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinCode)}`;
      await base44.asServiceRole.entities.Gym.update(gym.id, { join_code: joinCode, qr_code: qrCodeUrl });
    }

    // Check if user already has a membership for this gym
    const existingMembership = await base44.asServiceRole.entities.GymMembership.filter({
      user_id: user.id,
      gym_id: gym.id
    });

    if (existingMembership.length === 0) {
      await base44.asServiceRole.entities.GymMembership.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        membership_type: 'monthly'
      });
      console.log(`Created membership for user ${user.id} at gym ${gym.id}`);
    }

    return Response.json({ gym, isNew });
  } catch (error) {
    console.error('addGym error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});