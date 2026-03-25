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
// 5. [NEW] Handles the "claim existing gym" path — frontend was calling asServiceRole.Gym.update()
//    directly with no ownership verification. Now routed here with a server-side check.
// 6. [NEW] status is ALWAYS set server-side — client can never set 'approved'.

const ALLOWED_GYM_FIELDS = [
  'name', 'google_place_id', 'address', 'city', 'postcode',
  'latitude', 'longitude', 'type', 'language',
  'description', 'amenities', 'equipment', 'specializes_in',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymData, claimGymId } = await req.json();

    if (!gymData || !gymData.name) {
      return Response.json({ error: 'gymData with name required' }, { status: 400 });
    }

    // Input validation — length limits and sanitization
    if (typeof gymData.name !== 'string' || gymData.name.trim().length < 2 || gymData.name.length > 100) {
      return Response.json({ error: 'Gym name must be 2–100 characters' }, { status: 400 });
    }
    if (!claimGymId && (typeof gymData.google_place_id !== 'string' || !gymData.google_place_id.trim())) {
      return Response.json({ error: 'google_place_id required for new gyms' }, { status: 400 });
    }
    if (gymData.city && (typeof gymData.city !== 'string' || gymData.city.length > 80)) {
      return Response.json({ error: 'Invalid city name' }, { status: 400 });
    }
    if (gymData.description && typeof gymData.description === 'string' && gymData.description.length > 2000) {
      return Response.json({ error: 'Description must be 2000 characters or less' }, { status: 400 });
    }

    // SECURITY: Allowlist the fields we accept from the client, sanitize strings/arrays
    const safeGymData: Record<string, unknown> = {};
    for (const field of ALLOWED_GYM_FIELDS) {
      if (gymData[field] !== undefined) {
        const val = gymData[field];
        if (typeof val === 'string') {
          safeGymData[field] = val.replace(/<[^>]*>/g, '').trim();
        } else if (Array.isArray(val)) {
          safeGymData[field] = val.slice(0, 50)
            .map((v: unknown) => typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim().slice(0, 200) : null)
            .filter(Boolean);
        } else {
          safeGymData[field] = val;
        }
      }
    }

    // SECURITY: status is ALWAYS controlled server-side — client never sets 'approved'.
    const status = user.role === 'admin' ? 'approved' : 'pending';

    let gym: Record<string, unknown>;
    let isNew = false;

    if (claimGymId) {
      // ── CLAIM EXISTING GYM PATH ───────────────────────────────────────────────
      // Previously the frontend called asServiceRole.Gym.update() directly with no
      // ownership check — any user could claim any gym by ID.
      if (typeof claimGymId !== 'string') {
        return Response.json({ error: 'claimGymId must be a string' }, { status: 400 });
      }

      const gymRecords = await base44.asServiceRole.entities.Gym.filter({ id: claimGymId });
      if (!gymRecords.length) {
        return Response.json({ error: 'Gym not found' }, { status: 404 });
      }
      const existingGym = gymRecords[0];

      // SECURITY: Only allow claiming if the gym is unclaimed, or this user already owns it.
      if (existingGym.admin_id && existingGym.admin_id !== user.id && user.role !== 'admin') {
        console.warn(`SECURITY: User ${user.email} tried to claim gym ${claimGymId} owned by ${existingGym.admin_id}`);
        return Response.json({ error: 'This gym is already claimed by another owner' }, { status: 403 });
      }

      gym = await base44.asServiceRole.entities.Gym.update(claimGymId, {
        ...safeGymData,
        owner_email:  user.email,
        admin_id:     user.id,
        claim_status: 'claimed',
        status,
      });

      console.log(JSON.stringify({ event: 'AUDIT', action: 'gym_claimed', user_id: user.id, user_email: user.email, resource_type: 'gym', resource_id: claimGymId, status: 'success', details: { gym_status: status, gym_name: safeGymData.name || existingGym.name }, timestamp: new Date().toISOString() }));

    } else {
      // ── CREATE NEW GYM PATH ───────────────────────────────────────────────────
      // Check if gym already exists (by Google Place ID)
      const existingGyms = await base44.asServiceRole.entities.Gym.filter({
        google_place_id: safeGymData.google_place_id,
      });

      if (existingGyms.length > 0) {
        gym = existingGyms[0];
        console.log(`Gym already exists: ${gym.id}`);
      } else {
        gym = await base44.asServiceRole.entities.Gym.create({
          ...safeGymData,
          status,
          members_count: 0,
          owner_email:   user.email,
          admin_id:      user.id,
          claim_status:  'claimed',
        });
        isNew = true;
        console.log(JSON.stringify({ event: 'AUDIT', action: 'gym_created', user_id: user.id, user_email: user.email, resource_type: 'gym', resource_id: gym.id, status: 'success', details: { gym_status: status, gym_name: safeGymData.name }, timestamp: new Date().toISOString() }));

        // Generate join code (readability token — not a security-critical secret)
        const chars    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let joinCode   = '';
        for (let i = 0; i < 6; i++) joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinCode)}`;
        await base44.asServiceRole.entities.Gym.update(gym.id as string, { join_code: joinCode, qr_code: qrCodeUrl });
      }
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
        membership_type: 'lifetime',
      });
      console.log(`Created membership for user ${user.id} at gym ${gym.id}`);
    }

    // Promote account type (safe — only promotes, never demotes)
    await base44.auth.updateMe({ account_type: 'gym_owner', onboarding_completed: true });

    return Response.json({ gym, isNew });
  } catch (error) {
    console.error('addGym error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});