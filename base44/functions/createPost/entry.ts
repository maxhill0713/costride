import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// SECURITY FIX [MEDIUM]:
// 1. SDK version bumped to 0.8.21
// 2. Content length cap + XSS strip (image/video URLs validated)
// 3. Raw error.message no longer leaked to client

function sanitise(str, maxLen = 2000) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

function isValidUrl(url) {
  if (!url) return true; // optional
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

    const { content, image_url, video_url, allow_gym_repost } = await req.json();

    const safeContent = sanitise(content, 2000);
    if (!safeContent) {
      return Response.json({ error: 'Content is required' }, { status: 400 });
    }

    if (image_url && !isValidUrl(image_url)) {
      return Response.json({ error: 'Invalid image URL' }, { status: 400 });
    }
    if (video_url && !isValidUrl(video_url)) {
      return Response.json({ error: 'Invalid video URL' }, { status: 400 });
    }

    const post = await base44.entities.Post.create({
      member_id:         user.id,
      member_name:       user.full_name,
      member_avatar:     user.avatar_url || null,
      content:           safeContent,
      image_url:         image_url || null,
      video_url:         video_url || null,
      likes:             0,
      comments:          [],
      reactions:         {},
      allow_gym_repost:  allow_gym_repost === true,
    });

    return Response.json({ post });
  } catch (error) {
    console.error('Error creating post:', error);
    return Response.json({ error: 'An internal error occurred' }, { status: 500 });
  }
});