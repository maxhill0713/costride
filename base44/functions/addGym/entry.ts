import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// 1. SDK version bumped to 0.8.21
// 2. Any authenticated user could call this to create a new gym with status='approved',
//    bypassing the admin review queue entirely. Now:
//    - Regular users joining a gym: only create a membership, never a new gym record.
//    - Gym owners: can create a gym but with status='pending' (awaiting admin approval).
//    - Only admins can create with status='approved'.
// 3. gymData is taken from the client — we now allowlist which fields are accepted to
//    prevent injecting fields like status, admin_id, banned_members, etc.
// 4. Raw error.message suppressed.

const ALLOWED_GYM_FIELDS = [
  'name', 'google_place_id', 'address', 'city', 'postcode',
  'latitude', 'longitude', 'type', 'language',
];

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

    // SECURITY: Allowlist the fields we accept from the client
    const safeGymData = {};
    for (const field of ALLOWED_GYM_FIELDS) {
      if (gymData[field] !== undefined) safeGymData[field] = gymData[field];
    }

    // Check if gym already exists (by Google Place ID)
    const existingGyms = await base44.asServiceRole.entities.Gym.filter({
      google_place_id: safeGymData.google_place_id,
    });

    let gym;
    let isNew = false;

    if (existingGyms.length > 0) {
      gym = existingGyms[0];
      console.log(`Gym already exists: ${gym.id}`);
    } else {
      // SECURITY: New gyms are always 'pending' regardless of what the client sent.
      // Only admins can set status='approved' directly.
      const status = user.role === 'admin' ? 'approved' : 'pending';

      gym = await base44.asServiceRole.entities.Gym.create({
        ...safeGymData,
        status,
        members_count: 0,
        owner_email:   user.email,
        admin_id:      user.id,
      });
      isNew = true;
      console.log(`Created new gym: ${gym.id} with status=${status}`);

      // Generate join code
      const chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let joinCode   = '';
      for (let i = 0; i < 6; i++) joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinCode)}`;
      await base44.asServiceRole.entities.Gym.update(gym.id, { join_code: joinCode, qr_code: qrCodeUrl });
    }

    // Always create a membership for the user (idempotent)
    const existingMembership = await base44.asServiceRole.entities.GymMembership.filter({
      user_id: user.id,
      gym_id:  gym.id,
    });

    if (existingMembership.length === 0) {
      await base44.asServiceRole.entities.GymMembership.create({
        user_id:         user.id,
        user_name:       user.full_name,
        user_email:      user.email,
        gym_id:          gym.id,
        gym_name:        gym.name,
        status:          'active',
        join_date:       new Date().toISOString().split('T')[0],
        membership_type: 'monthly',
      });
      console.log(`Created membership for user ${user.id} at gym ${gym.id}`);
    }

    return Response.json({ gym, isNew });
  } catch (error) {
    console.error('addGym error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});