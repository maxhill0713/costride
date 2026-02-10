import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') {
      return Response.json({ success: true });
    }

    const membership = data;

    // Get the user who joined
    const users = await base44.asServiceRole.entities.User.filter({ id: membership.user_id });
    if (!users.length) {
      return Response.json({ success: true });
    }
    const user = users[0];

    // Get user's friends
    const friends = await base44.asServiceRole.entities.Friend.filter({
      user_id: membership.user_id,
      status: 'accepted'
    });

    // Create post for each friend
    for (const friend of friends) {
      await base44.asServiceRole.entities.Post.create({
        member_id: membership.user_id,
        member_name: user.full_name || user.username || 'User',
        member_avatar: user.avatar_url || '',
        content: `${user.full_name || user.username || 'User'} just joined ${membership.gym_name}!`,
        likes: 0,
        comments: [],
        reactions: {},
        gym_join: true // Flag for styling
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error creating gym join notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});