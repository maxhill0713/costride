import { createClientFromRequest } from 'npm:@base44/sdk@0.8.26';

async function fetchAndUploadPhoto(base44, photoUrl) {
  try {
    const imgRes = await fetch(photoUrl);
    if (!imgRes.ok) return null;
    const imgBuffer   = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const ext         = contentType.includes('png') ? 'png' : 'jpg';
    const blob        = new Blob([imgBuffer], { type: contentType });
    const file        = new File([blob], `gym_photo.${ext}`, { type: contentType });
    const result      = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    return result?.file_url || null;
  } catch (e) {
    console.warn('Photo upload failed:', e.message);
    return null;
  }
}

const GYM_CREATION_LIMIT = 5; // max gyms a single user can add to the platform
const GYM_MEMBERSHIP_LIMIT = 3; // max gyms a user can be a member of at once

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymData, skipMembership } = await req.json();

    if (!gymData?.name || !gymData?.city) {
      return Response.json({ error: 'Missing required gym fields (name, city)' }, { status: 400 });
    }

    // Check membership limit before doing anything
    if (!skipMembership) {
      const currentMemberships = await base44.asServiceRole.entities.GymMembership.filter({ user_id: user.id, status: 'active' });
      if (currentMemberships.length >= GYM_MEMBERSHIP_LIMIT) {
        return Response.json({ error: 'GYM_MEMBERSHIP_LIMIT', limit: GYM_MEMBERSHIP_LIMIT }, { status: 403 });
      }
    }

    // Check if gym already exists by google_place_id to avoid duplicates
    if (gymData.google_place_id) {
      const existing = await base44.asServiceRole.entities.Gym.filter({ google_place_id: gymData.google_place_id });
      if (existing && existing.length > 0) {
        const gym = existing[0];
        console.log(`Gym already exists: ${gym.id} (${gym.name})`);
        // Still create membership if not already a member
        if (!skipMembership) {
          const existingMembership = await base44.asServiceRole.entities.GymMembership.filter({ user_id: user.id, gym_id: gym.id, status: 'active' });
          if (existingMembership.length === 0) {
            await base44.asServiceRole.entities.GymMembership.create({
              user_id: user.id,
              user_name: user.full_name,
              user_email: user.email,
              gym_id: gym.id,
              gym_name: gym.name,
              status: 'active',
              join_date: new Date().toISOString().split('T')[0],
              membership_type: 'monthly',
            });
            console.log(`Created membership for existing gym ${gym.id} for user ${user.id}`);
          }
        }
        return Response.json({ gym, alreadyExists: true });
      }
    }

    // Enforce per-user gym creation limit (count gyms created by this user's ID)
    const userCreatedGyms = await base44.asServiceRole.entities.Gym.filter({ created_by_user_id: user.id });
    if (userCreatedGyms.length >= GYM_CREATION_LIMIT) {
      return Response.json({ error: 'GYM_CREATION_LIMIT', limit: GYM_CREATION_LIMIT }, { status: 403 });
    }

    // Resolve image: download & permanently upload the Google Places photo if present
    let resolvedImageUrl = gymData.image_url || null;
    if (!resolvedImageUrl && gymData.photo_url) {
      resolvedImageUrl = await fetchAndUploadPhoto(base44, gymData.photo_url);
    }

    // Create the gym using service role (bypasses RLS which requires admin)
    const { photo_url: _unused, ...gymDataClean } = gymData;
    const gym = await base44.asServiceRole.entities.Gym.create({
      ...gymDataClean,
      ...(resolvedImageUrl ? { image_url: resolvedImageUrl } : {}),
      status: 'approved',
      members_count: 1, // the creator is the first member
      created_by_user_id: user.id, // track who created it for limit enforcement
    });

    console.log(`Gym created: ${gym.id} (${gym.name}) by user ${user.id}`);

    // Create membership for the user who added the gym
    if (!skipMembership) {
      await base44.asServiceRole.entities.GymMembership.create({
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email,
        gym_id: gym.id,
        gym_name: gym.name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        membership_type: 'monthly',
      });
      console.log(`Created membership for new gym ${gym.id} for user ${user.id}`);
    }

    // If the user is claiming ownership, update their account_type
    if (gymData.claim_status === 'claimed' && gymData.admin_id === user.id) {
      await base44.asServiceRole.entities.User.update(user.id, {
        account_type: 'gym_owner',
        primary_gym_id: gym.id,
      });
      console.log(`User ${user.id} upgraded to gym_owner for gym ${gym.id}`);
    }

    return Response.json({ gym });
  } catch (error) {
    console.error('addGym error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});