import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authenticated user — prevents unauthenticated enumeration
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ avatars: {} }, { status: 401 });
    }

    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ avatars: {} });
    }

    // Cap to 100 IDs to prevent bulk enumeration
    const safeIds = userIds.slice(0, 100);

    const users = await base44.asServiceRole.entities.User.filter({
      id: { $in: safeIds }
    });

    // Only return public profile fields — prefer display_name (username) over full_name
    const avatars = {};
    users.forEach(user => {
      avatars[user.id] = {
        full_name: user.display_name || user.username || user.full_name || 'Unknown',
        avatar_url: user.avatar_url || null
      };
    });

    return Response.json({ avatars });
  } catch (error) {
    console.error('Error fetching user avatars:', error.message);
    return Response.json({ avatars: {}, error: error.message }, { status: 500 });
  }
});