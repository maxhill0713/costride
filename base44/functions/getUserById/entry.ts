import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped.
// 2. Raw error.message suppressed.
// 3. This function already strips sensitive fields correctly — kept as-is.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    if (!userId || typeof userId !== 'string') {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    let results = [];
    try {
      results = await base44.asServiceRole.entities.User.filter({ id: userId });
    } catch {
      return Response.json({ user: null });
    }
    const found = results[0] || null;
    if (!found) return Response.json({ user: null });

    // SECURITY: Only public/display fields returned — email, role, account_type never exposed
    return Response.json({
      user: {
        id:              found.id,
        full_name:       found.full_name,
        display_name:    found.display_name    || null,
        username:        found.username        || null,
        avatar_url:      found.avatar_url      || null,
        current_streak:  found.current_streak  || 0,
        longest_streak:  found.longest_streak  || 0,
        primary_gym_id:  found.primary_gym_id  || null,
        equipped_badges: found.equipped_badges || [],
        public_profile:  found.public_profile  ?? true,
      },
    });
  } catch (error) {
    console.error('Error getting user by id:', error.message);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});