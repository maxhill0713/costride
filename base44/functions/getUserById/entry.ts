import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 });
    }

    let results = [];
    try {
      results = await base44.asServiceRole.entities.User.filter({ id: userId });
    } catch {
      return Response.json({ user: null }, { status: 200 });
    }
    const found = results[0] || null;

    if (!found) {
      return Response.json({ user: null }, { status: 200 });
    }

    // Return safe public fields only
    return Response.json({
      user: {
        id: found.id,
        full_name: found.full_name,
        username: found.username || null,
        avatar_url: found.avatar_url || null,
        current_streak: found.current_streak || 0,
        longest_streak: found.longest_streak || 0,
        primary_gym_id: found.primary_gym_id || null,
        equipped_badges: found.equipped_badges || [],
      }
    });
  } catch (error) {
    console.error('Error getting user by id:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});