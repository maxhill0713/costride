import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [HIGH]:
// ModeratorDashboard.jsx was calling base44.asServiceRole.entities.Post.update/delete
// directly from the browser with only a client-side role check. Any authenticated user
// who bypassed the React guard could read all hidden posts and delete/unhide any post.
// This function enforces admin role server-side.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      console.warn(`SECURITY: Non-admin user ${user.email} tried to moderate a post`);
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const { postId, action } = await req.json();

    if (!postId || typeof postId !== 'string') {
      return Response.json({ error: 'postId required' }, { status: 400 });
    }

    const VALID_ACTIONS = ['unhide', 'delete', 'list'];
    if (!action || !VALID_ACTIONS.includes(action)) {
      return Response.json({ error: 'action must be "list", "unhide", or "delete"' }, { status: 400 });
    }

    if (action === 'list') {
      const posts = await base44.asServiceRole.entities.Post.filter({ is_hidden: true }, '-created_date', 100);
      return Response.json({ posts });
    }

    const posts = await base44.asServiceRole.entities.Post.filter({ id: postId });
    if (!posts.length) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    if (action === 'unhide') {
      await base44.asServiceRole.entities.Post.update(postId, { is_hidden: false });
      console.log(JSON.stringify({ event: 'AUDIT', action: 'post_unhidden', user_id: user.id, user_email: user.email, resource_type: 'post', resource_id: postId, status: 'success', timestamp: new Date().toISOString() }));
      return Response.json({ success: true });
    }

    if (action === 'delete') {
      await base44.asServiceRole.entities.Post.delete(postId);
      console.log(JSON.stringify({ event: 'AUDIT', action: 'post_deleted_by_admin', user_id: user.id, user_email: user.email, resource_type: 'post', resource_id: postId, status: 'success', timestamp: new Date().toISOString() }));
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('moderatePost error:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});
