import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userIds } = await req.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ avatars: {} });
    }

    const users = await base44.asServiceRole.entities.User.filter({
      id: { $in: userIds }
    });

    const avatars = {};
    users.forEach(user => {
      avatars[user.id] = {
        username: user.username || user.full_name || 'Unknown',
        full_name: user.full_name || 'Unknown',
        avatar_url: user.avatar_url || null
      };
    });

    return Response.json({ avatars });
  } catch (error) {
    console.error('Error fetching user avatars:', error.message);
    return Response.json({ avatars: {}, error: error.message }, { status: 500 });
  }
});