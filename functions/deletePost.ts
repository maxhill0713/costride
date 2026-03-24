import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [LOW]: SDK version + raw error suppressed

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

    const posts = await base44.asServiceRole.entities.Post.filter({ id: postId });
    if (posts.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const isOwner = posts[0].member_id === user.id;
    const isAdmin = user.role === 'admin';

    // Gym owners can delete posts in their gym
    let isGymOwnerOfPost = false;
    if (!isOwner && !isAdmin && posts[0].gym_id) {
      const gyms = await base44.asServiceRole.entities.Gym.filter({ id: posts[0].gym_id });
      if (gyms.length > 0) {
        isGymOwnerOfPost = gyms[0].owner_email === user.email || gyms[0].admin_id === user.id;
      }
    }

    if (!isOwner && !isAdmin && !isGymOwnerOfPost) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    await base44.asServiceRole.entities.Post.delete(postId);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});