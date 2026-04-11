import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { friendIds = [], limit = 200 } = await req.json();

    // Include the user's own posts too
    const authorIds = [...new Set([...friendIds, user.id])].filter(Boolean);

    if (authorIds.length === 0) {
      return Response.json({ posts: [] });
    }

    // Use service role to bypass gym_id RLS restriction
    const posts = await base44.asServiceRole.entities.Post.filter(
      {
        member_id: { $in: authorIds },
        is_system_generated: { $ne: true }
      },
      '-created_date',
      limit
    );

    return Response.json({ posts });
  } catch (error) {
    console.error('getFriendPosts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});