import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { authorIds, since } = await req.json();

    if (!authorIds || !Array.isArray(authorIds) || authorIds.length === 0) {
      return Response.json({ posts: [] });
    }

    // Limit to prevent abuse
    const safeAuthorIds = authorIds.slice(0, 100);

    // Verify the current user is actually friends with these people OR is one of them
    const friends = await base44.asServiceRole.entities.Friend.filter({
      user_id: user.id,
      status: 'accepted',
    });
    const friendIds = friends.map(f => f.friend_id);
    
    // Only allow fetching posts from confirmed friends + the user themselves
    const allowedIds = safeAuthorIds.filter(id => friendIds.includes(id) || id === user.id);

    if (allowedIds.length === 0) {
      return Response.json({ posts: [] });
    }

    const sinceDate = since || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    const posts = await base44.asServiceRole.entities.Post.filter(
      {
        member_id: { $in: allowedIds },
        is_system_generated: { $ne: true },
        created_date: { $gte: sinceDate },
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