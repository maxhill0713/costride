import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const membership = body.data;

    if (body.event.type !== 'create' || !membership) {
      return Response.json({ success: true });
    }

    // Get user's friends directly by user_id
    const friends = await base44.asServiceRole.entities.Friend.filter({
      user_id: membership.user_id
    });

    if (!friends.length) {
      return Response.json({ success: true });
    }

    // Create a single post visible to all friends
    await base44.asServiceRole.entities.Post.create({
      member_id: membership.user_id,
      member_name: membership.user_name || 'User',
      member_avatar: membership.user_avatar || '',
      content: `just joined ${membership.gym_name}!`,
      likes: 0,
      comments: [],
      reactions: {},
      gym_join: true
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Gym join notification error:', error.message);
    return Response.json({ success: true });
  }
});