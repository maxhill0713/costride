import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]: SDK version + XSS strip + raw error suppressed

function sanitise(str, maxLen = 2000) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

function isValidUrl(url) {
  if (url === null || url === undefined) return true;
  try {
    const u = new URL(url);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, content, image_url, video_url } = await req.json();

    if (!postId) {
      return Response.json({ error: 'Post ID is required' }, { status: 400 });
    }
    if (image_url !== undefined && !isValidUrl(image_url)) {
      return Response.json({ error: 'Invalid image URL' }, { status: 400 });
    }
    if (video_url !== undefined && !isValidUrl(video_url)) {
      return Response.json({ error: 'Invalid video URL' }, { status: 400 });
    }

    const posts = await base44.asServiceRole.entities.Post.filter({ id: postId });
    if (posts.length === 0) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    // Ownership check
    if (posts[0].member_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await base44.entities.Post.update(postId, {
      content:   content ? sanitise(content, 2000) : posts[0].content,
      image_url: image_url !== undefined ? image_url : posts[0].image_url,
      video_url: video_url !== undefined ? video_url : posts[0].video_url,
    });

    return Response.json({ post: updated });
  } catch (error) {
    console.error('Error updating post:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});