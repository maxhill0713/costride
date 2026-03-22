import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, image_url, video_url, allow_gym_repost } = await req.json();

    const post = await base44.entities.Post.create({
      member_id: user.id,
      member_name: user.full_name,
      member_avatar: user.avatar_url,
      content,
      image_url: image_url || null,
      video_url: video_url || null,
      likes: 0,
      comments: [],
      reactions: {},
      allow_gym_repost: allow_gym_repost || false
    });

    return Response.json({ post });
  } catch (error) {
    console.error('Error creating post:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});