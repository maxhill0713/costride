import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userIds = [] } = await req.json();

    if (userIds.length === 0) {
      return Response.json({ users: [] });
    }

    const users = await base44.asServiceRole.entities.User.filter(
      { id: { $in: userIds.slice(0, 200) } }
    );

    // Only return safe public fields — no sensitive data
    const safeUsers = users.map(u => ({
      id: u.id,
      full_name: u.full_name,
      display_name: u.display_name || null,
      avatar_url: u.avatar_url || u.profile_picture || u.photo_url || null,
      username: u.username || null,
    }));

    return Response.json({ users: safeUsers });
  } catch (error) {
    console.error('getFriendUsers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});