import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, action, reactionType } = await req.json();

    if (!postId || !action) {
      return Response.json({ error: 'Post ID and action required' }, { status: 400 });
    }

    const post = await base44.asServiceRole.entities.Post.filter({ id: postId });
    if (post.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    let updated = post[0];

    if (action === 'like') {
      updated = await base44.entities.Post.update(postId, {
        likes: (post[0].likes || 0) + 1
      });
    } else if (action === 'unlike') {
      updated = await base44.entities.Post.update(postId, {
        likes: Math.max(0, (post[0].likes || 0) - 1)
      });
    } else if (action === 'react') {
      const reactions = post[0].reactions || {};
      reactions[user.id] = reactionType;
      updated = await base44.entities.Post.update(postId, { reactions });
    } else if (action === 'comment') {
      const { text } = await req.json();
      const comments = post[0].comments || [];
      comments.push({
        user: user.full_name,
        text,
        timestamp: new Date().toISOString(),
        user_id: user.id
      });
      updated = await base44.entities.Post.update(postId, { comments });
    }

    return Response.json({ post: updated });
  } catch (error) {
    console.error('Error post interaction:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});