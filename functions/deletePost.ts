import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();

    if (!postId) {
      return Response.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const post = await base44.asServiceRole.entities.Post.filter({ id: postId });
    if (post.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post[0].member_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.entities.Post.delete(postId);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});