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

    // Filter out any obviously invalid IDs before querying
    const validIds = userIds.slice(0, 200).filter(id => id && typeof id === 'string' && id.length >= 12);
    if (validIds.length === 0) {
      return Response.json({ users: [] });
    }

    const users = await base44.asServiceRole.entities.User.filter(
      { id: { $in: validIds } }
    );

    // Map users by ID to ensure correct association even if query returns different order
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = {
        id: u.id,
        full_name: u.full_name,
        display_name: u.display_name || null,
        avatar_url: u.avatar_url || u.profile_picture || u.photo_url || null,
        username: u.username || null,
      };
    });

    // Return in the same order as requested to maintain consistency
    const safeUsers = validIds.map(id => userMap[id]).filter(Boolean);

    return Response.json({ users: safeUsers });
  } catch (error) {
    console.error('getFriendUsers error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});