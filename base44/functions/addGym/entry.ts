import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gymData } = await req.json();

    if (!gymData?.name || !gymData?.city) {
      return Response.json({ error: 'Missing required gym fields (name, city)' }, { status: 400 });
    }

    // Check if gym already exists by google_place_id to avoid duplicates
    if (gymData.google_place_id) {
      const existing = await base44.asServiceRole.entities.Gym.filter({ google_place_id: gymData.google_place_id });
      if (existing && existing.length > 0) {
        return Response.json({ gym: existing[0], alreadyExists: true });
      }
    }

    // Create the gym using service role (bypasses RLS which requires admin)
    const gym = await base44.asServiceRole.entities.Gym.create({
      ...gymData,
      status: 'approved', // auto-approve user-submitted gyms
      members_count: gymData.members_count ?? 0,
    });

    console.log(`Gym created: ${gym.id} (${gym.name}) by user ${user.id}`);

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