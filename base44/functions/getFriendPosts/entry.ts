import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendIds = [], since } = await req.json();

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return Response.json({ posts: [] });
    }

    // Sanitise: max 200 friend IDs
    const safeIds = friendIds.slice(0, 200);

    // Validate 'since' date
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (isNaN(sinceDate.getTime())) {
      return Response.json({ error: 'Invalid since date' }, { status: 400 });
    }

    // Include the current user's own posts too (so self-posts appear)
    const authorIds = [...safeIds, user.id];

    // Use service role to bypass RLS — friends may be at different gyms
    const posts = await base44.asServiceRole.entities.Post.filter(
      {
        member_id: { $in: authorIds },
        is_system_generated: { $ne: true },
        created_date: { $gte: sinceDate.toISOString() },
      },
      '-created_date',
      200
    );

    return Response.json({ posts });
  } catch (error) {
    console.error('getFriendPosts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});